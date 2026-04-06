"""Helpers for configuration values and Docker secrets."""

from __future__ import annotations

import os
from pathlib import Path


def get_env_or_file(name: str, default: str = "") -> str:
    """Read configuration from ENV or from the file pointed by ``<NAME>_FILE``."""
    value = os.getenv(name)
    if value is not None and value.strip():
        return value.strip()

    file_path = os.getenv(f"{name}_FILE")
    if file_path:
        content = Path(file_path).read_text(encoding="utf-8").strip()
        if content:
            return content

    return default
