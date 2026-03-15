export interface SubCategory {
  id: number
  name: string
  category_id: number
}

export interface Category {
  id: number
  name: string
  color: string | null
  subcategories: SubCategory[]
}
