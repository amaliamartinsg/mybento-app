"""USDA FoodData Central API service."""

from dataclasses import dataclass

import httpx
from dotenv import load_dotenv
from openai import AsyncOpenAI, AuthenticationError

from app.backend.config_utils import get_env_or_file

load_dotenv()

USDA_SEARCH_URL: str = "https://api.nal.usda.gov/fdc/v1/foods/search"

_NUTRIENT_KCAL = 1008
_NUTRIENT_PROT = 1003
_NUTRIENT_HC = 1005
_NUTRIENT_FAT = 1004

_translation_cache: dict[str, str] = {}


@dataclass
class NutritionResult:
    kcal_100g: float
    prot_100g: float
    hc_100g: float
    fat_100g: float


_ZERO_RESULT = NutritionResult(kcal_100g=0, prot_100g=0, hc_100g=0, fat_100g=0)


class USDAAuthError(Exception):
    """Raised when USDA rejects the API key."""


async def _translate_to_english(name: str) -> str:
    cached = _translation_cache.get(name)
    if cached:
        return cached

    openai_api_key = get_env_or_file("OPENAI_API_KEY")
    if not openai_api_key:
        return name

    try:
        client = AsyncOpenAI(api_key=openai_api_key)
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "Translate the food ingredient to English. "
                        "Reply with ONLY the translated ingredient name, "
                        "nothing else. Keep it generic (no brand names)."
                    ),
                },
                {"role": "user", "content": name},
            ],
            temperature=0,
            max_tokens=20,
        )
        translated = response.choices[0].message.content.strip()
    except (AuthenticationError, Exception):
        return name

    _translation_cache[name] = translated
    return translated


async def get_nutrition(ingredient_name: str) -> NutritionResult:
    usda_api_key = get_env_or_file("USDA_API_KEY")
    if not usda_api_key:
        return _ZERO_RESULT

    english_name = await _translate_to_english(ingredient_name)

    params = {
        "query": english_name,
        "api_key": usda_api_key,
        "pageSize": 1,
        "dataType": "Foundation,SR Legacy",
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(USDA_SEARCH_URL, params=params)
    except httpx.RequestError as exc:
        raise RuntimeError(
            f"USDA: error de red al consultar '{ingredient_name}': {exc}"
        ) from exc

    if response.status_code == 403:
        raise USDAAuthError(
            "USDA: clave invalida o no configurada; revisa USDA_API_KEY"
        )

    if response.status_code != 200:
        raise RuntimeError(
            f"USDA: respuesta inesperada {response.status_code} "
            f"para '{ingredient_name}': {response.text[:200]}"
        )

    data = response.json()
    foods = data.get("foods", [])

    if not foods:
        return _ZERO_RESULT

    nutrients: dict[int, float] = {
        n["nutrientId"]: float(n.get("value", 0))
        for n in foods[0].get("foodNutrients", [])
    }

    return NutritionResult(
        kcal_100g=nutrients.get(_NUTRIENT_KCAL, 0),
        prot_100g=nutrients.get(_NUTRIENT_PROT, 0),
        hc_100g=nutrients.get(_NUTRIENT_HC, 0),
        fat_100g=nutrients.get(_NUTRIENT_FAT, 0),
    )
