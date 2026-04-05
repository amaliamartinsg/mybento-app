import client from './client'
import type { Category, SubCategory } from '../types/category'

export async function getCategories(): Promise<Category[]> {
  const { data } = await client.get<Category[]>('/categories')
  return data
}

export async function createCategory(payload: {
  name: string
  color?: string | null
}): Promise<Category> {
  const { data } = await client.post<Category>('/categories', payload)
  return data
}

export async function updateCategory(
  id: number,
  payload: { name?: string; color?: string | null },
): Promise<Category> {
  const { data } = await client.put<Category>(`/categories/${id}`, payload)
  return data
}

export async function deleteCategory(id: number): Promise<void> {
  await client.delete(`/categories/${id}`)
}

export async function createSubcategory(
  categoryId: number,
  payload: { name: string },
): Promise<SubCategory> {
  const { data } = await client.post<SubCategory>(
    `/categories/${categoryId}/subcategories`,
    payload,
  )
  return data
}

export async function updateSubcategory(
  id: number,
  payload: { name?: string },
): Promise<SubCategory> {
  const { data } = await client.put<SubCategory>(`/subcategories/${id}`, payload)
  return data
}

export async function deleteSubcategory(id: number): Promise<void> {
  await client.delete(`/subcategories/${id}`)
}
