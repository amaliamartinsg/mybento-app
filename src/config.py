from __future__ import annotations

import os
from dataclasses import dataclass

from dotenv import load_dotenv


load_dotenv()


@dataclass(frozen=True)
class Settings:
    openai_api_key: str
    assemblyai_api_key: str
    openai_model: str
    keywords: tuple[str, ...]


def load_settings() -> Settings:
    openai_api_key = os.getenv("OPENAI_API_KEY", "").strip()
    assemblyai_api_key = os.getenv("ASSEMBLYAI_API_KEY", "").strip()
    openai_model = os.getenv("OPENAI_MODEL", "gpt-4.1-mini").strip()
    keywords_raw = os.getenv("KEYWORDS", "ingrediente")
    keywords = tuple(
        keyword.strip().lower() for keyword in keywords_raw.split(",") if keyword.strip()
    )

    if not openai_api_key:
        raise ValueError("Falta OPENAI_API_KEY en el entorno.")
    if not assemblyai_api_key:
        raise ValueError("Falta ASSEMBLYAI_API_KEY en el entorno.")
    if not keywords:
        raise ValueError("La lista KEYWORDS no puede estar vacia.")

    return Settings(
        openai_api_key=openai_api_key,
        assemblyai_api_key=assemblyai_api_key,
        openai_model=openai_model,
        keywords=keywords,
    )
