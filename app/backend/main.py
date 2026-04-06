"""FastAPI entry point for MyBento backend."""

import logging
import time
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.backend.database import create_db_and_tables
from app.backend.logging_utils import (
    TRACE_HEADER_NAME,
    configure_logging,
    generate_trace_id,
    reset_trace_id,
    set_trace_id,
)
from app.backend.routers import categories, extras, menu, profile, recipes, unit_weights

configure_logging("backend")
logger = logging.getLogger("mybento.backend")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Create DB tables on startup."""
    logger.info("backend_startup")
    create_db_and_tables()
    yield
    logger.info("backend_shutdown")


app = FastAPI(
    title="MyBento API",
    description="Backend para la aplicación de gestión de recetas y menús semanales.",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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


app.include_router(recipes.router)
app.include_router(categories.router)
app.include_router(menu.router)
app.include_router(extras.router)
app.include_router(profile.router)
app.include_router(unit_weights.router)


@app.get("/health", tags=["health"])
def health_check() -> dict[str, str]:
    """Verificar que el servidor está corriendo."""
    return {"status": "ok"}
