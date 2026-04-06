"""Service for extracting recipe data from an external URL via the scraper API."""

import logging
import os

import httpx

from app.backend.config_utils import get_env_or_file
from app.backend.logging_utils import TRACE_HEADER_NAME, get_trace_id
from app.backend.schemas.recipe import ScrapedRecipe, RecipeSuggestionIngredient

_SCRAPER_API_URL = os.getenv("SCRAPER_API_URL", "http://localhost:8001")

_TIMEOUT = 180.0

logger = logging.getLogger("mybento.backend.scraper")


class ScraperAuthError(Exception):
    pass


class ScraperRateLimitError(Exception):
    pass


async def scrape_recipe_from_url(url: str) -> ScrapedRecipe:
    """Call the external scraper service and return structured recipe data."""
    scraper_api_key = get_env_or_file("SCRAPER_API_KEY")
    headers = {
        "Content-Type": "application/json",
        "X-API-Key": scraper_api_key,
        TRACE_HEADER_NAME: get_trace_id(),
    }

    logger.info(
        "scraper_request_started",
        extra={"upstream_service": "scraper", "url": url},
    )

    try:
        async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
            resp = await client.post(
                f"{_SCRAPER_API_URL}/process",
                json={"url": url},
                headers=headers,
            )
    except httpx.TimeoutException as exc:
        logger.exception(
            "scraper_request_timeout",
            extra={"upstream_service": "scraper", "url": url},
        )
        raise RuntimeError(
            "El extractor tardo demasiado en responder. Intentalo de nuevo."
        ) from exc
    except httpx.RequestError as exc:
        logger.exception(
            "scraper_request_transport_error",
            extra={"upstream_service": "scraper", "url": url},
        )
        raise RuntimeError(
            f"No se pudo conectar con el servicio de extraccion: {exc}"
        ) from exc

    logger.info(
        "scraper_request_completed",
        extra={
            "upstream_service": "scraper",
            "url": url,
            "status_code": resp.status_code,
        },
    )

    if resp.status_code == 401:
        raise ScraperAuthError("API key del extractor invalida o ausente.")
    if resp.status_code == 429:
        raise ScraperRateLimitError(
            "Limite diario del extractor alcanzado. Intentalo manana."
        )
    if not resp.is_success:
        try:
            detail = resp.json().get("detail", "Error desconocido")
        except Exception:
            detail = "Error desconocido"
        raise RuntimeError(f"El extractor devolvio un error: {detail}")

    data = resp.json()
    raw_ingredients = data.get("ingredients") or []
    ingredients = [
        RecipeSuggestionIngredient(
            name=ing["name"],
            quantity_g=ing.get("quantity_g") or 100.0,
        )
        for ing in raw_ingredients
        if ing.get("name")
    ]

    return ScrapedRecipe(
        name=data.get("name") or "Sin nombre",
        servings=data.get("servings"),
        instructions_text=data.get("instructions_text") or None,
        ingredients=ingredients,
    )
