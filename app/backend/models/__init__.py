"""SQLModel models package — imports all models so SQLModel registers their metadata."""

from app.backend.models.category import Category, SubCategory
from app.backend.models.extra import Extra, MenuDayExtra
from app.backend.models.menu import MenuDay, MenuSlot, MenuWeek, SlotType
from app.backend.models.nutrition import NutritionProduct
from app.backend.models.profile import ActivityLevel, Goal, Profile
from app.backend.models.recipe import Recipe, RecipeIngredient
from app.backend.models.unit_weight import UnitWeight
from app.backend.models.user import User
from app.backend.models.user_saved_recipe import UserSavedRecipe

__all__ = [
    "Category",
    "SubCategory",
    "Recipe",
    "RecipeIngredient",
    "MenuWeek",
    "MenuDay",
    "MenuSlot",
    "SlotType",
    "Extra",
    "MenuDayExtra",
    "NutritionProduct",
    "ActivityLevel",
    "Goal",
    "Profile",
    "UnitWeight",
    "User",
    "UserSavedRecipe",
]
