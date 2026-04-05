from __future__ import annotations

import sqlite3
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo


@dataclass(frozen=True)
class RateLimitStatus:
    limit: int
    remaining: int
    used: int
    reset_date: str
    blocked: bool


def check_and_increment_daily_limit(
    api_key: str,
    daily_limit: int,
    timezone_name: str,
    db_path: str,
) -> RateLimitStatus | None:
    if daily_limit <= 0:
        return None

    current_date = datetime.now(ZoneInfo(timezone_name)).date().isoformat()
    database_path = Path(db_path)
    database_path.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(database_path)
    try:
        _ensure_table(connection)
        cursor = connection.cursor()
        cursor.execute("BEGIN IMMEDIATE")
        cursor.execute(
            """
            SELECT count
            FROM daily_api_usage
            WHERE api_key = ? AND usage_date = ?
            """,
            (api_key, current_date),
        )
        row = cursor.fetchone()
        used = int(row[0]) if row else 0

        if used >= daily_limit:
            connection.commit()
            return RateLimitStatus(
                limit=daily_limit,
                remaining=0,
                used=used,
                reset_date=current_date,
                blocked=True,
            )

        new_used = used + 1
        cursor.execute(
            """
            INSERT INTO daily_api_usage (api_key, usage_date, count)
            VALUES (?, ?, ?)
            ON CONFLICT(api_key, usage_date)
            DO UPDATE SET count = excluded.count
            """,
            (api_key, current_date, new_used),
        )
        connection.commit()
        return RateLimitStatus(
            limit=daily_limit,
            remaining=max(daily_limit - new_used, 0),
            used=new_used,
            reset_date=current_date,
            blocked=False,
        )
    finally:
        connection.close()


def _ensure_table(connection: sqlite3.Connection) -> None:
    connection.execute(
        """
        CREATE TABLE IF NOT EXISTS daily_api_usage (
            api_key TEXT NOT NULL,
            usage_date TEXT NOT NULL,
            count INTEGER NOT NULL,
            PRIMARY KEY (api_key, usage_date)
        )
        """
    )
