import client from './client'
import type { Profile, ProfileUpdate, TdeePreview } from '../types/profile'

export async function getProfile(): Promise<Profile> {
  const { data } = await client.get<Profile>('/profile')
  return data
}

export async function updateProfile(payload: ProfileUpdate): Promise<Profile> {
  const { data } = await client.put<Profile>('/profile', payload)
  return data
}

export async function calculateTdee(payload: ProfileUpdate): Promise<TdeePreview> {
  const { data } = await client.post<TdeePreview>('/profile/calculate-tdee', payload)
  return data
}
