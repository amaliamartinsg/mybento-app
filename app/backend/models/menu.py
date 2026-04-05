"""SQLModel models for MenuWeek, MenuDay, MenuSlot and the SlotType enum."""

from datetime import date
from enum import Enum
from typing import TYPE_CHECKING, Optional

from sqlmodel import Field, Relationship, SQLModel

from app.backend.models.recipe import Recipe

if TYPE_CHECKING:
    from app.backend.models.extra import MenuDayExtra


class SlotType(str, Enum):
    """The five fixed meal slots of each day."""

    DESAYUNO = "desayuno"
    MEDIA_MANANA = "media_manana"
    COMIDA = "comida"
    MERIENDA = "merienda"
    CENA = "cena"


class MenuWeek(SQLModel, table=True):
    """A weekly menu identified by its Monday start date.

    Attributes:
        id: Primary key, auto-generated.
        week_start: The Monday that opens this week (unique per week).
        label: Optional user-defined label (e.g. 'Semana cutting').
        days: Related MenuDay rows (one per working day, Mon–Fri).
    """

    id: int | None = Field(default=None, primary_key=True)
    week_start: date
    label: str | None = None

    days: list["MenuDay"] = Relationship(back_populates="week")


class MenuDay(SQLModel, table=True):
    """A single day within a MenuWeek.

    Attributes:
        id: Primary key, auto-generated.
        week_id: FK to the parent MenuWeek.
        day_date: Calendar date for this day.
        week: Parent MenuWeek relationship.
        slots: The five meal slots for this day.
        day_extras: Quick-add extras consumed this day.
    """

    id: int | None = Field(default=None, primary_key=True)
    week_id: int = Field(foreign_key="menuweek.id")
    day_date: date

    week: MenuWeek = Relationship(back_populates="days")
    slots: list["MenuSlot"] = Relationship(back_populates="day")
    day_extras: list["MenuDayExtra"] = Relationship(back_populates="day")


class MenuSlot(SQLModel, table=True):
    """One meal slot within a MenuDay (e.g. Desayuno, Comida).

    Attributes:
        id: Primary key, auto-generated.
        day_id: FK to the parent MenuDay.
        slot_type: Which meal this slot represents.
        recipe_id: FK to the assigned Recipe; None means the slot is empty.
        second_recipe_id: FK to a second Recipe for Comida slots with primero+segundo.
        day: Parent MenuDay relationship.
        recipe: Assigned Recipe (nullable).
        second_recipe: Second course Recipe for Comida slots (nullable).
    """

    id: int | None = Field(default=None, primary_key=True)
    day_id: int = Field(foreign_key="menuday.id")
    slot_type: SlotType
    recipe_id: int | None = Field(default=None, foreign_key="recipe.id")
    second_recipe_id: int | None = Field(default=None, foreign_key="recipe.id")

    day: MenuDay = Relationship(back_populates="slots")
    recipe: Optional[Recipe] = Relationship(
        sa_relationship_kwargs={"foreign_keys": "[MenuSlot.recipe_id]"}
    )
    second_recipe: Optional[Recipe] = Relationship(
        sa_relationship_kwargs={"foreign_keys": "[MenuSlot.second_recipe_id]"}
    )
