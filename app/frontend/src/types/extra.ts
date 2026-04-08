export type ExtraLookupSource = 'manual' | 'barcode' | 'name'

export interface Extra {
  id: number
  name: string
  serving_g: number
  kcal: number
  prot_g: number
  hc_g: number
  fat_g: number
  lookup_source: ExtraLookupSource
}

export interface ExtraCreate {
  name: string
  serving_g?: number
  kcal: number
  prot_g?: number
  hc_g?: number
  fat_g?: number
  lookup_source?: ExtraLookupSource
}

export interface MenuDayExtraCreate {
  extra_id: number
  grams?: number
}
