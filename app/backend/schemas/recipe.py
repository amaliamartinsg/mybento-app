"""Pydantic schemas for Recipe and RecipeIngredient request/response DTOs."""

from datetime import datetime

from pydantic import BaseModel, Field

from app.backend.models.recipe import MealType
from app.backend.schemas.nutrition import ResolvedNutritionInput


class IngredientInput(BaseModel):
    """A single ingredient line sent by the client when creating/updating a recipe."""

    name: str
    quantity_g: float = Field(gt=0)
    resolved_nutrition: ResolvedNutritionInput | None = None


class IngredientRead(BaseModel):
    """A single ingredient line as returned by the API, including macro data."""

    id: int
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

    model_config = {"from_attributes": True}


class RecipeCreate(BaseModel):
    """Payload to create a new Recipe.

    Macro totals are computed server-side via USDA FoodData Central — do not send them.
    """

    name: str
    subcategory_id: int | None = None
    meal_type: MealType = MealType.PLATO_UNICO
    instructions_text: str | None = None
    image_url: str | None = None
    external_url: str | None = None
    servings: int = Field(default=1, ge=1)
    ingredients: list[IngredientInput] = Field(min_length=1)


class RecipeUpdate(BaseModel):
    """Payload to update an existing Recipe (all fields optional).

    Macro fields (kcal, prot_g, hc_g, fat_g) allow manual overrides.
    If ingredients are also provided, manual macros take precedence over
    the USDA-calculated values.
    """

    name: str | None = None
    subcategory_id: int | None = None
    meal_type: MealType | None = None
    instructions_text: str | None = None
    image_url: str | None = None
    external_url: str | None = None
    servings: int | None = Field(default=None, ge=1)
    ingredients: list[IngredientInput] | None = None
    kcal: float | None = Field(default=None, ge=0)
    prot_g: float | None = Field(default=None, ge=0)
    hc_g: float | None = Field(default=None, ge=0)
    fat_g: float | None = Field(default=None, ge=0)


class RecipeRead(BaseModel):
    """Full recipe as returned by the API, including computed macros and ingredients."""

    id: int
    name: str
    subcategory_id: int | None
    meal_type: MealType
    instructions_text: str | None
    image_url: str | None
    external_url: str | None
    servings: int
    kcal: float
    prot_g: float
    hc_g: float
    fat_g: float
    created_at: datetime
    ingredients: list[IngredientRead] = []

    model_config = {"from_attributes": True}


class RecipeSuggestionIngredient(BaseModel):
    """A single ingredient line within a GPT-suggested recipe."""

    name: str
    quantity_g: float


class RecipeSuggestion(BaseModel):
    """Structured recipe suggestion returned by the OpenAI service.

    Validated directly from the JSON produced by GPT-4o mini.
    """

    name: str
    category_suggestion: str | None = None
    servings: int = 1
    instructions_text: str | None = None
    ingredients: list[RecipeSuggestionIngredient] = []


class RecipeTitleRequest(BaseModel):
    """Payload para generar una receta con IA a partir de un titulo."""

    title: str = Field(min_length=1)


class IngredientSearchRequest(BaseModel):
    """Payload para buscar recetas existentes por ingredientes."""

    ingredients: list[str] = Field(min_length=1)


class ScrapeRequest(BaseModel):
    """Payload para solicitar extracción de receta desde una URL externa."""

    url: str


class ScrapedRecipe(BaseModel):
    """Datos de receta extraídos de una URL por el servicio de scraping externo.

    Todos los campos son opcionales salvo ``name`` — el extractor puede no
    disponer de raciones, instrucciones o ingredientes según la fuente.
    """

    name: str
    servings: int | None = None
    instructions_text: str | None = None
    ingredients: list[RecipeSuggestionIngredient] = []


class RecipeSummary(BaseModel):
    """Lightweight recipe representation for list views and menu slot display."""

    id: int
    name: str
    meal_type: MealType
    kcal: float
    prot_g: float
    hc_g: float
    fat_g: float
    image_url: str | None

    model_config = {"from_attributes": True}
