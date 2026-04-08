"""SQLModel models for Extra and MenuDayExtra."""

from typing import TYPE_CHECKING

from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from app.backend.models.menu import MenuDay


class Extra(SQLModel, table=True):
    """A reusable quick-add item with macros for a base gram amount.

    Users define extras once (e.g. 'Café con leche', 'Whey protein')
    and then attach them to any day with a consumed gram amount.

    Attributes:
        id: Primary key, auto-generated.
        name: Display name (e.g. 'Café con leche').
        serving_g: Gram amount represented by the stored macro values.
        kcal: Kilocalories for ``serving_g`` grams.
        prot_g: Protein grams for ``serving_g`` grams.
        hc_g: Carbohydrate grams for ``serving_g`` grams.
        fat_g: Fat grams for ``serving_g`` grams.
    """

    id: int | None = Field(default=None, primary_key=True)
    name: str
    serving_g: float = Field(default=100)
    kcal: float
    prot_g: float = Field(default=0)
    hc_g: float = Field(default=0)
    fat_g: float = Field(default=0)
    lookup_source: str = Field(default="manual")


class MenuDayExtra(SQLModel, table=True):
    """Association between a MenuDay and an Extra, with consumed grams.

    Attributes:
        id: Primary key, auto-generated.
        day_id: FK to the MenuDay this extra belongs to.
        extra_id: FK to the Extra definition.
        quantity: Legacy multiplier kept for backward compatibility.
        grams: Consumed grams for this extra on the given day.
        day: Parent MenuDay relationship.
        extra: Related Extra definition.
    """

    id: int | None = Field(default=None, primary_key=True)
    day_id: int = Field(foreign_key="menuday.id")
    extra_id: int = Field(foreign_key="extra.id")
    quantity: float = Field(default=1.0)
    grams: float | None = Field(default=None)

    day: "MenuDay" = Relationship(back_populates="day_extras")
    extra: Extra = Relationship()
