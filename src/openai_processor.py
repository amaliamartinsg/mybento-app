from __future__ import annotations

from openai import OpenAI


SYSTEM_PROMPT = """Procesa el texto recibido de Instagram.

Devuelve una respuesta breve y util para automatizacion con este formato:
- resumen: 1-3 frases
- categoria: etiqueta corta
- entidades_clave: lista simple
- acciones_recomendadas: lista simple

Si el texto habla de ingredientes, identifica ingredientes concretos y contexto de uso.
Si faltan datos, no inventes informacion.
"""


def process_text(api_key: str, model: str, text: str, source: str) -> str:
    client = OpenAI(api_key=api_key)
    response = client.responses.create(
        model=model,
        input=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {
                "role": "user",
                "content": f"Fuente: {source}\n\nTexto a procesar:\n{text}",
            },
        ],
    )
    return response.output_text.strip()
