export type SlotType = 'desayuno' | 'media_manana' | 'comida' | 'merienda' | 'cena'

export interface RecipeSummary {
  id: number
  name: string
  kcal: number
  prot_g: number
  hc_g: number
  fat_g: number
  image_url: string | null
}

export interface MenuSlot {
  id: number
  slot_type: SlotType
  recipe: RecipeSummary | null
}

export interface DayExtraRead {
  id: number
  extra_id: number
  name: string
  quantity: number
  kcal: number
  prot_g: number
  hc_g: number
  fat_g: number
}

export interface DayMacrosSummary {
  kcal: number
  prot_g: number
  hc_g: number
  fat_g: number
}

export interface MenuDay {
  id: number
  day_date: string
  slots: MenuSlot[]
  day_extras: DayExtraRead[]
  macros: DayMacrosSummary
}

export interface MenuWeek {
  id: number
  week_start: string
  label: string | null
  days: MenuDay[]
}

export interface MenuWeekSummary {
  id: number
  week_start: string
  label: string | null
  filled_slots: number
  total_slots: number
}

export interface MenuWeekCreate {
  week_start: string
  label?: string | null
}

export interface SlotUpdate {
  recipe_id: number | null
}
