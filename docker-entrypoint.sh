#!/bin/sh
set -e

DB_PATH="/data/recipe_manager.db"

if [ ! -f "$DB_PATH" ]; then
    echo "[entrypoint] Primera ejecución — ejecutando seed inicial..."
    python app/data/seed.py
    echo "[entrypoint] Seed completado."
else
    echo "[entrypoint] Base de datos existente detectada — omitiendo seed."
fi

exec uvicorn app.backend.main:app --host 0.0.0.0 --port 8000
