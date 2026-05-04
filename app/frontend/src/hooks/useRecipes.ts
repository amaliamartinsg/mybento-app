import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getRecipes,
  getRecipe,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  bookmarkRecipe,
  unbookmarkRecipe,
  getBookmarkedRecipes,
} from '../api/recipes'
import type { RecipeCreate, RecipeUpdate, RecipeFilters } from '../types/recipe'

export function useRecipes(filters?: RecipeFilters) {
  return useQuery({
    queryKey: ['recipes', filters],
    queryFn: () => getRecipes(filters),
  })
}

export function useRecipe(id: number | null) {
  return useQuery({
    queryKey: ['recipe', id],
    queryFn: () => getRecipe(id!),
    enabled: id !== null,
  })
}

export function useCreateRecipe() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: RecipeCreate) => createRecipe(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] })
    },
  })
}

export function useUpdateRecipe() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: RecipeUpdate }) =>
      updateRecipe(id, payload),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] })
      queryClient.invalidateQueries({ queryKey: ['recipe', id] })
    },
  })
}

export function useDeleteRecipe() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteRecipe(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] })
    },
  })
}

export function useBookmarkedRecipes() {
  return useQuery({
    queryKey: ['recipes', 'bookmarked'],
    queryFn: getBookmarkedRecipes,
  })
}

export function useBookmarkRecipe() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => bookmarkRecipe(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] })
      queryClient.invalidateQueries({ queryKey: ['recipes', 'bookmarked'] })
    },
  })
}

export function useUnbookmarkRecipe() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => unbookmarkRecipe(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] })
      queryClient.invalidateQueries({ queryKey: ['recipes', 'bookmarked'] })
    },
  })
}
