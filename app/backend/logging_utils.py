"""Structured JSON logging and trace context utilities for the backend."""

from __future__ import annotations

import contextvars
import json
import logging
import os
import sys
import uuid
from datetime import UTC, datetime
from typing import Any

TRACE_HEADER_NAME = "X-Trace-Id"

_trace_id_context: contextvars.ContextVar[str] = contextvars.ContextVar(
    "backend_trace_id",
    default="-",
)


class JsonFormatter(logging.Formatter):
    """Render log records as single-line JSON objects."""

    def format(self, record: logging.LogRecord) -> str:
        payload: dict[str, Any] = {
            "timestamp": datetime.now(UTC).isoformat(timespec="milliseconds"),
            "level": record.levelname,
            "service_name": getattr(
                record, "service_name", os.getenv("SERVICE_NAME", "backend")
            ),
            "message": record.getMessage(),
            "trace_id": getattr(record, "trace_id", get_trace_id()),
            "logger": record.name,
        }

        for key in (
            "method",
            "path",
            "status_code",
            "duration_ms",
            "client_ip",
            "upstream_service",
            "url",
        ):
            value = getattr(record, key, None)
            if value is not None:
                payload[key] = value

        if record.exc_info:
            payload["exception"] = self.formatException(record.exc_info)

        return json.dumps(payload, ensure_ascii=True)


def configure_logging(service_name: str) -> None:
    """Configure root and Uvicorn loggers to emit structured JSON."""
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(JsonFormatter())

    root_logger = logging.getLogger()
    root_logger.handlers.clear()
    root_logger.setLevel(logging.INFO)
    root_logger.addHandler(handler)

    for logger_name in ("uvicorn", "uvicorn.error", "uvicorn.access", "fastapi"):
        logger = logging.getLogger(logger_name)
        logger.handlers.clear()
        logger.setLevel(logging.INFO)
        logger.propagate = True

    logging.LoggerAdapter(
        logging.getLogger(__name__), {"service_name": service_name}
    ).info("logging_configured")


def generate_trace_id() -> str:
    """Generate a new opaque trace identifier."""
    return uuid.uuid4().hex


def set_trace_id(trace_id: str) -> contextvars.Token[str]:
    """Set the current trace identifier in the request context."""
    return _trace_id_context.set(trace_id)


def reset_trace_id(token: contextvars.Token[str]) -> None:
    """Restore the previous trace identifier after a request finishes."""
    _trace_id_context.reset(token)


def get_trace_id() -> str:
    """Return the trace identifier bound to the current request context."""
    return _trace_id_context.get()
