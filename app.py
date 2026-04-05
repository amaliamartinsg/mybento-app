from __future__ import annotations

from dataclasses import asdict

from fastapi import FastAPI, Header, HTTPException, Response
from openai import RateLimitError
from pydantic import BaseModel, HttpUrl

from src.config import load_settings
from src.pipeline import run_pipeline
from src.rate_limit import check_and_increment_daily_limit


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


@app.get("/health")
def healthcheck() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/process", response_model=RecipeResponse)
def process_recipe(
    request: ProcessRequest,
    response: Response,
    x_api_key: str | None = Header(default=None),
) -> RecipeResponse:
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
        raise HTTPException(status_code=500, detail=str(exc)) from exc

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
