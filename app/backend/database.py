"""Database engine and session management for MyBento."""

import os
from contextlib import contextmanager
from typing import Generator

from sqlalchemy import text
from sqlmodel import Session, SQLModel, create_engine

# noqa: F401 — side-effect import: registers all SQLModel table metadata
import app.backend.models  # noqa: F401

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./recipe_manager.db")

engine = create_engine(
    DATABASE_URL,
    echo=False,
    connect_args={"check_same_thread": False},
)

# Incremental ALTER TABLE migrations for SQLite (safe to run multiple times)
_MIGRATIONS = [
    "ALTER TABLE recipe ADD COLUMN meal_type TEXT NOT NULL DEFAULT 'plato_unico'",
    "ALTER TABLE menuslot ADD COLUMN second_recipe_id INTEGER REFERENCES recipe(id)",
    "ALTER TABLE recipeingredient ADD COLUMN nutrition_source TEXT",
    "ALTER TABLE recipeingredient ADD COLUMN nutrition_source_ref TEXT",
    "ALTER TABLE recipeingredient ADD COLUMN barcode TEXT",
    "ALTER TABLE recipeingredient ADD COLUMN nutrition_product_id INTEGER REFERENCES nutritionproduct(id)",
    "ALTER TABLE extra ADD COLUMN serving_g FLOAT NOT NULL DEFAULT 100",
    "ALTER TABLE extra ADD COLUMN lookup_source TEXT NOT NULL DEFAULT 'manual'",
    "ALTER TABLE menudayextra ADD COLUMN grams FLOAT",
    "ALTER TABLE recipe ADD COLUMN is_global BOOLEAN NOT NULL DEFAULT 0",
]


def _run_migrations() -> None:
    """Apply incremental column additions. Silently skips already-applied ones."""
    with engine.connect() as conn:
        for sql in _MIGRATIONS:
            try:
                conn.execute(text(sql))
                conn.commit()
            except Exception:
                pass  # Column already exists — skip


def create_db_and_tables() -> None:
    """Create all tables defined in SQLModel metadata, then apply migrations."""
    SQLModel.metadata.create_all(engine)
    _run_migrations()


@contextmanager
def get_session() -> Generator[Session, None, None]:
    """Provide a transactional database session.

    Usage:
        with get_session() as session:
            session.add(obj)
            session.commit()
    """
    with Session(engine) as session:
        yield session
