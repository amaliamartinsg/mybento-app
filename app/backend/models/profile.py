"""SQLModel model for the user Profile, including TDEE targets and macro ratios."""

from enum import Enum

from sqlmodel import Field, SQLModel


class ActivityLevel(str, Enum):
    """Physical activity multiplier for TDEE calculation (Mifflin-St Jeor)."""

    SEDENTARY = "sedentary"      # x1.2   — desk job, no exercise
    LIGHT = "light"              # x1.375 — light exercise 1-3 days/week
    MODERATE = "moderate"        # x1.55  — moderate exercise 3-5 days/week
    ACTIVE = "active"            # x1.725 — hard exercise 6-7 days/week
    VERY_ACTIVE = "very_active"  # x1.9   — very hard exercise + physical job


class Goal(str, Enum):
    """Caloric goal relative to TDEE."""

    DEFICIT = "deficit"    # TDEE - 500 kcal
    MAINTAIN = "maintain"  # TDEE
    SURPLUS = "surplus"    # TDEE + 300 kcal


class Profile(SQLModel, table=True):
    """Single-row user profile that drives TDEE and macro targets.

    This table always contains exactly one row with id=1.
    Macro gram targets are recomputed and stored whenever the profile
    is updated via PUT /profile.

    Attributes:
        id: Always 1 — enforces single-user constraint.
        weight_kg: Body weight in kilograms.
        height_cm: Height in centimetres.
        age: Age in years.
        gender: Biological sex used in Mifflin-St Jeor ('male' | 'female').
        activity_level: Physical activity multiplier category.
        goal: Caloric goal (deficit / maintain / surplus).
        kcal_target: Computed daily calorie target.
        prot_pct: Target protein as percentage of total calories.
        hc_pct: Target carbohydrates as percentage of total calories.
        fat_pct: Target fat as percentage of total calories.
        prot_g_target: Daily protein target in grams.
        hc_g_target: Daily carbohydrate target in grams.
        fat_g_target: Daily fat target in grams.
    """

    id: int = Field(default=1, primary_key=True)
    weight_kg: float = Field(default=75)
    height_cm: float = Field(default=175)
    age: int = Field(default=30)
    gender: str = Field(default="male")  # "male" | "female"

    activity_level: ActivityLevel = Field(default=ActivityLevel.MODERATE)
    goal: Goal = Field(default=Goal.MAINTAIN)

    # Computed calorie target (stored after each profile update)
    kcal_target: float = Field(default=2000)

    # Macro ratio percentages (must sum to 100)
    prot_pct: float = Field(default=30)
    hc_pct: float = Field(default=45)
    fat_pct: float = Field(default=25)

    # Macro gram targets derived from kcal_target + percentages
    prot_g_target: float = Field(default=150)
    hc_g_target: float = Field(default=225)
    fat_g_target: float = Field(default=56)
