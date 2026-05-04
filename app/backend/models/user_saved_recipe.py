"""Join table: recipes bookmarked/saved by a user."""

from sqlmodel import Field, SQLModel


class UserSavedRecipe(SQLModel, table=True):
    user_id: int = Field(foreign_key="user.id", primary_key=True)
    recipe_id: int = Field(foreign_key="recipe.id", primary_key=True)
