"""Helpers to work with recipe macros on a per-serving basis."""

from app.backend.models.recipe import Recipe
from app.backend.services.macro_calculator import MacroTotals


def _safe_servings(servings: int | None) -> int:
    return max(1, servings or 1)


def per_serving_totals(recipe: Recipe) -> MacroTotals:
    """Return the recipe macros normalized to one serving."""
    servings = _safe_servings(recipe.servings)
    return MacroTotals(
        kcal=round(recipe.kcal / servings, 1),
        prot_g=round(recipe.prot_g / servings, 1),
        hc_g=round(recipe.hc_g / servings, 1),
        fat_g=round(recipe.fat_g / servings, 1),
    )


def to_total_from_per_serving(value: float, servings: int | None) -> float:
    """Convert a per-serving value from the API/UI into stored recipe totals."""
    return round(value * _safe_servings(servings), 1)
