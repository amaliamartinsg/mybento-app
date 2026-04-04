from __future__ import annotations

import json

from openai import OpenAI


SYSTEM_PROMPT = """Extrae una receta estructurada a partir del texto recibido.

Debes devolver exclusivamente JSON valido, sin markdown ni explicaciones.

Formato exacto:
{
  "titulo_receta": "string",
  "ingredientes": [
    {
      "nombre": "string",
      "cantidad": "string",
      "unidad": "string",
      "cantidad_normalizada": "string"
    }
  ],
  "instrucciones": ["string"]
}

Reglas:
- Usa solo informacion explicitamente presente en el texto.
- Si una cantidad no aparece y el ingrediente no es una especia, usa "N/D" en "cantidad", "unidad" y "cantidad_normalizada".
- Si una especia no tiene cantidad explicita, usa cantidad "1", unidad "g" y cantidad_normalizada "1 g".
- Considera como especias tipicas ingredientes como pimienta, pimenton, comino, curry, oregano, canela, nuez moscada, ajo en polvo, cebolla en polvo, cayena, chile en polvo y mezclas equivalentes.
- Si el titulo no aparece claro, deducelo solo si el texto lo deja muy claro. Si no, usa "N/D".
- Las instrucciones deben quedar en pasos claros y concisos, en orden.
- Si hay variantes o notas ambiguas, no inventes cantidades.
"""


def process_text(api_key: str, model: str, text: str, source: str) -> str:
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
    return json.dumps(parsed, ensure_ascii=False, indent=2)
