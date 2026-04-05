import client from './client'
import type { Category } from '../types/category'

export async function getCategories(): Promise<Category[]> {
  const { data } = await client.get<Category[]>('/categories')
  return data
}
