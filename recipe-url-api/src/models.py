from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class RecipeIngredient:
    name: str
    quantity_g: int | None


@dataclass(frozen=True)
class RecipeData:
    name: str
    servings: int | None
    instructions_text: str
    ingredients: list[RecipeIngredient]
