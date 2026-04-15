import client from './client'
import type {
  BarcodeResolveResponse,
  BarcodeResolvedProduct,
  Recipe,
  RecipeCreate,
  RecipeUpdate,
  RecipeSuggestion,
  RecipeFilters,
  RecipeSummary,
  ScrapedRecipe,
} from '../types/recipe'

export async function getRecipes(filters?: RecipeFilters): Promise<Recipe[]> {
  const { data } = await client.get<Recipe[]>('/recipes', { params: filters })
  return data
}

export async function getRecipe(id: number): Promise<Recipe> {
  const { data } = await client.get<Recipe>(`/recipes/${id}`)
  return data
}

export async function createRecipe(payload: RecipeCreate): Promise<Recipe> {
  const { data } = await client.post<Recipe>('/recipes', payload)
  return data
}

export async function updateRecipe(id: number, payload: RecipeUpdate): Promise<Recipe> {
  const { data } = await client.put<Recipe>(`/recipes/${id}`, payload)
  return data
}

export async function deleteRecipe(id: number): Promise<void> {
  await client.delete(`/recipes/${id}`)
}

export async function suggestRecipe(ingredients: string[]): Promise<RecipeSuggestion> {
  const { data } = await client.post<RecipeSuggestion>('/recipes/suggest', { ingredients })
  return data
}

export async function generateRecipeFromTitle(title: string): Promise<RecipeSuggestion> {
  const { data } = await client.post<RecipeSuggestion>('/recipes/generate-from-title', { title })
  return data
}

export async function searchRecipesByIngredients(ingredients: string[]): Promise<RecipeSummary[]> {
  const { data } = await client.post<RecipeSummary[]>('/recipes/search-by-ingredients', { ingredients })
  return data
}

export async function searchImages(query: string, page: number = 1): Promise<string[]> {
  const { data } = await client.get<string[]>('/recipes/images', { params: { query, count: 3, page } })
  return data
}

export async function scrapeRecipe(url: string): Promise<ScrapedRecipe> {
  const { data } = await client.post<ScrapedRecipe>('/recipes/scrape', { url }, { timeout: 190000 })
  return data
}

export async function resolveBarcodeNutrition(file: File): Promise<BarcodeResolveResponse> {
  const formData = new FormData()
  formData.append('image', file)
  const { data } = await client.post<BarcodeResolveResponse>('/nutrition/barcode/resolve', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 30000,
  })
  return data
}

export async function searchOpenFoodFactsByName(query: string): Promise<BarcodeResolvedProduct> {
  const { data } = await client.get<{ product: BarcodeResolvedProduct }>('/nutrition/openfoodfacts/search', {
    params: { query },
    timeout: 15000,
  })
  return data.product
}
