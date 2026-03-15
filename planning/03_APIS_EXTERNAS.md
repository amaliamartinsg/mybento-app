# 🔑 03 — APIs Externas: Registro y Configuración

> Completa estos pasos **antes de empezar la Fase 2**.
> Las claves van en el archivo `.env` en la raíz del proyecto.

---

## Checklist de Configuración

- [X] Crear archivo `.env` en la raíz del proyecto
- [ ] Registrarse en Edamam y obtener claves
- [ ] Registrarse en Unsplash y obtener clave
- [ ] Crear cuenta OpenAI y añadir saldo
- [ ] Verificar que las 3 APIs responden correctamente (scripts de test abajo)

---

## `.env.example` (copiar como `.env` y rellenar)

```env
# Edamam Nutrition Analysis API
EDAMAM_APP_ID=xxxxxxxx
EDAMAM_APP_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Unsplash
UNSPLASH_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# OpenAI
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# App config
BACKEND_URL=http://localhost:8000
DATABASE_URL=sqlite:///./recipe_manager.db
```

---

## 1. Edamam — Nutrition Analysis API

**Tier gratuito:** 100 calls/día ✅  
**Uso en el proyecto:** Calcular macros de ingredientes al guardar una receta

### Pasos de registro

- [ ] Ir a [developer.edamam.com](https://developer.edamam.com)
- [ ] Crear cuenta gratuita
- [ ] Ir a "Dashboard" → "Applications"
- [ ] Click en **"Create a new application"**
- [ ] Seleccionar: **"Nutrition Analysis API"** (NO la Recipe Search API)
- [ ] Nombre: `recipe-manager-mvp`
- [ ] Copiar `Application ID` → `EDAMAM_APP_ID`
- [ ] Copiar `Application Keys` → `EDAMAM_APP_KEY`

### Ejemplo de llamada

```python
# POST https://api.edamam.com/api/nutrition-details
# Body: { "ingr": ["150g chicken breast", "100g brown rice"] }

import httpx

async def get_nutrition(ingredients: list[str]) -> dict:
    url = "https://api.edamam.com/api/nutrition-details"
    params = {
        "app_id": EDAMAM_APP_ID,
        "app_key": EDAMAM_APP_KEY
    }
    body = {"ingr": ingredients}
    async with httpx.AsyncClient() as client:
        response = await client.post(url, params=params, json=body)
        return response.json()
```

### Respuesta relevante

```json
{
  "calories": 485,
  "totalNutrients": {
    "PROCNT": { "quantity": 52.3, "unit": "g" },  // Proteína
    "CHOCDF": { "quantity": 44.1, "unit": "g" },  // Hidratos
    "FAT":    { "quantity": 8.2,  "unit": "g" }   // Grasas
  }
}
```

### Notas importantes
- El formato de ingredientes es texto libre en inglés: `"150g chicken breast"`
- Si un ingrediente no se reconoce, la API devuelve error 555 → manejar con fallback
- **Caché planificado en Fase 9**: guardar resultado en SQLite por `(nombre_ingrediente, cantidad)` para no repetir llamadas

---

## 2. Unsplash — Image Search API

**Tier gratuito:** 50 requests/hora ✅ (modo Demo)  
**Uso en el proyecto:** Mostrar carrusel de 3-5 imágenes al crear/sugerir receta

### Pasos de registro

- [ ] Ir a [unsplash.com/developers](https://unsplash.com/developers)
- [ ] Click en **"Your apps"** → **"New Application"**
- [ ] Aceptar términos (uso no comercial / demo está bien para uso personal)
- [ ] Nombre: `recipe-manager-mvp`
- [ ] Descripción: `Personal recipe manager app`
- [ ] Copiar **"Access Key"** → `UNSPLASH_ACCESS_KEY`
- [ ] (Ignorar el Secret Key, no lo necesitamos)

### Ejemplo de llamada

```python
# GET https://api.unsplash.com/search/photos

async def search_images(query: str, count: int = 5) -> list[str]:
    url = "https://api.unsplash.com/search/photos"
    params = {
        "query": query,
        "per_page": count,
        "orientation": "landscape",
        "client_id": UNSPLASH_ACCESS_KEY
    }
    async with httpx.AsyncClient() as client:
        response = await client.get(url, params=params)
        data = response.json()
        # Devolver URLs de las imágenes en tamaño "regular" (~1080px)
        return [photo["urls"]["regular"] for photo in data["results"]]
```

### Notas importantes
- Usar `urls.regular` (no `full`) — buen balance calidad/tamaño
- Los queries en inglés dan mejores resultados: traducir nombre de receta si hace falta
- Solo guardamos la URL elegida por el usuario (no descargamos la imagen)

---

## 3. OpenAI — GPT-4o mini

**Tier gratuito:** ❌ Requiere saldo (prepago)  
**Coste estimado:** ~$0.01-0.05 por sugerencia de receta (muy barato)  
**Uso en el proyecto:** Despensa Virtual — sugerir receta a partir de ingredientes disponibles

### Pasos de configuración

- [ ] Ir a [platform.openai.com](https://platform.openai.com)
- [ ] Crear cuenta o iniciar sesión
- [ ] Ir a **"Billing"** → añadir método de pago → cargar $5-10 (dura meses)
- [ ] Ir a **"API Keys"** → **"Create new secret key"**
- [ ] Copiar clave → `OPENAI_API_KEY`
- [ ] Instalar librería: `pip install openai`

### Ejemplo de llamada y prompt

```python
from openai import AsyncOpenAI

client = AsyncOpenAI(api_key=OPENAI_API_KEY)

SYSTEM_PROMPT = """Eres un chef experto en nutrición. 
Cuando el usuario te dé una lista de ingredientes disponibles, 
propón UNA receta completa y devuelve SOLO un JSON válido con esta estructura exacta:
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

async def suggest_recipe(available_ingredients: list[str]) -> dict:
    ingredients_text = ", ".join(available_ingredients)
    
    response = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Ingredientes disponibles: {ingredients_text}"}
        ],
        temperature=0.7,
        max_tokens=800
    )
    
    import json
    return json.loads(response.choices[0].message.content)
```

### Notas importantes
- Usar `gpt-4o-mini` (NO `gpt-4o`) — 10x más barato, suficiente calidad para recetas
- El prompt pide JSON estricto → parsear con `json.loads()` + try/except
- Si el parsing falla, reintentar con `temperature=0` para respuesta más predecible
- La receta sugerida se **pre-rellena en el formulario** para que el usuario revise antes de guardar (no se guarda automáticamente)

---

## Script de Verificación de APIs

Crear como `data/test_apis.py` y ejecutar una vez configurado el `.env`:

```python
"""Script para verificar que las 3 APIs funcionan correctamente."""
import asyncio
import httpx
import os
from dotenv import load_dotenv
from openai import AsyncOpenAI

load_dotenv()

async def test_edamam():
    print("🔍 Testando Edamam...")
    url = "https://api.edamam.com/api/nutrition-details"
    params = {"app_id": os.getenv("EDAMAM_APP_ID"), "app_key": os.getenv("EDAMAM_APP_KEY")}
    async with httpx.AsyncClient() as client:
        r = await client.post(url, params=params, json={"ingr": ["100g chicken"]})
        if r.status_code == 200:
            data = r.json()
            print(f"  ✅ Edamam OK — {data['calories']} kcal para 100g pollo")
        else:
            print(f"  ❌ Edamam ERROR: {r.status_code} — {r.text[:200]}")

async def test_unsplash():
    print("🖼️  Testando Unsplash...")
    url = "https://api.unsplash.com/search/photos"
    params = {"query": "pasta carbonara", "per_page": 1, "client_id": os.getenv("UNSPLASH_ACCESS_KEY")}
    async with httpx.AsyncClient() as client:
        r = await client.get(url, params=params)
        if r.status_code == 200:
            data = r.json()
            print(f"  ✅ Unsplash OK — {data['total']} resultados para 'pasta carbonara'")
        else:
            print(f"  ❌ Unsplash ERROR: {r.status_code}")

async def test_openai():
    print("🤖 Testando OpenAI...")
    client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    try:
        r = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": "Di solo: OK"}],
            max_tokens=10
        )
        print(f"  ✅ OpenAI OK — respuesta: {r.choices[0].message.content}")
    except Exception as e:
        print(f"  ❌ OpenAI ERROR: {e}")

async def main():
    await test_edamam()
    await test_unsplash()
    await test_openai()
    print("\n✅ Test completado")

asyncio.run(main())
```
