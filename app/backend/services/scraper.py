"""Service for extracting recipe data from an external URL via the scraper API."""

import os

import httpx

from app.backend.schemas.recipe import ScrapedRecipe, RecipeSuggestionIngredient

_SCRAPER_API_URL = os.getenv("SCRAPER_API_URL", "http://localhost:8001")
_SCRAPER_API_KEY = os.getenv("SCRAPER_API_KEY", "")

# The scraper can take up to 180 s for Instagram posts with transcription.
_TIMEOUT = 180.0


class ScraperAuthError(Exception):
    pass


class ScraperRateLimitError(Exception):
    pass


async def scrape_recipe_from_url(url: str) -> ScrapedRecipe:
    """Call the external scraper service and return structured recipe data.

    Args:
        url: Public URL of a recipe web page or Instagram post.

    Returns:
        :class:`ScrapedRecipe` with all available fields populated.

    Raises:
        ScraperAuthError: If the API key is missing or rejected (401).
        ScraperRateLimitError: If the daily quota is exceeded (429).
        RuntimeError: For timeout, connection errors, or any other failure.
    """
    headers = {
        "Content-Type": "application/json",
        "X-API-Key": _SCRAPER_API_KEY,
    }

    try:
        async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
            resp = await client.post(
                f"{_SCRAPER_API_URL}/process",
                json={"url": url},
                headers=headers,
            )
    except httpx.TimeoutException as exc:
        raise RuntimeError(
            "El extractor tardó demasiado en responder. Inténtalo de nuevo."
        ) from exc
    except httpx.RequestError as exc:
        raise RuntimeError(
            f"No se pudo conectar con el servicio de extracción: {exc}"
        ) from exc

    if resp.status_code == 401:
        raise ScraperAuthError("API key del extractor inválida o ausente.")
    if resp.status_code == 429:
        raise ScraperRateLimitError(
            "Límite diario del extractor alcanzado. Inténtalo mañana."
        )
    if not resp.is_success:
        try:
            detail = resp.json().get("detail", "Error desconocido")
        except Exception:
            detail = "Error desconocido"
        raise RuntimeError(f"El extractor devolvió un error: {detail}")

    data = resp.json()

    # Normalise ingredients: skip entries without name, default null quantity to 100 g.
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
