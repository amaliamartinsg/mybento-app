from __future__ import annotations

import logging
import time
from dataclasses import asdict

from fastapi import FastAPI, Header, HTTPException, Request, Response
from openai import RateLimitError
from pydantic import BaseModel, HttpUrl

from src.config import load_settings
from src.logging_utils import (
    TRACE_HEADER_NAME,
    configure_logging,
    generate_trace_id,
    reset_trace_id,
    set_trace_id,
)
from src.pipeline import run_pipeline
from src.rate_limit import check_and_increment_daily_limit

configure_logging("scraper")
logger = logging.getLogger("mybento.scraper")


app = FastAPI(title="Recipe Ingestion API", version="1.0.0")


class ProcessRequest(BaseModel):
    url: HttpUrl


class IngredientResponse(BaseModel):
    name: str
    quantity_g: int | None


class RecipeResponse(BaseModel):
    name: str
    servings: int | None
    instructions_text: str
    ingredients: list[IngredientResponse]


@app.middleware("http")
async def trace_logging_middleware(request: Request, call_next):
    trace_id = request.headers.get(TRACE_HEADER_NAME) or generate_trace_id()
    token = set_trace_id(trace_id)
    started_at = time.perf_counter()

    try:
        response = await call_next(request)
    except Exception:
        duration_ms = round((time.perf_counter() - started_at) * 1000, 2)
        logger.exception(
            "request_failed",
            extra={
                "trace_id": trace_id,
                "method": request.method,
                "path": request.url.path,
                "duration_ms": duration_ms,
                "client_ip": request.client.host if request.client else None,
            },
        )
        raise
    else:
        duration_ms = round((time.perf_counter() - started_at) * 1000, 2)
        response.headers[TRACE_HEADER_NAME] = trace_id
        logger.info(
            "request_completed",
            extra={
                "trace_id": trace_id,
                "method": request.method,
                "path": request.url.path,
                "status_code": response.status_code,
                "duration_ms": duration_ms,
                "client_ip": request.client.host if request.client else None,
            },
        )
        return response
    finally:
        reset_trace_id(token)


@app.get("/health")
def healthcheck() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/process", response_model=RecipeResponse)
def process_recipe(
    request: ProcessRequest,
    response: Response,
    x_api_key: str | None = Header(default=None),
) -> RecipeResponse:
    logger.info("process_recipe_started", extra={"target_url": str(request.url)})
    try:
        settings = load_settings()
        _validate_api_key(x_api_key, settings.service_api_key)
        rate_limit_status = check_and_increment_daily_limit(
            api_key=settings.service_api_key,
            daily_limit=settings.rate_limit_daily,
            timezone_name=settings.rate_limit_timezone,
            db_path=settings.rate_limit_db_path,
        )
        _apply_rate_limit_headers(response, rate_limit_status)
        _raise_if_rate_limited(rate_limit_status)
        result = run_pipeline(
            post_url=str(request.url),
            openai_api_key=settings.openai_api_key,
            openai_model=settings.openai_model,
            assemblyai_api_key=settings.assemblyai_api_key,
            keywords=settings.keywords,
        )
    except HTTPException:
        raise
    except RateLimitError as exc:
        raise HTTPException(
            status_code=503,
            detail=(
                "OpenAI quota exceeded or provider rate limited the request. "
                "Check API billing/quota."
            ),
        ) from exc
    except Exception as exc:
        logger.exception(
            "process_recipe_failed",
            extra={"target_url": str(request.url)},
        )
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    logger.info("process_recipe_completed", extra={"target_url": str(request.url)})
    return RecipeResponse(**asdict(result.recipe))


def _validate_api_key(provided_api_key: str | None, expected_api_key: str) -> None:
    if not provided_api_key or provided_api_key != expected_api_key:
        raise HTTPException(status_code=401, detail="Invalid or missing API key")


def _apply_rate_limit_headers(response: Response, rate_limit_status: object) -> None:
    if rate_limit_status is None:
        return
    response.headers["X-RateLimit-Limit"] = str(rate_limit_status.limit)
    response.headers["X-RateLimit-Remaining"] = str(rate_limit_status.remaining)
    response.headers["X-RateLimit-Used"] = str(rate_limit_status.used)
    response.headers["X-RateLimit-Reset-Date"] = str(rate_limit_status.reset_date)


def _raise_if_rate_limited(rate_limit_status: object) -> None:
    if rate_limit_status is None:
        return
    if rate_limit_status.blocked:
        raise HTTPException(
            status_code=429,
            detail="Daily rate limit exceeded",
            headers={
                "X-RateLimit-Limit": str(rate_limit_status.limit),
                "X-RateLimit-Remaining": str(rate_limit_status.remaining),
                "X-RateLimit-Used": str(rate_limit_status.used),
                "X-RateLimit-Reset-Date": str(rate_limit_status.reset_date),
            },
        )
