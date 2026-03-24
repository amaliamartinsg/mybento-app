import client from './client'
import type { UnitWeight, UnitWeightCreate } from '../types/unitWeight'

export async function getUnitWeights(): Promise<UnitWeight[]> {
  const { data } = await client.get<UnitWeight[]>('/unit-weights')
  return data
}

export async function lookupUnitWeight(name: string): Promise<UnitWeight | null> {
  try {
    const { data } = await client.get<UnitWeight>('/unit-weights/lookup', { params: { name } })
    return data
  } catch {
    return null
  }
}

export async function createUnitWeight(payload: UnitWeightCreate): Promise<UnitWeight> {
  const { data } = await client.post<UnitWeight>('/unit-weights', payload)
  return data
}

export async function updateUnitWeight(id: number, payload: Partial<UnitWeightCreate>): Promise<UnitWeight> {
  const { data } = await client.put<UnitWeight>(`/unit-weights/${id}`, payload)
  return data
}

export async function deleteUnitWeight(id: number): Promise<void> {
  await client.delete(`/unit-weights/${id}`)
}
