#!/bin/sh
set -e

DB_PATH="/data/recipe_manager.db"
SERVICE_NAME="backend"
TRACE_ID="-"

log_json() {
    LEVEL="$1"
    MESSAGE="$2"
    printf '{"timestamp":"%s","level":"%s","service_name":"%s","message":"%s","trace_id":"%s"}\n' \
        "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$LEVEL" "$SERVICE_NAME" "$MESSAGE" "$TRACE_ID"
}

if [ ! -f "$DB_PATH" ]; then
    log_json "INFO" "database_seed_started"
    python app/data/seed.py
    log_json "INFO" "database_seed_completed"
else
    log_json "INFO" "database_seed_skipped_existing_db"
fi

exec uvicorn app.backend.main:app --host 0.0.0.0 --port 8000 --no-access-log
