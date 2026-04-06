"""Unsplash image search service."""

import httpx
from dotenv import load_dotenv

from app.backend.config_utils import get_env_or_file

load_dotenv()

UNSPLASH_URL: str = "https://api.unsplash.com/search/photos"


class UnsplashAuthError(Exception):
    """Raised when Unsplash rejects the access key."""


async def search_images(query: str, count: int = 3, page: int = 1) -> list[str]:
    """Search Unsplash for food/recipe photos matching ``query``."""
    unsplash_access_key = get_env_or_file("UNSPLASH_ACCESS_KEY")
    if not unsplash_access_key:
        return []

    params = {
        "query": query,
        "per_page": min(count, 30),
        "page": page,
        "orientation": "landscape",
        "client_id": unsplash_access_key,
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(UNSPLASH_URL, params=params)
    except httpx.RequestError as exc:
        raise RuntimeError(f"Unsplash: error de red para query '{query}': {exc}") from exc

    if response.status_code == 401:
        raise UnsplashAuthError(
            "Unsplash: token invalido o no configurado; revisa UNSPLASH_ACCESS_KEY"
        )

    if response.status_code != 200:
        raise RuntimeError(
            f"Unsplash: respuesta inesperada {response.status_code} "
            f"para query '{query}': {response.text[:200]}"
        )

    data = response.json()
    return [photo["urls"]["regular"] for photo in data.get("results", [])]
