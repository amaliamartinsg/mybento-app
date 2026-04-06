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


SYSTEM_PROMPT = """Eres un chef experto en nutricion.
Cuando el usuario te de una lista de ingredientes disponibles,
propon UNA receta completa y devuelve SOLO un JSON valido con esta estructura exacta:
{
  "name": "Nombre de la receta",
  "category_suggestion": "Comida",
  "servings": 2,
  "instructions_text": "Instrucciones paso a paso...",
  "ingredients": [
    {"name": "Pechuga de pollo", "quantity_g": 200},
    {"name": "Arroz integral", "quantity_g": 100}
  ]
}
No incluyas texto fuera del JSON."""


async def suggest_recipe(available_ingredients: list[str]) -> RecipeSuggestion:
    """Ask OpenAI to suggest a recipe from ``available_ingredients``."""
    openai_api_key = get_env_or_file("OPENAI_API_KEY")
    if not openai_api_key:
        raise RuntimeError(
            "OpenAI: OPENAI_API_KEY no esta configurada en el entorno o secrets"
        )

    client = AsyncOpenAI(api_key=openai_api_key)
    ingredients_text = ", ".join(available_ingredients)
    user_message = f"Ingredientes disponibles: {ingredients_text}"

    for attempt, temperature in enumerate([0.7, 0.0]):
        try:
            response = await client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
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
