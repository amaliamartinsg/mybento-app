import client from './client'
import type { Recipe, RecipeCreate, RecipeUpdate, RecipeSuggestion, RecipeFilters } from '../types/recipe'

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
  const { data } = await client.post<RecipeSuggestion>('/recipes/suggest', ingredients)
  return data
}

export async function searchImages(query: string): Promise<string[]> {
  const { data } = await client.get<string[]>('/recipes/images', { params: { query } })
  return data
}
