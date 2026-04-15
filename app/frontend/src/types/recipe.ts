export type MealType = 'plato_unico' | 'primero' | 'segundo'

export interface RecipeIngredient {
  id: number
  recipe_id: number
  name: string
  quantity_g: number
  kcal_100g: number
  prot_100g: number
  hc_100g: number
  fat_100g: number
  nutrition_product_id?: number | null
  nutrition_source?: string | null
  nutrition_source_ref?: string | null
  barcode?: string | null
}

export interface ResolvedNutritionRef {
  product_id: number
}

export interface IngredientInput {
  name: string
  quantity_g: number
  resolved_nutrition?: ResolvedNutritionRef | null
}

export interface Recipe {
  id: number
  name: string
  subcategory_id: number | null
  meal_type: MealType
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
  meal_type?: MealType
  instructions_text?: string | null
  image_url?: string | null
  external_url?: string | null
  servings?: number
  ingredients: IngredientInput[]
}

export interface RecipeUpdate {
  name?: string
  subcategory_id?: number | null
  meal_type?: MealType
  instructions_text?: string | null
  image_url?: string | null
  external_url?: string | null
  servings?: number
  ingredients?: IngredientInput[]
  kcal?: number
  prot_g?: number
  hc_g?: number
  fat_g?: number
}

export interface RecipeSuggestion {
  name: string
  category_suggestion?: string | null
  servings?: number
  instructions_text?: string | null
  ingredients: IngredientInput[]
}

export interface ScrapedRecipe {
  name: string
  servings?: number | null
  instructions_text?: string | null
  ingredients: IngredientInput[]
}

export interface RecipeFilters {
  category_id?: number
  subcategory_id?: number
  search?: string
}

export type RecipeSummary = Omit<Recipe, 'ingredients' | 'instructions_text' | 'external_url' | 'created_at' | 'servings' | 'subcategory_id'> & {
  subcategory_id: number | null
  instructions_text: string | null
  external_url: string | null
  servings: number
  created_at: string
  ingredients?: RecipeIngredient[]
}

export interface BarcodeResolvedProduct {
  product_id: number
  name: string
  barcode: string
  source: string
  source_ref?: string | null
  kcal_100g: number
  prot_100g: number
  hc_100g: number
  fat_100g: number
}

export interface BarcodeResolveResponse {
  barcode: string
  product: BarcodeResolvedProduct
}
