"""Bookmark endpoints: save/unsave recipes for the current user."""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlmodel import select

from app.backend.database import get_session
from app.backend.models.recipe import Recipe
from app.backend.models.user_saved_recipe import UserSavedRecipe
from app.backend.schemas.recipe import RecipeSummary
from app.backend.services import auth_service
from app.backend.services.recipe_macros import per_serving_totals

router = APIRouter(prefix="/recipes", tags=["bookmarks"])
_bearer = HTTPBearer(auto_error=False)


def _get_user_id(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
) -> int:
    """Return the authenticated user's id, or 1 as mono-user fallback."""
    if credentials is None:
        return 1
    token_data = auth_service.decode_token(credentials.credentials)
    return token_data.user_id if token_data and token_data.user_id else 1


def _to_summary(recipe: Recipe, bookmarked: bool = True) -> RecipeSummary:
    macros = per_serving_totals(recipe)
    return RecipeSummary(
        id=recipe.id,
        name=recipe.name,
        subcategory_id=recipe.subcategory_id,
        meal_type=recipe.meal_type,
        kcal=macros.kcal,
        prot_g=macros.prot_g,
        hc_g=macros.hc_g,
        fat_g=macros.fat_g,
        image_url=recipe.image_url,
        is_global=recipe.is_global,
        is_bookmarked=bookmarked,
    )


# GET /recipes/bookmarked must be declared before GET /recipes/{recipe_id} in main.py
@router.get("/bookmarked", response_model=list[RecipeSummary], summary="Mis recetas guardadas")
def list_bookmarked(user_id: int = Depends(_get_user_id)) -> list[RecipeSummary]:
    """Return recipes bookmarked by the current user."""
    with get_session() as session:
        saved_ids = session.exec(
            select(UserSavedRecipe.recipe_id).where(UserSavedRecipe.user_id == user_id)
        ).all()
        if not saved_ids:
            return []
        recipes = session.exec(select(Recipe).where(Recipe.id.in_(saved_ids))).all()
        return [_to_summary(r) for r in recipes]


@router.post("/{recipe_id}/bookmark", status_code=status.HTTP_204_NO_CONTENT, summary="Guardar receta")
def bookmark_recipe(recipe_id: int, user_id: int = Depends(_get_user_id)) -> None:
    """Add a recipe to the user's saved collection."""
    with get_session() as session:
        if session.get(Recipe, recipe_id) is None:
            raise HTTPException(status_code=404, detail="Receta no encontrada")
        existing = session.exec(
            select(UserSavedRecipe).where(
                UserSavedRecipe.user_id == user_id,
                UserSavedRecipe.recipe_id == recipe_id,
            )
        ).first()
        if not existing:
            session.add(UserSavedRecipe(user_id=user_id, recipe_id=recipe_id))
            session.commit()


@router.delete("/{recipe_id}/bookmark", status_code=status.HTTP_204_NO_CONTENT, summary="Quitar receta guardada")
def unbookmark_recipe(recipe_id: int, user_id: int = Depends(_get_user_id)) -> None:
    """Remove a recipe from the user's saved collection."""
    with get_session() as session:
        row = session.exec(
            select(UserSavedRecipe).where(
                UserSavedRecipe.user_id == user_id,
                UserSavedRecipe.recipe_id == recipe_id,
            )
        ).first()
        if row:
            session.delete(row)
            session.commit()
