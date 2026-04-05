export interface UnitWeight {
  id: number
  ingredient_name: string
  grams_per_unit: number
}

export interface UnitWeightCreate {
  ingredient_name: string
  grams_per_unit: number
}
