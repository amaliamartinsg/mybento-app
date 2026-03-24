import client from './client'
import type { MenuWeek, MenuWeekCreate, MenuWeekSummary, SlotUpdate } from '../types/menu'
import type { MenuDayExtraCreate } from '../types/extra'

export async function getWeeks(): Promise<MenuWeekSummary[]> {
  const { data } = await client.get<MenuWeekSummary[]>('/menu/weeks')
  return data
}

export async function getWeek(weekStart: string): Promise<MenuWeek> {
  const { data } = await client.get<MenuWeek>(`/menu/week/${weekStart}`)
  return data
}

export async function createWeek(payload: MenuWeekCreate): Promise<MenuWeek> {
  const { data } = await client.post<MenuWeek>('/menu/week', payload)
  return data
}

export async function updateSlot(slotId: number, payload: SlotUpdate): Promise<void> {
  await client.put(`/menu/slot/${slotId}`, payload)
}

export async function clearSlot(slotId: number): Promise<void> {
  await client.delete(`/menu/slot/${slotId}`)
}

export async function autofill(weekStart: string): Promise<MenuWeek> {
  const { data } = await client.post<MenuWeek>(`/menu/week/${weekStart}/autofill`)
  return data
}

export async function addExtra(dayId: number, payload: MenuDayExtraCreate): Promise<void> {
  await client.post(`/menu/day/${dayId}/extras`, payload)
}

export async function removeExtra(dayExtraId: number): Promise<void> {
  await client.delete(`/menu/day-extra/${dayExtraId}`)
}
