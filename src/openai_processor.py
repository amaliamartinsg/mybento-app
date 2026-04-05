from __future__ import annotations

import json

from openai import OpenAI

from src.models import RecipeData, RecipeIngredient

SYSTEM_PROMPT = """Extrae una receta estructurada a partir del texto recibido.

Debes devolver exclusivamente JSON valido, sin markdown ni explicaciones.

Formato exacto:
{
  "name": "string",
  "servings": 2,
  "instructions_text": "string",
  "ingredients": [
    {
      "name": "string",
      "quantity_g": 150
    }
  ]
}

Reglas:
- Usa solo informacion explicitamente presente en el texto.
- Si no aparece el nombre claro de la receta, usa "N/D".
- Si no aparece el numero de raciones, usa null en "servings".
- "instructions_text" debe contener todos los pasos concatenados como un texto claro y ordenado.
- Convierte cantidades a gramos siempre que sea razonable segun lo dicho en el texto.
- Si una cantidad no aparece y el ingrediente no es una especia, usa null en "quantity_g".
- Si una especia no tiene cantidad explicita, usa 1 en "quantity_g".
- Considera como especias tipicas ingredientes como pimienta, pimenton, comino, curry, oregano, canela, nuez moscada, ajo en polvo, cebolla en polvo, cayena, chile en polvo y mezclas equivalentes.
- Si una unidad no se puede convertir con fiabilidad a gramos, usa null en "quantity_g".
- Deduplica ingredientes equivalentes si claramente se refieren al mismo ingrediente.
- Si hay variantes o notas ambiguas, no inventes cantidades.
"""


def process_text(api_key: str, model: str, text: str, source: str) -> RecipeData:
    client = OpenAI(api_key=api_key)
    response = client.responses.create(
        model=model,
        input=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {
                "role": "user",
                "content": (
                    f"Fuente: {source}\n\n"
                    "Extrae la receta completa a partir del siguiente contenido:\n"
                    f"{text}"
                ),
            },
        ],
    )
    parsed = json.loads(response.output_text)
    return _parse_recipe_data(parsed)


def _parse_recipe_data(data: dict) -> RecipeData:
    name = data.get("name")
    servings = data.get("servings")
    instructions_text = data.get("instructions_text")
    ingredients_raw = data.get("ingredients", [])

    normalized_name = name.strip() if isinstance(name, str) and name.strip() else "N/D"
    normalized_servings = servings if isinstance(servings, int) else None
    normalized_instructions = (
        instructions_text.strip()
        if isinstance(instructions_text, str) and instructions_text.strip()
        else ""
    )

    ingredients: list[RecipeIngredient] = []
    if isinstance(ingredients_raw, list):
        for item in ingredients_raw:
            if not isinstance(item, dict):
                continue
            ingredient_name = item.get("name")
            if not isinstance(ingredient_name, str) or not ingredient_name.strip():
                continue
            quantity_g = item.get("quantity_g")
            normalized_quantity = _normalize_quantity(quantity_g)
            ingredients.append(
                RecipeIngredient(
                    name=ingredient_name.strip(),
                    quantity_g=normalized_quantity,
                )
            )

    return RecipeData(
        name=normalized_name,
        servings=normalized_servings,
        instructions_text=normalized_instructions,
        ingredients=ingredients,
    )


def _normalize_quantity(value: object) -> int | None:
    if isinstance(value, bool):
        return None
    if isinstance(value, int):
        return value
    if isinstance(value, float):
        return int(round(value))
    return None
