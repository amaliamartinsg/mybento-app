export interface RecipeIngredient {
  id: number
  recipe_id: number
  name: string
  quantity_g: number
  kcal_100g: number
  prot_100g: number
  hc_100g: number
  fat_100g: number
}

export interface IngredientInput {
  name: string
  quantity_g: number
}

export interface Recipe {
  id: number
  name: string
  subcategory_id: number | null
  instructions_text: string | null
  image_url: string | null
  external_url: string | null
  servings: number
  kcal: number
  prot_g: number
  hc_g: number
  fat_g: number
  created_at: string
  ingredients: RecipeIngredient[]
}

export interface RecipeCreate {
  name: string
  subcategory_id?: number | null
  instructions_text?: string | null
  image_url?: string | null
  external_url?: string | null
  servings?: number
  ingredients: IngredientInput[]
}

export interface RecipeUpdate {
  name?: string
  subcategory_id?: number | null
  instructions_text?: string | null
  image_url?: string | null
  external_url?: string | null
  servings?: number
  ingredients?: IngredientInput[]
}

export interface RecipeSuggestion {
  name: string
  instructions_text: string
  ingredients: IngredientInput[]
}

export interface RecipeFilters {
  category_id?: number
  subcategory_id?: number
  search?: string
}
