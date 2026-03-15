"""SQLModel models for Category and SubCategory."""

from typing import TYPE_CHECKING

from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from app.backend.models.recipe import Recipe


class Category(SQLModel, table=True):
    """Top-level recipe category (e.g. Desayuno, Comida, Cena, Snack).

    Attributes:
        id: Primary key, auto-generated.
        name: Human-readable category name, indexed for fast lookups.
        color: Optional hex color string for UI display (e.g. '#FF5733').
        subcategories: Related SubCategory rows.
    """

    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    color: str | None = None

    subcategories: list["SubCategory"] = Relationship(back_populates="category")


class SubCategory(SQLModel, table=True):
    """Second-level recipe category nested under a Category.

    Attributes:
        id: Primary key, auto-generated.
        name: Human-readable subcategory name.
        category_id: Foreign key referencing the parent Category.
        category: Parent Category relationship.
        recipes: Recipes assigned to this subcategory.
    """

    id: int | None = Field(default=None, primary_key=True)
    name: str
    category_id: int = Field(foreign_key="category.id")

    category: Category = Relationship(back_populates="subcategories")
    recipes: list["Recipe"] = Relationship(back_populates="subcategory")
