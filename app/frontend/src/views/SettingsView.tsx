import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import SaveIcon from '@mui/icons-material/Save'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Collapse from '@mui/material/Collapse'
import FormControl from '@mui/material/FormControl'
import IconButton from '@mui/material/IconButton'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Slider from '@mui/material/Slider'
import Snackbar from '@mui/material/Snackbar'
import TextField from '@mui/material/TextField'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Typography from '@mui/material/Typography'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useDebounce } from 'use-debounce'
import {
  createCategory,
  createSubcategory,
  deleteCategory,
  deleteSubcategory,
  getCategories,
  updateCategory,
  updateSubcategory,
} from '../api/categories'
import { createExtra, deleteExtra, getExtras, updateExtra } from '../api/extras'
import { getProfile, updateProfile, calculateTdee } from '../api/profile'
import type { Category, SubCategory } from '../types/category'
import type { Extra } from '../types/extra'
import type { ActivityLevel, Goal, Profile } from '../types/profile'

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Constants ────────────────────────────────────────────────────────────────

const ACTIVITY_OPTIONS: { value: ActivityLevel; label: string }[] = [
  { value: 'sedentary', label: 'Sedentario (sin ejercicio)' },
  { value: 'light', label: 'Ligero (1-3 días/sem)' },
  { value: 'moderate', label: 'Moderado (3-5 días/sem)' },
  { value: 'active', label: 'Activo (6-7 días/sem)' },
  { value: 'very_active', label: 'Muy activo (2× día)' },
]

// ─── Shared styles ────────────────────────────────────────────────────────────

const sectionCard = {
  bgcolor: 'background.paper',
  borderRadius: '24px',
  p: 3,
  boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
}

const sectionTitle = {
  fontFamily: '"Inter", sans-serif',
  fontWeight: 700,
  fontSize: 24,
  color: 'primary.main',
}

// ─── Profile Section ──────────────────────────────────────────────────────────

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
      {/* Header */}
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
          {/* Sliders físicos */}
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

          {/* Género + Actividad */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3 }}>
            {/* Género */}
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

            {/* Actividad */}
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

          {/* Objetivo */}
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

          {/* Distribución macros */}
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

          {/* Save button */}
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

// ─── Categories Section ───────────────────────────────────────────────────────

function CategoryRow({ category, onDeleted }: { category: Category; onDeleted: () => void }) {
  const queryClient = useQueryClient()
  const [expanded, setExpanded] = useState(false)
  const [editingName, setEditingName] = useState<string | null>(null)
  const [newSubName, setNewSubName] = useState('')
  const [addingSubcat, setAddingSubcat] = useState(false)
  const [editingSubId, setEditingSubId] = useState<number | null>(null)
  const [editingSubName, setEditingSubName] = useState('')

  function invalidate() { queryClient.invalidateQueries({ queryKey: ['categories'] }) }

  const renameCat = useMutation({
    mutationFn: () => updateCategory(category.id, { name: editingName! }),
    onSuccess: () => { invalidate(); setEditingName(null) },
  })

  const deleteCat = useMutation({
    mutationFn: () => deleteCategory(category.id),
    onSuccess: () => { invalidate(); onDeleted() },
  })

  const addSub = useMutation({
    mutationFn: () => createSubcategory(category.id, { name: newSubName.trim() }),
    onSuccess: () => { invalidate(); setNewSubName(''); setAddingSubcat(false) },
  })

  const renameSub = useMutation({
    mutationFn: (sub: SubCategory) => updateSubcategory(sub.id, { name: editingSubName }),
    onSuccess: () => { invalidate(); setEditingSubId(null) },
  })

  const deleteSub = useMutation({
    mutationFn: (id: number) => deleteSubcategory(id),
    onSuccess: () => invalidate(),
  })

  return (
    <Box sx={{ bgcolor: '#f0f4ff', borderRadius: '16px', overflow: 'hidden' }}>
      {/* Header row */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          bgcolor: expanded ? '#eef2ff' : '#f0f4ff',
          transition: 'background-color 0.2s',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '12px',
              bgcolor: 'rgba(0,130,253,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#4da8ff',
              fontSize: 18,
            }}
          >
            🍽️
          </Box>
          {editingName !== null ? (
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flex: 1 }}>
              <TextField
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                size="small"
                fullWidth
                onKeyDown={(e) => e.key === 'Enter' && renameCat.mutate()}
                sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'white', borderRadius: '10px' } }}
              />
              <Button size="small" onClick={() => renameCat.mutate()} disabled={!editingName.trim() || renameCat.isPending} sx={{ borderRadius: 100 }}>OK</Button>
            </Box>
          ) : (
            <Box>
              <Typography sx={{ fontWeight: 700, color: '#1a1c1e' }}>{category.name}</Typography>
              <Typography sx={{ fontSize: 12, color: '#6a769e' }}>
                {category.subcategories.map((s) => s.name).join(', ') || `${category.subcategories.length} subcategorías`}
              </Typography>
            </Box>
          )}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <IconButton size="small" onClick={() => setEditingName(editingName === null ? category.name : null)} sx={{ color: '#6a769e' }}>
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={() => deleteCat.mutate()} disabled={deleteCat.isPending} sx={{ color: '#6a769e', '&:hover': { color: '#ba1a1a' } }}>
            <DeleteIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={() => setExpanded((v) => !v)} sx={{ color: '#6a769e' }}>
            {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
          </IconButton>
        </Box>
      </Box>

      {/* Subcategories */}
      <Collapse in={expanded}>
        <Box sx={{ px: 2, pb: 2, pt: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
          {category.subcategories.map((sub) => (
            <Box
              key={sub.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                py: 1,
                px: 2,
                bgcolor: 'rgba(255,255,255,0.6)',
                borderRadius: '10px',
              }}
            >
              {editingSubId === sub.id ? (
                <Box sx={{ display: 'flex', gap: 1, flex: 1, alignItems: 'center' }}>
                  <TextField
                    value={editingSubName}
                    onChange={(e) => setEditingSubName(e.target.value)}
                    size="small"
                    fullWidth
                    onKeyDown={(e) => e.key === 'Enter' && renameSub.mutate(sub)}
                    sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'white', borderRadius: '10px' } }}
                  />
                  <Button size="small" onClick={() => renameSub.mutate(sub)} disabled={!editingSubName.trim() || renameSub.isPending} sx={{ borderRadius: 100 }}>OK</Button>
                </Box>
              ) : (
                <>
                  <Typography sx={{ fontSize: 14, fontWeight: 500 }}>{sub.name}</Typography>
                  <Box sx={{ display: 'flex', gap: 0.25 }}>
                    <IconButton size="small" onClick={() => { setEditingSubId(sub.id); setEditingSubName(sub.name) }} sx={{ color: '#6a769e' }}>
                      <EditIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                    <IconButton size="small" onClick={() => deleteSub.mutate(sub.id)} disabled={deleteSub.isPending} sx={{ color: '#6a769e', '&:hover': { color: '#ba1a1a' } }}>
                      <DeleteIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Box>
                </>
              )}
            </Box>
          ))}

          {/* Add subcategory */}
          {addingSubcat ? (
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <TextField
                value={newSubName}
                onChange={(e) => setNewSubName(e.target.value)}
                size="small"
                placeholder="Nombre subcategoría"
                autoFocus
                fullWidth
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newSubName.trim()) addSub.mutate()
                  if (e.key === 'Escape') setAddingSubcat(false)
                }}
                sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'white', borderRadius: '10px' } }}
              />
              <Button size="small" variant="contained" onClick={() => addSub.mutate()} disabled={!newSubName.trim() || addSub.isPending} sx={{ borderRadius: 100 }}>
                Añadir
              </Button>
              <Button size="small" onClick={() => setAddingSubcat(false)} sx={{ borderRadius: 100 }}>Cancelar</Button>
            </Box>
          ) : (
            <Button size="small" startIcon={<AddIcon />} onClick={() => setAddingSubcat(true)} sx={{ borderRadius: 100, alignSelf: 'flex-start', color: '#4da8ff' }}>
              Nueva subcategoría
            </Button>
          )}
        </Box>
      </Collapse>
    </Box>
  )
}

function CategoriesSection() {
  const queryClient = useQueryClient()
  const { data: categories, isLoading } = useQuery({ queryKey: ['categories'], queryFn: getCategories })
  const [newCatName, setNewCatName] = useState('')
  const [addingCat, setAddingCat] = useState(false)

  const addCat = useMutation({
    mutationFn: () => createCategory({ name: newCatName.trim() }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['categories'] }); setNewCatName(''); setAddingCat(false) },
  })

  return (
    <Box component="section" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography sx={sectionTitle}>Categorías</Typography>
        <Button
          size="small"
          startIcon={<AddIcon />}
          onClick={() => setAddingCat(true)}
          disabled={addingCat}
          sx={{ bgcolor: 'rgba(0,130,253,0.08)', color: '#4da8ff', borderRadius: 100, px: 2, fontWeight: 700, '&:hover': { bgcolor: 'rgba(0,130,253,0.15)' } }}
        >
          Nueva
        </Button>
      </Box>

      {addingCat && (
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', bgcolor: 'background.paper', p: 2, borderRadius: '16px' }}>
          <TextField
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            size="small"
            placeholder="Nombre categoría"
            autoFocus
            fullWidth
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newCatName.trim()) addCat.mutate()
              if (e.key === 'Escape') setAddingCat(false)
            }}
          />
          <Button size="small" variant="contained" onClick={() => addCat.mutate()} disabled={!newCatName.trim() || addCat.isPending} sx={{ borderRadius: 100 }}>
            Crear
          </Button>
          <Button size="small" onClick={() => setAddingCat(false)} sx={{ borderRadius: 100 }}>Cancelar</Button>
        </Box>
      )}

      {isLoading && <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}><CircularProgress size={28} /></Box>}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {categories?.map((cat) => (
          <CategoryRow
            key={cat.id}
            category={cat}
            onDeleted={() => queryClient.invalidateQueries({ queryKey: ['categories'] })}
          />
        ))}
        {categories?.length === 0 && (
          <Typography sx={{ color: '#6a769e', fontSize: 14 }}>No hay categorías. Crea la primera.</Typography>
        )}
      </Box>
    </Box>
  )
}

// ─── Extras Section ───────────────────────────────────────────────────────────

interface ExtraFormState {
  name: string; kcal: string; prot_g: string; hc_g: string; fat_g: string
}

const EMPTY_EXTRA_FORM: ExtraFormState = { name: '', kcal: '', prot_g: '0', hc_g: '0', fat_g: '0' }

function ExtrasSection() {
  const queryClient = useQueryClient()
  const { data: extras, isLoading } = useQuery({ queryKey: ['extras'], queryFn: getExtras })
  const [form, setForm] = useState<ExtraFormState>(EMPTY_EXTRA_FORM)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)

  function openAdd() { setEditingId(null); setForm(EMPTY_EXTRA_FORM); setShowForm(true) }
  function openEdit(extra: Extra) {
    setEditingId(extra.id)
    setForm({ name: extra.name, kcal: String(extra.kcal), prot_g: String(extra.prot_g), hc_g: String(extra.hc_g), fat_g: String(extra.fat_g) })
    setShowForm(true)
  }
  function invalidate() { queryClient.invalidateQueries({ queryKey: ['extras'] }) }

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = { name: form.name.trim(), kcal: parseFloat(form.kcal), prot_g: parseFloat(form.prot_g) || 0, hc_g: parseFloat(form.hc_g) || 0, fat_g: parseFloat(form.fat_g) || 0 }
      return editingId !== null ? updateExtra(editingId, payload) : createExtra(payload)
    },
    onSuccess: () => { invalidate(); setShowForm(false); setForm(EMPTY_EXTRA_FORM); setEditingId(null) },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteExtra(id),
    onSuccess: () => invalidate(),
  })

  const formValid = form.name.trim().length > 0 && !isNaN(parseFloat(form.kcal)) && parseFloat(form.kcal) > 0

  return (
    <Box component="section" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography sx={sectionTitle}>Extras Rápidos</Typography>
        <Button
          size="small"
          startIcon={<AddIcon />}
          onClick={openAdd}
          sx={{ bgcolor: 'rgba(0,130,253,0.08)', color: '#4da8ff', borderRadius: 100, px: 2, fontWeight: 700, '&:hover': { bgcolor: 'rgba(0,130,253,0.15)' } }}
        >
          Añadir
        </Button>
      </Box>

      {showForm && (
        <Box sx={{ ...sectionCard, border: '1px solid #eef2ff' }}>
          <Typography sx={{ fontWeight: 700, mb: 2, fontFamily: '"Inter", sans-serif' }}>
            {editingId ? 'Editar extra' : 'Nuevo extra'}
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <TextField label="Nombre" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} size="small" fullWidth autoFocus />
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {([['kcal', 'kcal'], ['prot_g', 'Prot (g)'], ['hc_g', 'HC (g)'], ['fat_g', 'Grasas (g)']] as const).map(([key, label]) => (
                <TextField
                  key={key}
                  label={label}
                  type="number"
                  value={form[key]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  size="small"
                  inputProps={{ min: 0, step: 0.5 }}
                  sx={{ flex: 1, minWidth: 80 }}
                />
              ))}
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                size="small"
                onClick={() => saveMutation.mutate()}
                disabled={!formValid || saveMutation.isPending}
                startIcon={saveMutation.isPending ? <CircularProgress size={14} color="inherit" /> : <SaveIcon />}
                sx={{ borderRadius: 100 }}
              >
                Guardar
              </Button>
              <Button size="small" onClick={() => { setShowForm(false); setEditingId(null) }} sx={{ borderRadius: 100 }}>Cancelar</Button>
            </Box>
          </Box>
        </Box>
      )}

      {isLoading && <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}><CircularProgress size={28} /></Box>}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {extras?.map((extra) => (
          <Box
            key={extra.id}
            sx={{
              bgcolor: 'background.paper',
              borderRadius: '16px',
              p: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              '&:hover .extra-actions': { opacity: 1 },
            }}
          >
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                bgcolor: '#eef2ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 22,
                flexShrink: 0,
              }}
            >
              🥗
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontWeight: 700, color: '#1a1c1e' }}>{extra.name}</Typography>
              <Box sx={{ display: 'flex', gap: 1.5, mt: 0.5 }}>
                <Typography sx={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#5071d5' }}>
                  {Math.round(extra.kcal)} kcal
                </Typography>
                <Typography sx={{ fontSize: 10, fontWeight: 700, color: '#1565C0' }}>P: {Math.round(extra.prot_g)}g</Typography>
                <Typography sx={{ fontSize: 10, fontWeight: 700, color: '#F57F17' }}>HC: {Math.round(extra.hc_g)}g</Typography>
                <Typography sx={{ fontSize: 10, fontWeight: 700, color: '#C62828' }}>G: {Math.round(extra.fat_g)}g</Typography>
              </Box>
            </Box>
            <Box className="extra-actions" sx={{ display: 'flex', gap: 0.5, opacity: 0, transition: 'opacity 0.2s' }}>
              <IconButton size="small" onClick={() => openEdit(extra)} sx={{ color: '#6a769e' }}>
                <EditIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={() => deleteMutation.mutate(extra.id)} disabled={deleteMutation.isPending} sx={{ color: '#6a769e', '&:hover': { color: '#ba1a1a' } }}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        ))}
        {extras?.length === 0 && !isLoading && (
          <Typography sx={{ color: '#6a769e', fontSize: 14 }}>No hay extras definidos.</Typography>
        )}
      </Box>
    </Box>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function SettingsView() {
  const { data: profile, isLoading, error } = useQuery({ queryKey: ['profile'], queryFn: getProfile })

  return (
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 4, pb: 10, maxWidth: 680, mx: 'auto' }}>
      {isLoading && <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>}
      {error && <Alert severity="error" sx={{ borderRadius: 3 }}>{(error as Error).message}</Alert>}
      {profile && <ProfileSection profile={profile} />}
      <CategoriesSection />
      <ExtrasSection />
    </Box>
  )
}

export default SettingsView
