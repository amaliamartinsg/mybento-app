import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getWeek,
  createWeek,
  updateSlot,
  clearSlot,
  autofill,
  addExtra,
  removeExtra,
} from '../api/menu'
import type { MenuWeekCreate, SlotUpdate } from '../types/menu'
import type { MenuDayExtraCreate } from '../types/extra'

export function useWeek(weekStart: string | null) {
  return useQuery({
    queryKey: ['menu', weekStart],
    queryFn: () => getWeek(weekStart!),
    enabled: weekStart !== null,
    retry: false,
  })
}

export function useCreateWeek() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: MenuWeekCreate) => createWeek(payload),
    onSuccess: (data) => {
      queryClient.setQueryData(['menu', data.week_start], data)
    },
  })
}

export function useUpdateSlot(weekStart: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ slotId, payload }: { slotId: number; payload: SlotUpdate }) =>
      updateSlot(slotId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu', weekStart] })
    },
  })
}

export function useClearSlot(weekStart: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (slotId: number) => clearSlot(slotId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu', weekStart] })
    },
  })
}

export function useAutofill(weekStart: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => autofill(weekStart),
    onSuccess: (data) => {
      queryClient.setQueryData(['menu', weekStart], data)
    },
  })
}

export function useAddExtra(weekStart: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ dayId, payload }: { dayId: number; payload: MenuDayExtraCreate }) =>
      addExtra(dayId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu', weekStart] })
    },
  })
}

export function useRemoveExtra(weekStart: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dayExtraId: number) => removeExtra(dayExtraId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu', weekStart] })
    },
  })
}
