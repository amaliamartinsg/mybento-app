"""Unified nutrition resolution for ingredients."""

from __future__ import annotations

from dataclasses import dataclass

from sqlmodel import Session

from app.backend.models.nutrition import NutritionProduct
from app.backend.schemas.recipe import IngredientInput
from app.backend.services.barcode_nutrition import get_product_by_id
from app.backend.services.usda import USDAAuthError, get_nutrition


@dataclass
class ResolvedIngredientNutrition:
    """Trusted normalized nutrition attached to a recipe ingredient."""

    name: str
    quantity_g: float
    kcal_100g: float
    prot_100g: float
    hc_100g: float
    fat_100g: float
    nutrition_product_id: int | None = None
    nutrition_source: str | None = None
    nutrition_source_ref: str | None = None
    barcode: str | None = None


async def resolve_ingredient_nutrition(
    session: Session, ingredient: IngredientInput
) -> ResolvedIngredientNutrition:
    """Resolve ingredient nutrition from a trusted product cache or USDA."""
    if ingredient.resolved_nutrition is not None:
        product = get_product_by_id(session, ingredient.resolved_nutrition.product_id)
        if product is None:
            raise RuntimeError("La referencia nutricional del ingrediente ya no existe.")
        return _from_product(ingredient, product)

    nutrition = await get_nutrition(ingredient.name)
    return ResolvedIngredientNutrition(
        name=ingredient.name,
        quantity_g=ingredient.quantity_g,
        kcal_100g=nutrition.kcal_100g,
        prot_100g=nutrition.prot_100g,
        hc_100g=nutrition.hc_100g,
        fat_100g=nutrition.fat_100g,
        nutrition_product_id=None,
        nutrition_source="usda",
        nutrition_source_ref=ingredient.name,
    )


def _from_product(
    ingredient: IngredientInput, product: NutritionProduct
) -> ResolvedIngredientNutrition:
    return ResolvedIngredientNutrition(
        name=ingredient.name or product.name,
        quantity_g=ingredient.quantity_g,
        kcal_100g=product.kcal_100g,
        prot_100g=product.prot_100g,
        hc_100g=product.hc_100g,
        fat_100g=product.fat_100g,
        nutrition_product_id=product.id,
        nutrition_source=product.source,
        nutrition_source_ref=product.source_ref,
        barcode=product.barcode,
    )
