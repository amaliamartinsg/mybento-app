import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import SaveIcon from '@mui/icons-material/Save'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Slider from '@mui/material/Slider'
import Snackbar from '@mui/material/Snackbar'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Typography from '@mui/material/Typography'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useDebounce } from 'use-debounce'
import { updateProfile, calculateTdee } from '../../api/profile'
import type { ActivityLevel, Goal, Profile } from '../../types/profile'
import { sectionCard, sectionTitle } from './settingsStyles'

interface ProfileFormValues {
  weight_kg: number
  height_cm: number
  age: number
  gender: string
  activity_level: ActivityLevel
  goal: Goal
  prot_pct: number
  hc_pct: number
  fat_pct: number
}

const ACTIVITY_OPTIONS: { value: ActivityLevel; label: string }[] = [
  { value: 'sedentary', label: 'Sedentario (sin ejercicio)' },
  { value: 'light', label: 'Ligero (1-3 días/sem)' },
  { value: 'moderate', label: 'Moderado (3-5 días/sem)' },
  { value: 'active', label: 'Activo (6-7 días/sem)' },
  { value: 'very_active', label: 'Muy activo (2× día)' },
]

function ProfileSection({ profile }: { profile: Profile }) {
  const queryClient = useQueryClient()
  const [snack, setSnack] = useState<{ msg: string; severity: 'success' | 'error' } | null>(null)
  const [tdeePreview, setTdeePreview] = useState<number | null>(null)

  const { control, handleSubmit, watch } = useForm<ProfileFormValues>({
    defaultValues: {
      weight_kg: profile.weight_kg,
      height_cm: profile.height_cm,
      age: profile.age,
      gender: profile.gender,
      activity_level: profile.activity_level,
      goal: profile.goal,
      prot_pct: profile.prot_pct,
      hc_pct: profile.hc_pct,
      fat_pct: profile.fat_pct,
    },
  })

  const saveMutation = useMutation({
    mutationFn: (payload: ProfileFormValues) => updateProfile(payload),
    onSuccess: (data) => {
      queryClient.setQueryData(['profile'], data)
      setSnack({ msg: 'Perfil guardado correctamente', severity: 'success' })
    },
    onError: (err) => setSnack({ msg: (err as Error).message, severity: 'error' }),
  })

  const tdeeMutation = useMutation({
    mutationFn: (payload: ProfileFormValues) => calculateTdee(payload),
    onSuccess: (data) => setTdeePreview(data.kcal_target),
  })

  const watchedValues = watch()
  const [debouncedValues] = useDebounce(watchedValues, 500)

  useEffect(() => {
    tdeeMutation.mutate(debouncedValues)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(debouncedValues)])

  const protPct = watch('prot_pct')
  const hcPct = watch('hc_pct')
  const fatPct = watch('fat_pct')
  const macroSum = (Number(protPct) || 0) + (Number(hcPct) || 0) + (Number(fatPct) || 0)
  const macroSumError = Math.abs(macroSum - 100) > 0.5

  function onSubmit(values: ProfileFormValues) {
    if (macroSumError) return
    saveMutation.mutate(values)
  }

  return (
    <Box component="section" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography sx={sectionTitle}>Mi Perfil</Typography>
        {tdeePreview !== null && (
          <Box sx={{ px: 2, py: 0.75, bgcolor: 'rgba(0,130,253,0.08)', borderRadius: 100, border: '1px solid rgba(0,130,253,0.15)' }}>
            <Typography sx={{ color: '#4da8ff', fontWeight: 700, fontFamily: '"Inter", sans-serif', fontSize: 14 }}>
              {Math.round(tdeePreview).toLocaleString('es-ES')} kcal/día
            </Typography>
          </Box>
        )}
      </Box>

      <Box sx={sectionCard}>
        <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3 }}>
            {[
              { name: 'weight_kg' as const, label: 'Peso', unit: 'kg', min: 40, max: 150 },
              { name: 'height_cm' as const, label: 'Altura', unit: 'cm', min: 140, max: 220 },
              { name: 'age' as const, label: 'Edad', unit: 'años', min: 15, max: 99 },
            ].map(({ name, label, unit, min, max }) => (
              <Controller
                key={name}
                name={name}
                control={control}
                render={({ field }) => (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                      <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#6a769e' }}>{label}</Typography>
                      <Box>
                        <Typography component="span" sx={{ fontFamily: '"Inter", sans-serif', fontWeight: 700, fontSize: 18, color: '#1a1c1e' }}>
                          {field.value}
                        </Typography>
                        <Typography component="span" sx={{ fontSize: 11, color: '#6a769e', ml: 0.5 }}>{unit}</Typography>
                      </Box>
                    </Box>
                    <Slider
                      value={Number(field.value) || 0}
                      onChange={(_, v) => field.onChange(v)}
                      min={min}
                      max={max}
                      step={1}
                      sx={{ color: '#4da8ff' }}
                    />
                  </Box>
                )}
              />
            ))}
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3 }}>
            <Controller
              name="gender"
              control={control}
              render={({ field }) => (
                <Box>
                  <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#6a769e', mb: 1.5 }}>Género</Typography>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    {[
                      { value: 'male', label: 'Hombre' },
                      { value: 'female', label: 'Mujer' },
                    ].map(({ value, label }) => (
                      <Box
                        key={value}
                        onClick={() => field.onChange(value)}
                        sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer' }}
                      >
                        <Box
                          sx={{
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            border: '2px solid',
                            borderColor: field.value === value ? '#4da8ff' : '#c3c7d0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {field.value === value && (
                            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#4da8ff' }} />
                          )}
                        </Box>
                        <Typography sx={{ fontWeight: 500, color: '#1a1c1e' }}>{label}</Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
            />

            <Controller
              name="activity_level"
              control={control}
              render={({ field }) => (
                <FormControl size="small" fullWidth>
                  <InputLabel sx={{ fontFamily: '"Inter", sans-serif', fontWeight: 700, color: '#6a769e' }}>
                    Actividad
                  </InputLabel>
                  <Select
                    {...field}
                    label="Actividad"
                    sx={{
                      bgcolor: '#eef2ff',
                      borderRadius: '12px',
                      '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { border: '2px solid #4da8ff' },
                    }}
                  >
                    {ACTIVITY_OPTIONS.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            />
          </Box>

          <Controller
            name="goal"
            control={control}
            render={({ field }) => (
              <Box>
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#6a769e', mb: 1.5 }}>Objetivo</Typography>
                <ToggleButtonGroup
                  exclusive
                  value={field.value}
                  onChange={(_, v) => v !== null && field.onChange(v)}
                  fullWidth
                  sx={{ bgcolor: '#eef2ff', borderRadius: '16px', p: 0.5 }}
                >
                  <ToggleButton value="deficit">Perder</ToggleButton>
                  <ToggleButton value="maintain">Mantenimiento</ToggleButton>
                  <ToggleButton value="surplus">Ganar</ToggleButton>
                </ToggleButtonGroup>
              </Box>
            )}
          />

          <Box sx={{ borderTop: '1px solid rgba(191,202,186,0.3)', pt: 3 }}>
            <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#6a769e', textTransform: 'uppercase', letterSpacing: '0.1em', mb: 2 }}>
              Distribución de Macros
            </Typography>
            {macroSumError && (
              <Alert severity="error" sx={{ mb: 1.5, borderRadius: 2 }}>
                Los porcentajes deben sumar 100% (ahora suman {Math.round(macroSum)}%)
              </Alert>
            )}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {[
                { name: 'prot_pct' as const, label: 'Proteínas', color: '#1565C0' },
                { name: 'hc_pct' as const, label: 'Carbohidratos', color: '#F57F17' },
                { name: 'fat_pct' as const, label: 'Grasas', color: '#C62828' },
              ].map(({ name, label, color }) => (
                <Controller
                  key={name}
                  name={name}
                  control={control}
                  render={({ field }) => (
                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                        <Typography sx={{ fontSize: 12, fontWeight: 700, color }}>{label}</Typography>
                        <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#1a1c1e' }}>
                          {Math.round(Number(field.value) || 0)}%
                        </Typography>
                      </Box>
                      <Box sx={{ height: 6, bgcolor: '#dde3f0', borderRadius: 100, overflow: 'hidden' }}>
                        <Box sx={{ height: '100%', width: `${Math.round(Number(field.value) || 0)}%`, bgcolor: color, borderRadius: 100 }} />
                      </Box>
                      <Slider
                        value={Number(field.value) || 0}
                        onChange={(_, v) => field.onChange(v)}
                        min={5}
                        max={70}
                        step={1}
                        sx={{ color, mt: 0.5, py: 0.5 }}
                      />
                    </Box>
                  )}
                />
              ))}
            </Box>
          </Box>

          <Button
            type="submit"
            variant="contained"
            startIcon={
              saveMutation.isPending
                ? <CircularProgress size={16} color="inherit" />
                : <SaveIcon />
            }
            disabled={saveMutation.isPending || macroSumError}
            sx={{
              background: 'linear-gradient(90deg, #4da8ff 0%, #005cb2 100%)',
              borderRadius: '16px',
              py: 1.5,
              fontSize: 15,
              fontWeight: 700,
              boxShadow: '0 4px 16px rgba(0,130,253,0.25)',
            }}
          >
            Guardar perfil
          </Button>
        </Box>
      </Box>

      <Snackbar
        open={Boolean(snack)}
        autoHideDuration={3000}
        onClose={() => setSnack(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {snack ? (
          <Alert severity={snack.severity} onClose={() => setSnack(null)} sx={{ borderRadius: 3 }}>
            {snack.msg}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Box>
  )
}

export default ProfileSection
