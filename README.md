# MyBento

Aplicacion completa para gestion de recetas y menus semanales, con:
- frontend React (Vite + MUI)
- backend FastAPI (CRUD, calculo de macros, integraciones)
- API de ingestion por URL externa (`recipe-url-api`) para extraer recetas desde Instagram/web

## Arquitectura

Servicios en `docker-compose.yml`:
- `frontend`: Nginx sirviendo SPA en `http://localhost:8080`, con proxy `/api -> backend:8000`
- `backend`: FastAPI interno en `:8000` (healthcheck en `/health`)
- `scraper`: FastAPI interno en `:8001` (`/process`, `/health`)

Persistencia:
- `db_data`: sqlite del backend (`/data/recipe_manager.db`)
- `scraper_outputs`: artefactos de extraccion de la API de ingestion
- `scraper_data`: sqlite de rate limit diario del scraper

## Estructura del repositorio

```text
.
|- app/
|  |- backend/                 # API principal FastAPI + Dockerfile del backend
|  |- data/                    # seed inicial de datos
|  `- frontend/                # React + Vite + Dockerfile + nginx.conf
|- recipe-url-api/             # API FastAPI de ingestion por URL
|- docker-compose.yml          # Compose global (fuente de verdad)
|- .env.example                # plantilla de variables
`- .env                        # variables reales (no versionar)
```

## Variables de entorno

Base:
- `USDA_API_KEY` (obligatoria para macros en ingredientes)
- `UNSPLASH_ACCESS_KEY` (obligatoria para busqueda de imagenes)
- `OPENAI_API_KEY` (obligatoria: backend y scraper)
- `SCRAPER_API_KEY` (obligatoria: backend -> scraper y auth en scraper)

Opcionales recomendadas para scraper:
- `ASSEMBLYAI_API_KEY` (obligatoria si vas a extraer desde video/Instagram)
- `OPENAI_MODEL` (default: `gpt-4.1-mini`)
- `KEYWORDS` (default: `ingrediente`)
- `RATE_LIMIT_DAILY` (default: `50`)
- `RATE_LIMIT_TIMEZONE` (default: `Europe/Madrid`)

Notas:
- El backend en Docker usa `DATABASE_URL=sqlite:////data/recipe_manager.db` (inyectado por compose).
- `RATE_LIMIT_DB_PATH` en scraper se fija por compose a `data/rate_limits.db`.
- No subas `.env` al repositorio.

## Arranque rapido (Docker Compose)

1. Crear `.env` desde plantilla:

```bash
copy .env.example .env
```

2. Rellenar en `.env` al menos:
`USDA_API_KEY`, `UNSPLASH_ACCESS_KEY`, `OPENAI_API_KEY`, `SCRAPER_API_KEY`, `ASSEMBLYAI_API_KEY`.

3. Levantar todo:

```bash
docker compose up -d --build
```

4. Verificar:

```bash
docker compose ps
curl http://localhost:8080
curl http://localhost:8000/health
```

Parar:

```bash
docker compose down
```

Reiniciar limpio de volumenes:

```bash
docker compose down -v
```

## Desarrollo local (sin Docker, 3 terminales)

### 1) Scraper (`recipe-url-api`)

```bash
cd recipe-url-api
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app:app --reload --port 8001
```

### 2) Backend

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r app/backend/requirements.txt
set SCRAPER_API_URL=http://localhost:8001
set SCRAPER_API_KEY=tu_valor
uvicorn app.backend.main:app --reload --port 8000
```

### 3) Frontend

```bash
cd app/frontend
npm install
npm run dev
```

En dev, Vite proxya `/api` a `http://localhost:8000`.

## Endpoints clave

Backend (`:8000`):
- `GET /health`
- `GET/POST/PUT/DELETE /recipes`
- `POST /recipes/suggest`
- `POST /recipes/scrape`
- `GET /recipes/images`
- routers adicionales: `categories`, `menu`, `profile`, `extras`, `unit_weights`

Scraper (`:8001`, interno):
- `GET /health`
- `POST /process` (requiere header `X-API-Key`)

## Despliegue

Recomendado:
- desplegar el stack completo con `docker compose`
- exponer solo `frontend` (8080) detras de reverse proxy (Nginx/Traefik/Caddy)
- no exponer `backend` ni `scraper` directamente a internet
- persistir volumenes `db_data`, `scraper_outputs`, `scraper_data`

## Troubleshooting rapido

- Error `Dockerfile ... no such file`: revisa rutas de `build.context` y `dockerfile` en compose.
- `403` en `/recipes/scrape`: `SCRAPER_API_KEY` no coincide con la key del scraper.
- `429` en scraper: limite diario agotado (`RATE_LIMIT_DAILY`).
- `503` en scraper: limite/cuota de proveedor OpenAI.
- Backend sin datos: borra volumen `db_data` y reinicia para relanzar seed.
