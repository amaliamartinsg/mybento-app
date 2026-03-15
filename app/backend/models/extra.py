"""SQLModel models for Extra and MenuDayExtra."""

from typing import TYPE_CHECKING

from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from app.backend.models.menu import MenuDay


class Extra(SQLModel, table=True):
    """A reusable quick-add item with fixed macro values.

    Users define extras once (e.g. 'Café con leche', 'Whey protein')
    and then attach them to any day with an optional quantity multiplier.

    Attributes:
        id: Primary key, auto-generated.
        name: Display name (e.g. 'Café con leche').
        kcal: Kilocalories for one unit/portion.
        prot_g: Protein grams for one unit/portion.
        hc_g: Carbohydrate grams for one unit/portion.
        fat_g: Fat grams for one unit/portion.
    """

    id: int | None = Field(default=None, primary_key=True)
    name: str
    kcal: float
    prot_g: float = Field(default=0)
    hc_g: float = Field(default=0)
    fat_g: float = Field(default=0)


class MenuDayExtra(SQLModel, table=True):
    """Association between a MenuDay and an Extra, with a quantity multiplier.

    Attributes:
        id: Primary key, auto-generated.
        day_id: FK to the MenuDay this extra belongs to.
        extra_id: FK to the Extra definition.
        quantity: Multiplier (1.0 = one portion, 2.0 = double portion).
        day: Parent MenuDay relationship.
        extra: Related Extra definition.
    """

    id: int | None = Field(default=None, primary_key=True)
    day_id: int = Field(foreign_key="menuday.id")
    extra_id: int = Field(foreign_key="extra.id")
    quantity: float = Field(default=1.0)

    day: "MenuDay" = Relationship(back_populates="day_extras")
    extra: Extra = Relationship()
