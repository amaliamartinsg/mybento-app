export interface Extra {
  id: number
  name: string
  kcal: number
  prot_g: number
  hc_g: number
  fat_g: number
}

export interface ExtraCreate {
  name: string
  kcal: number
  prot_g?: number
  hc_g?: number
  fat_g?: number
}

export interface MenuDayExtraCreate {
  extra_id: number
  quantity?: number
}
