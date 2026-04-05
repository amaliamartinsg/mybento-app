import client from './client'
import type { Extra, ExtraCreate } from '../types/extra'

export async function getExtras(): Promise<Extra[]> {
  const { data } = await client.get<Extra[]>('/extras')
  return data
}

export async function createExtra(payload: ExtraCreate): Promise<Extra> {
  const { data } = await client.post<Extra>('/extras', payload)
  return data
}

export async function updateExtra(id: number, payload: Partial<ExtraCreate>): Promise<Extra> {
  const { data } = await client.put<Extra>(`/extras/${id}`, payload)
  return data
}

export async function deleteExtra(id: number): Promise<void> {
  await client.delete(`/extras/${id}`)
}
