export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'
export type Goal = 'deficit' | 'maintain' | 'surplus'

export interface Profile {
  id: number
  weight_kg: number
  height_cm: number
  age: number
  gender: string
  activity_level: ActivityLevel
  goal: Goal
  kcal_target: number
  prot_pct: number
  hc_pct: number
  fat_pct: number
  prot_g_target: number
  hc_g_target: number
  fat_g_target: number
}

export interface ProfileUpdate {
  weight_kg?: number
  height_cm?: number
  age?: number
  gender?: string
  activity_level?: ActivityLevel
  goal?: Goal
  prot_pct?: number
  hc_pct?: number
  fat_pct?: number
}

export interface TdeePreview {
  bmr: number
  tdee: number
  kcal_target: number
  prot_g_target: number
  hc_g_target: number
  fat_g_target: number
}
