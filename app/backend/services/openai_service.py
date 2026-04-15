"""OpenAI GPT-4o mini service for recipe suggestions."""

import json

from dotenv import load_dotenv
from openai import AsyncOpenAI, AuthenticationError
from pydantic import ValidationError

from app.backend.config_utils import get_env_or_file
from app.backend.schemas.recipe import RecipeSuggestion

load_dotenv()


class OpenAIAuthError(Exception):
    """Raised when OpenAI rejects the API key."""


JSON_RESPONSE_PROMPT = """Devuelve exclusivamente JSON valido, sin markdown ni explicaciones.

Formato exacto:
{
  "name": "Nombre de la receta",
  "category_suggestion": "Comida",
  "servings": 2,
  "instructions_text": "1. Paso uno\n2. Paso dos",
  "ingredients": [
    {"name": "Pechuga de pollo", "quantity_g": 200},
    {"name": "Arroz integral", "quantity_g": 100}
  ]
}

Reglas:
- "instructions_text" debe contener todos los pasos numerados, uno por linea, con el formato exacto:
  1. {paso 1}
  2. {paso 2}
  Cada paso debe ir separado por un salto de linea (\n). No uses otro formato ni añadas texto extra fuera de los pasos.
- Convierte cantidades a gramos siempre que sea razonable.
- Si una cantidad es fraccional, devuelvela en decimal.
- Si una cantidad no aparece con claridad, estima una cantidad razonable y util para cocinar sin desviarte del tipo de receta.
- Considera como especias tipicas ingredientes como pimienta, pimenton, comino, curry, oregano, canela, nuez moscada, ajo en polvo, cebolla en polvo, cayena, chile en polvo y mezclas equivalentes.
- Deduplica ingredientes equivalentes si claramente se refieren al mismo ingrediente.
- No incluyas texto fuera del JSON."""


async def _request_recipe_suggestion(user_message: str, system_prompt: str) -> RecipeSuggestion:
    """Ask OpenAI for a recipe suggestion and validate its JSON response."""
    openai_api_key = get_env_or_file("OPENAI_API_KEY")
    if not openai_api_key:
        raise RuntimeError(
            "OpenAI: OPENAI_API_KEY no esta configurada en el entorno o secrets"
        )

    client = AsyncOpenAI(api_key=openai_api_key)

    for attempt, temperature in enumerate([0.7, 0.0]):
        try:
            response = await client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message},
                ],
                temperature=temperature,
                max_tokens=800,
            )
        except AuthenticationError as exc:
            raise OpenAIAuthError(
                "OpenAI: clave invalida o no configurada; revisa OPENAI_API_KEY"
            ) from exc
        except Exception as exc:
            raise RuntimeError(
                f"OpenAI: error al llamar a la API (intento {attempt + 1}): {exc}"
            ) from exc

        raw_content = response.choices[0].message.content or ""

        try:
            data = json.loads(raw_content)
            return RecipeSuggestion.model_validate(data)
        except (json.JSONDecodeError, ValidationError) as exc:
            if attempt == 0:
                continue
            raise RuntimeError(
                f"OpenAI: la respuesta no es un JSON valido tras 2 intentos. "
                f"Ultimo error: {exc}. Respuesta recibida: {raw_content[:300]}"
            ) from exc

    raise RuntimeError("OpenAI: no se pudo obtener una sugerencia valida")


async def suggest_recipe(available_ingredients: list[str]) -> RecipeSuggestion:
    """Ask OpenAI to suggest a recipe from ``available_ingredients``."""
    ingredients_text = ", ".join(available_ingredients)
    system_prompt = (
        "Eres un chef experto en nutricion.\n"
        "Cuando el usuario te de una lista de ingredientes disponibles,\n"
        "propon UNA receta completa basada principalmente en esos ingredientes.\n"
        "Usa solo los ingredientes indicados y añade como mucho basicos de cocina razonables si son necesarios.\n"
        f"{JSON_RESPONSE_PROMPT}"
    )
    user_message = f"Ingredientes disponibles: {ingredients_text}"
    return await _request_recipe_suggestion(user_message, system_prompt)


async def generate_recipe_from_title(title: str) -> RecipeSuggestion:
    """Ask OpenAI to generate a recipe draft from a user-provided title."""
    system_prompt = (
        "Eres un chef experto en nutricion.\n"
        "Cuando el usuario te de el titulo de una receta, genera UNA receta completa, coherente y cocinable que encaje con ese titulo.\n"
        "Si el titulo es ambiguo, elige una version razonable y comun.\n"
        "La receta debe quedar lista para editarse y guardarse directamente en la aplicacion.\n"
        f"{JSON_RESPONSE_PROMPT}"
    )
    user_message = f"Titulo de la receta: {title}"
    return await _request_recipe_suggestion(user_message, system_prompt)
