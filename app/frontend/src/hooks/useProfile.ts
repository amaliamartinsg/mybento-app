import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getProfile, updateProfile, calculateTdee } from '../api/profile'
import type { ProfileUpdate } from '../types/profile'

export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
    staleTime: 60_000,
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: ProfileUpdate) => updateProfile(payload),
    onSuccess: (data) => {
      queryClient.setQueryData(['profile'], data)
    },
  })
}

export function useCalculateTdee() {
  return useMutation({
    mutationFn: (payload: ProfileUpdate) => calculateTdee(payload),
  })
}
