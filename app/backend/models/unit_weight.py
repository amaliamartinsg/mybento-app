"""SQLModel model for UnitWeight — grams per 1 unit of an ingredient."""

from sqlmodel import Field, SQLModel


class UnitWeight(SQLModel, table=True):
    """Maps an ingredient name to its weight in grams per unit (e.g. 'Huevo' -> 60g).

    Attributes:
        id: Primary key, auto-generated.
        ingredient_name: Ingredient name, case-insensitive unique lookup key.
        grams_per_unit: Weight in grams of one unit of this ingredient.
    """

    id: int | None = Field(default=None, primary_key=True)
    ingredient_name: str = Field(index=True, unique=True)
    grams_per_unit: float = Field(gt=0)
