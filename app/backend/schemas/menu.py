"""Pydantic schemas for MenuWeek, MenuDay, MenuSlot and macro summaries."""

from datetime import date

from pydantic import BaseModel

from app.backend.models.menu import SlotType
from app.backend.schemas.recipe import RecipeSummary


class SlotRead(BaseModel):
    """A single menu slot as returned by the API."""

    id: int
    slot_type: SlotType
    recipe: RecipeSummary | None
    second_recipe: RecipeSummary | None = None

    model_config = {"from_attributes": True}


class DayExtraRead(BaseModel):
    """An extra item attached to a day, including its macro contribution."""

    id: int
    extra_id: int
    name: str
    quantity: float
    grams: float
    serving_g: float
    kcal: float
    prot_g: float
    hc_g: float
    fat_g: float

    model_config = {"from_attributes": True}


class DayMacrosSummary(BaseModel):
    """Aggregated macro totals for a single day (slots + extras)."""

    kcal: float
    prot_g: float
    hc_g: float
    fat_g: float


class MenuDayRead(BaseModel):
    """A day within a week, with its slots, extras and computed macro totals."""

    id: int
    day_date: date
    slots: list[SlotRead] = []
    day_extras: list[DayExtraRead] = []
    macros: DayMacrosSummary

    model_config = {"from_attributes": True}


class MenuWeekRead(BaseModel):
    """A full week with all days, slots and macro summaries."""

    id: int
    week_start: date
    label: str | None
    days: list[MenuDayRead] = []

    model_config = {"from_attributes": True}


class MenuWeekSummary(BaseModel):
    """Lightweight week representation for the weeks list view."""

    id: int
    week_start: date
    label: str | None
    filled_slots: int   # number of slots that have a recipe assigned
    total_slots: int    # always 25 (5 days × 5 slots)

    model_config = {"from_attributes": True}


class MenuWeekCreate(BaseModel):
    """Payload to create a new MenuWeek."""

    week_start: date
    label: str | None = None


class SlotUpdate(BaseModel):
    """Payload to assign or clear a recipe in a slot."""

    recipe_id: int | None = None
    second_recipe_id: int | None = None
