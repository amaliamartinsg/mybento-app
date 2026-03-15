"""Pydantic schemas for Recipe and RecipeIngredient request/response DTOs."""

from datetime import datetime

from pydantic import BaseModel, Field


class IngredientInput(BaseModel):
    """A single ingredient line sent by the client when creating/updating a recipe."""

    name: str
    quantity_g: float = Field(gt=0)


class IngredientRead(BaseModel):
    """A single ingredient line as returned by the API, including macro data."""

    id: int
    name: str
    quantity_g: float
    kcal_100g: float
    prot_100g: float
    hc_100g: float
    fat_100g: float

    model_config = {"from_attributes": True}


class RecipeCreate(BaseModel):
    """Payload to create a new Recipe.

    Macro totals are computed server-side via Edamam — do not send them.
    """

    name: str
    subcategory_id: int | None = None
    instructions_text: str | None = None
    image_url: str | None = None
    servings: int = Field(default=1, ge=1)
    ingredients: list[IngredientInput] = Field(min_length=1)


class RecipeUpdate(BaseModel):
    """Payload to update an existing Recipe (all fields optional)."""

    name: str | None = None
    subcategory_id: int | None = None
    instructions_text: str | None = None
    image_url: str | None = None
    servings: int | None = Field(default=None, ge=1)
    ingredients: list[IngredientInput] | None = None


class RecipeRead(BaseModel):
    """Full recipe as returned by the API, including computed macros and ingredients."""

    id: int
    name: str
    subcategory_id: int | None
    instructions_text: str | None
    image_url: str | None
    servings: int
    kcal: float
    prot_g: float
    hc_g: float
    fat_g: float
    created_at: datetime
    ingredients: list[IngredientRead] = []

    model_config = {"from_attributes": True}


class RecipeSummary(BaseModel):
    """Lightweight recipe representation for list views and menu slot display."""

    id: int
    name: str
    kcal: float
    prot_g: float
    hc_g: float
    fat_g: float
    image_url: str | None

    model_config = {"from_attributes": True}
