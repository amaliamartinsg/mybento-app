# recipe-ingestion-api

API en Python con FastAPI para procesar un reel o post publico de Instagram o una receta web:

1. Extrae el `caption` del post.
2. Si el caption contiene alguna palabra clave configurable, envia ese texto a OpenAI.
3. Si no hay coincidencia, obtiene el media del post y lo transcribe con AssemblyAI.
4. El resultado final se procesa con OpenAI para extraer la receta en JSON.
5. Guarda artefactos del proceso en una carpeta por video.
6. Si la URL no es de Instagram, extrae el texto visible de la web y lo procesa igual.

## Requisitos

- Python 3.11+
- Credenciales de OpenAI
- Credenciales de AssemblyAI
- `ffmpeg` solo si la transcripcion remota falla y hay que extraer audio localmente

## Instalacion

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

## Ejecutar API

```bash
uvicorn app:app --host 0.0.0.0 --port 8001
```

La API es sincronica: envias la URL y devuelve directamente la receta final.

## Docker

Construir imagen:

```bash
docker build -t recipe-ingestion-api .
```

Ejecutar contenedor:

```bash
docker run --rm -p 8001:8001 ^
  --env-file .env ^
  recipe-ingestion-api
```

Notas:

- El contenedor instala `ffmpeg` para el fallback de transcripcion local.
- Los artefactos se guardan dentro de `outputs/` en el contenedor.
- El rate limit diario se guarda en `data/rate_limits.db` dentro del contenedor.
- Si quieres persistir ambos fuera del contenedor, monta volumen para `outputs/` y para `data/`:

```bash
docker run --rm -p 8001:8001 ^
  --env-file .env ^
  -v %cd%\outputs:/app/outputs ^
  -v %cd%\data:/app/data ^
  recipe-ingestion-api
```

## Uso

```bash
curl -X POST "http://127.0.0.1:8001/process" ^
  -H "Content-Type: application/json" ^
  -H "X-API-Key: tu_service_api_key" ^
  -d "{\"url\":\"https://www.instagram.com/reel/xxxxxxxxxxx/\"}"

curl -X POST "http://127.0.0.1:8001/process" ^
  -H "Content-Type: application/json" ^
  -H "X-API-Key: tu_service_api_key" ^
  -d "{\"url\":\"https://www.velocidadcuchara.com/crema-de-puerros-y-pera/\"}"
```

## Variables de entorno

- `OPENAI_API_KEY`: API key de OpenAI
- `ASSEMBLYAI_API_KEY`: API key de AssemblyAI
- `SERVICE_API_KEY`: API key interna para proteger `POST /process`
- `RATE_LIMIT_DAILY`: limite diario de peticiones autenticadas. Por defecto `50`
- `RATE_LIMIT_TIMEZONE`: zona horaria para el reset diario. Por defecto `Europe/Madrid`
- `RATE_LIMIT_DB_PATH`: ruta del sqlite del rate limit. Por defecto `data/rate_limits.db`
- `OPENAI_MODEL`: modelo para procesar el texto final
- `KEYWORDS`: lista separada por comas para filtrar el caption

## Respuesta

La API devuelve este esquema:

```json
{
  "name": "Pasta al pesto",
  "servings": 2,
  "instructions_text": "Cocer la pasta...",
  "ingredients": [
    { "name": "pasta", "quantity_g": 150 },
    { "name": "albahaca", "quantity_g": 20 }
  ]
}
```

## Healthcheck

```bash
curl http://127.0.0.1:8001/health
```

`/health` no requiere autenticacion. `POST /process` requiere la cabecera `X-API-Key`.

`POST /process` aplica tambien un rate limit diario por API key y devuelve estas cabeceras:

- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Used`
- `X-RateLimit-Reset-Date`

Si el servicio corre en Docker sin volumen para `data/`, el contador diario se perdera al recrear el contenedor.

Si OpenAI no tiene cuota o limita la peticion, la API devolvera `503` para diferenciarlo del `429` interno del servicio.

## Docker Compose

Tambien puedes levantar el servicio con `docker compose` usando [docker-compose.yml](C:\scripts\kairo-project\reels-transcribe\docker-compose.yml):

```bash
docker compose up --build -d
```

Parar el servicio:

```bash
docker compose down
```

Este compose:

- carga variables desde `.env`
- expone el puerto `8001`
- persiste `outputs/`
- persiste `data/rate_limits.db`

## Flujo

- Si una keyword aparece en el caption, no se transcribe el video.
- Si no aparece, se intenta transcripcion remota con la URL directa del media.
- Si AssemblyAI no puede leer esa URL, se descarga temporalmente el media y se reintenta con subida local.
- Si la URL no es de Instagram, se extrae el texto principal de la pagina y se guarda en `text_web.txt`.
- Cada ejecucion crea una carpeta dentro de `outputs/` con:
- `caption.txt`
- `text_web.txt` si la fuente es una web
- `transcripcion.txt` si se genero transcripcion
- `receta.json`
- `metadata.json`
