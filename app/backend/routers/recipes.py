"""FastAPI router for Recipe endpoints.

All routes are prefixed with /recipes and tagged "recipes" in Swagger.

Route order matters for FastAPI's path matching:
  - /recipes/images  must come before /recipes/{id}
  - /recipes/suggest is a POST so there is no ambiguity
"""

from typing import Annotated

from fastapi import APIRouter, HTTPException, Query, status
from sqlmodel import select

from app.backend.database import get_session
from app.backend.models.category import SubCategory
from app.backend.models.recipe import Recipe, RecipeIngredient
from app.backend.schemas.recipe import (
    RecipeCreate,
    RecipeRead,
    RecipeSuggestion,
    RecipeSummary,
    RecipeUpdate,
    ScrapedRecipe,
    ScrapeRequest,
)
from app.backend.services.macro_calculator import calculate_recipe_macros
from app.backend.services.recipe_macros import (
    per_serving_totals,
    to_total_from_per_serving,
)
from app.backend.services.nutrition_resolver import resolve_ingredient_nutrition
from app.backend.services.openai_service import OpenAIAuthError, suggest_recipe
from app.backend.services.unsplash import UnsplashAuthError, search_images
from app.backend.services.scraper import (
    ScraperAuthError,
    ScraperRateLimitError,
    scrape_recipe_from_url,
)
from app.backend.services.usda import USDAAuthError

router = APIRouter(prefix="/recipes", tags=["recipes"])


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------


def _build_recipe_read(recipe: Recipe) -> RecipeRead:
    """Convert a Recipe ORM instance to its RecipeRead schema."""
    macros = per_serving_totals(recipe)
    return RecipeRead(
        id=recipe.id,
        name=recipe.name,
        subcategory_id=recipe.subcategory_id,
        meal_type=recipe.meal_type,
        instructions_text=recipe.instructions_text,
        image_url=recipe.image_url,
        external_url=recipe.external_url,
        servings=recipe.servings,
        kcal=macros.kcal,
        prot_g=macros.prot_g,
        hc_g=macros.hc_g,
        fat_g=macros.fat_g,
        created_at=recipe.created_at,
        ingredients=recipe.ingredients,
    )


# ---------------------------------------------------------------------------
# GET /recipes/images  — must be declared before GET /recipes/{id}
# ---------------------------------------------------------------------------


@router.get("/images", response_model=list[str], summary="Buscar imágenes en Unsplash")
async def get_recipe_images(
    query: Annotated[str, Query(min_length=1, description="Término de búsqueda")],
    count: Annotated[int, Query(ge=1, le=20)] = 3,
    page: Annotated[int, Query(ge=1, le=30)] = 1,
) -> list[str]:
    """Return a list of Unsplash image URLs matching *query*.

    Args:
        query: Search term (English terms give better results).
        count: Number of images to return (1-20, default 3).
        page: Page of results to return (1-30, default 1).

    Raises:
        HTTPException 502: If Unsplash returns an error.
    """
    try:
        urls = await search_images(query=query, count=count, page=page)
    except UnsplashAuthError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(exc),
        ) from exc
    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc
    return urls


# ---------------------------------------------------------------------------
# GET /recipes
# ---------------------------------------------------------------------------


@router.get("", response_model=list[RecipeSummary], summary="Listar recetas")
def list_recipes(
    category_id: Annotated[int | None, Query()] = None,
    subcategory_id: Annotated[int | None, Query()] = None,
    search: Annotated[str | None, Query()] = None,
) -> list[RecipeSummary]:
    """Return a summarised list of recipes with optional filters.

    Args:
        category_id: Filter by top-level category (joins through SubCategory).
        subcategory_id: Filter by subcategory.
        search: Case-insensitive partial name match.
    """
    with get_session() as session:
        query = select(Recipe)

        if subcategory_id is not None:
            query = query.where(Recipe.subcategory_id == subcategory_id)
        elif category_id is not None:
            # Join through SubCategory to filter by parent category
            query = query.join(
                SubCategory, Recipe.subcategory_id == SubCategory.id, isouter=True
            ).where(SubCategory.category_id == category_id)

        if search:
            query = query.where(Recipe.name.ilike(f"%{search}%"))  # type: ignore[attr-defined]

        recipes = session.exec(query).all()
        return [
            RecipeSummary(
                id=r.id,
                name=r.name,
                meal_type=r.meal_type,
                kcal=per_serving_totals(r).kcal,
                prot_g=per_serving_totals(r).prot_g,
                hc_g=per_serving_totals(r).hc_g,
                fat_g=per_serving_totals(r).fat_g,
                image_url=r.image_url,
            )
            for r in recipes
        ]


# ---------------------------------------------------------------------------
# GET /recipes/{id}
# ---------------------------------------------------------------------------


@router.get("/{recipe_id}", response_model=RecipeRead, summary="Detalle de receta")
def get_recipe(recipe_id: int) -> RecipeRead:
    """Return full recipe details including ingredients and macros.

    Raises:
        HTTPException 404: If the recipe does not exist.
    """
    with get_session() as session:
        recipe = session.get(Recipe, recipe_id)
        if recipe is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Receta con id={recipe_id} no encontrada",
            )
        # Access ingredients while session is open so the lazy load completes
        _ = recipe.ingredients
        return _build_recipe_read(recipe)


# ---------------------------------------------------------------------------
# POST /recipes
# ---------------------------------------------------------------------------


@router.post("", response_model=RecipeRead, status_code=status.HTTP_201_CREATED, summary="Crear receta")
async def create_recipe(payload: RecipeCreate) -> RecipeRead:
    """Create a new recipe, fetching macro data from USDA for each ingredient.

    Flow:
        1. For each ingredient, translate the name to English via GPT-4o mini,
           then query USDA FoodData Central for per-100g macro values.
        2. Persist :class:`RecipeIngredient` rows with those values.
        3. Compute recipe macro totals via :func:`calculate_recipe_macros`.
        4. Persist the :class:`Recipe` and return :class:`RecipeRead`.

    Raises:
        HTTPException 403: If the USDA API key is invalid.
        HTTPException 502: If the USDA API call fails unexpectedly.
    """
    with get_session() as session:
        ingredient_rows: list[RecipeIngredient] = []
        for ing_input in payload.ingredients:
            try:
                resolved = await resolve_ingredient_nutrition(session, ing_input)
            except USDAAuthError as exc:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=str(exc),
                ) from exc
            except RuntimeError as exc:
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail=str(exc),
                ) from exc

            ingredient_rows.append(
                RecipeIngredient(
                    name=resolved.name,
                    quantity_g=resolved.quantity_g,
                    kcal_100g=resolved.kcal_100g,
                    prot_100g=resolved.prot_100g,
                    hc_100g=resolved.hc_100g,
                    fat_100g=resolved.fat_100g,
                    nutrition_product_id=resolved.nutrition_product_id,
                    nutrition_source=resolved.nutrition_source,
                    nutrition_source_ref=resolved.nutrition_source_ref,
                    barcode=resolved.barcode,
                )
            )

        totals = calculate_recipe_macros(ingredient_rows)

        recipe = Recipe(
            name=payload.name,
            subcategory_id=payload.subcategory_id,
            meal_type=payload.meal_type,
            instructions_text=payload.instructions_text,
            image_url=payload.image_url,
            external_url=payload.external_url,
            servings=payload.servings,
            kcal=totals.kcal,
            prot_g=totals.prot_g,
            hc_g=totals.hc_g,
            fat_g=totals.fat_g,
        )

        session.add(recipe)
        session.flush()  # assigns recipe.id before we set FKs

        for row in ingredient_rows:
            row.recipe_id = recipe.id  # type: ignore[assignment]
            session.add(row)

        session.commit()
        session.refresh(recipe)
        _ = recipe.ingredients  # load while session is still open
        return _build_recipe_read(recipe)


# ---------------------------------------------------------------------------
# PUT /recipes/{id}
# ---------------------------------------------------------------------------


@router.put("/{recipe_id}", response_model=RecipeRead, summary="Actualizar receta")
async def update_recipe(recipe_id: int, payload: RecipeUpdate) -> RecipeRead:
    """Update an existing recipe.

    If ``ingredients`` are provided the old ingredient rows are replaced and
    macros are recalculated via USDA. If ``ingredients`` is omitted, macros
    remain unchanged.

    Raises:
        HTTPException 404: If the recipe does not exist.
        HTTPException 403: If the USDA API key is invalid.
        HTTPException 502: If a USDA call fails.
    """
    with get_session() as session:
        recipe = session.get(Recipe, recipe_id)
        if recipe is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Receta con id={recipe_id} no encontrada",
            )

        # Update scalar fields if provided
        if payload.name is not None:
            recipe.name = payload.name
        if payload.subcategory_id is not None:
            recipe.subcategory_id = payload.subcategory_id
        if payload.meal_type is not None:
            recipe.meal_type = payload.meal_type
        if payload.instructions_text is not None:
            recipe.instructions_text = payload.instructions_text
        if payload.image_url is not None:
            recipe.image_url = payload.image_url
        if payload.external_url is not None:
            recipe.external_url = payload.external_url
        if payload.servings is not None:
            recipe.servings = payload.servings

        if payload.ingredients is not None:
            # Delete old ingredient rows
            old_ingredients = session.exec(
                select(RecipeIngredient).where(RecipeIngredient.recipe_id == recipe_id)
            ).all()
            for old in old_ingredients:
                session.delete(old)
            session.flush()

            # Fetch macros for new ingredients
            new_rows: list[RecipeIngredient] = []
            for ing_input in payload.ingredients:
                try:
                    resolved = await resolve_ingredient_nutrition(session, ing_input)
                except USDAAuthError as exc:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail=str(exc),
                    ) from exc
                except RuntimeError as exc:
                    raise HTTPException(
                        status_code=status.HTTP_502_BAD_GATEWAY,
                        detail=str(exc),
                    ) from exc

                new_rows.append(
                    RecipeIngredient(
                        recipe_id=recipe_id,
                        name=resolved.name,
                        quantity_g=resolved.quantity_g,
                        kcal_100g=resolved.kcal_100g,
                        prot_100g=resolved.prot_100g,
                        hc_100g=resolved.hc_100g,
                        fat_100g=resolved.fat_100g,
                        nutrition_product_id=resolved.nutrition_product_id,
                        nutrition_source=resolved.nutrition_source,
                        nutrition_source_ref=resolved.nutrition_source_ref,
                        barcode=resolved.barcode,
                    )
                )

            totals = calculate_recipe_macros(new_rows)
            # Manual overrides take precedence over USDA-calculated values
            recipe.kcal = (
                to_total_from_per_serving(payload.kcal, recipe.servings)
                if payload.kcal is not None
                else totals.kcal
            )
            recipe.prot_g = (
                to_total_from_per_serving(payload.prot_g, recipe.servings)
                if payload.prot_g is not None
                else totals.prot_g
            )
            recipe.hc_g = (
                to_total_from_per_serving(payload.hc_g, recipe.servings)
                if payload.hc_g is not None
                else totals.hc_g
            )
            recipe.fat_g = (
                to_total_from_per_serving(payload.fat_g, recipe.servings)
                if payload.fat_g is not None
                else totals.fat_g
            )

            for row in new_rows:
                session.add(row)

        else:
            # No ingredient changes — apply manual macro overrides directly
            if payload.kcal is not None:
                recipe.kcal = to_total_from_per_serving(payload.kcal, recipe.servings)
            if payload.prot_g is not None:
                recipe.prot_g = to_total_from_per_serving(payload.prot_g, recipe.servings)
            if payload.hc_g is not None:
                recipe.hc_g = to_total_from_per_serving(payload.hc_g, recipe.servings)
            if payload.fat_g is not None:
                recipe.fat_g = to_total_from_per_serving(payload.fat_g, recipe.servings)

        session.add(recipe)
        session.commit()
        session.refresh(recipe)
        _ = recipe.ingredients
        return _build_recipe_read(recipe)


# ---------------------------------------------------------------------------
# DELETE /recipes/{id}
# ---------------------------------------------------------------------------


@router.delete(
    "/{recipe_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Eliminar receta",
)
def delete_recipe(recipe_id: int) -> None:
    """Delete a recipe and all its ingredient rows.

    Raises:
        HTTPException 404: If the recipe does not exist.
    """
    with get_session() as session:
        recipe = session.get(Recipe, recipe_id)
        if recipe is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Receta con id={recipe_id} no encontrada",
            )

        # Delete ingredients first (no CASCADE configured at DB level)
        ingredients = session.exec(
            select(RecipeIngredient).where(RecipeIngredient.recipe_id == recipe_id)
        ).all()
        for ing in ingredients:
            session.delete(ing)

        session.delete(recipe)
        session.commit()


# ---------------------------------------------------------------------------
# POST /recipes/scrape  — Extract recipe from external URL
# ---------------------------------------------------------------------------


@router.post(
    "/scrape",
    response_model=ScrapedRecipe,
    summary="Extraer receta desde URL externa",
)
async def scrape_recipe_endpoint(payload: ScrapeRequest) -> ScrapedRecipe:
    """Call the external scraper service to extract recipe data from a URL.

    The returned :class:`ScrapedRecipe` is a draft for the user to review
    and edit before saving. It is **not** persisted automatically.

    Args:
        payload: Object containing the URL to scrape.

    Raises:
        HTTPException 403: If the scraper API key is invalid.
        HTTPException 429: If the daily rate limit is exceeded.
        HTTPException 504: If the scraper service times out.
        HTTPException 502: If the scraper service returns any other error.
    """
    try:
        result = await scrape_recipe_from_url(payload.url)
    except ScraperAuthError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(exc),
        ) from exc
    except ScraperRateLimitError as exc:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=str(exc),
        ) from exc
    except RuntimeError as exc:
        detail = str(exc)
        status_code = (
            status.HTTP_504_GATEWAY_TIMEOUT
            if "tardó demasiado" in detail
            else status.HTTP_502_BAD_GATEWAY
        )
        raise HTTPException(status_code=status_code, detail=detail) from exc
    return result


# ---------------------------------------------------------------------------
# POST /recipes/suggest  — Despensa Virtual
# ---------------------------------------------------------------------------


@router.post(
    "/suggest",
    response_model=RecipeSuggestion,
    summary="Sugerir receta con IA (Despensa Virtual)",
)
async def suggest_recipe_endpoint(ingredients: list[str]) -> RecipeSuggestion:
    """Ask GPT-4o mini to suggest a recipe from the provided ingredients.

    The returned :class:`RecipeSuggestion` is a draft that the user reviews
    and edits before saving — it is **not** persisted automatically.

    Args:
        ingredients: List of ingredient names available in the pantry.

    Raises:
        HTTPException 400: If no ingredients are provided.
        HTTPException 502: If the OpenAI call fails or returns invalid JSON.
    """
    if not ingredients:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Debes proporcionar al menos un ingrediente",
        )

    try:
        suggestion = await suggest_recipe(ingredients)
    except OpenAIAuthError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(exc),
        ) from exc
    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc

    return suggestion
