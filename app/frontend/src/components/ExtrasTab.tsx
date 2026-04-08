import { useEffect, useRef, useState } from 'react'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import SaveIcon from '@mui/icons-material/Save'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Fab from '@mui/material/Fab'
import IconButton from '@mui/material/IconButton'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createExtra, deleteExtra, getExtras, updateExtra } from '../api/extras'
import { resolveBarcodeNutrition, searchOpenFoodFactsByName } from '../api/recipes'
import type { Extra, ExtraLookupSource } from '../types/extra'

interface ExtraFormState {
  name: string
  serving_g: string
  kcal: string
  prot_g: string
  hc_g: string
  fat_g: string
}

interface MacroBase100g {
  kcal: number
  prot_g: number
  hc_g: number
  fat_g: number
}

const EMPTY_FORM: ExtraFormState = { name: '', serving_g: '100', kcal: '', prot_g: '0', hc_g: '0', fat_g: '0' }

function ExtrasTab() {
  const queryClient = useQueryClient()
  const { data: extras = [], isLoading } = useQuery({ queryKey: ['extras'], queryFn: getExtras })
  const [form, setForm] = useState<ExtraFormState>(EMPTY_FORM)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [barcodeError, setBarcodeError] = useState<string | null>(null)
  const [lookupInfo, setLookupInfo] = useState<string | null>(null)
  const [autoSource, setAutoSource] = useState<ExtraLookupSource>('manual')
  const [macroBase100g, setMacroBase100g] = useState<MacroBase100g | null>(null)
  const lastLookupName = useRef('')

  function openAdd() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setBarcodeError(null)
    setLookupInfo(null)
    setAutoSource('manual')
    setMacroBase100g(null)
    lastLookupName.current = ''
    setShowForm(true)
  }

  function openEdit(extra: Extra) {
    setEditingId(extra.id)
    setForm({
      name: extra.name,
      serving_g: String(extra.serving_g),
      kcal: String(extra.kcal),
      prot_g: String(extra.prot_g),
      hc_g: String(extra.hc_g),
      fat_g: String(extra.fat_g),
    })
    setBarcodeError(null)
    setLookupInfo(null)
    setAutoSource(extra.lookup_source)
    setMacroBase100g({
      kcal: (extra.kcal / extra.serving_g) * 100,
      prot_g: (extra.prot_g / extra.serving_g) * 100,
      hc_g: (extra.hc_g / extra.serving_g) * 100,
      fat_g: (extra.fat_g / extra.serving_g) * 100,
    })
    lastLookupName.current = extra.name.trim()
    setShowForm(true)
  }

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['extras'] })
  }

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        name: form.name.trim(),
        serving_g: parseFloat(form.serving_g) || 100,
        kcal: parseFloat(form.kcal),
        prot_g: parseFloat(form.prot_g) || 0,
        hc_g: parseFloat(form.hc_g) || 0,
        fat_g: parseFloat(form.fat_g) || 0,
        lookup_source: autoSource,
      }
      return editingId !== null ? updateExtra(editingId, payload) : createExtra(payload)
    },
    onSuccess: () => {
      invalidate()
      setShowForm(false)
      setForm(EMPTY_FORM)
      setEditingId(null)
      setBarcodeError(null)
      setLookupInfo(null)
      setAutoSource('manual')
      setMacroBase100g(null)
      lastLookupName.current = ''
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteExtra(id),
    onSuccess: () => invalidate(),
  })

  const barcodeMutation = useMutation({
    mutationFn: (file: File) => resolveBarcodeNutrition(file),
    onSuccess: ({ product }) => {
      lastLookupName.current = product.name.trim()
      nameLookupMutation.reset()
      setAutoSource('barcode')
      setMacroBase100g({
        kcal: product.kcal_100g,
        prot_g: product.prot_100g,
        hc_g: product.hc_100g,
        fat_g: product.fat_100g,
      })
      setForm({
        name: product.name,
        serving_g: '100',
        kcal: String(product.kcal_100g),
        prot_g: String(product.prot_100g),
        hc_g: String(product.hc_100g),
        fat_g: String(product.fat_100g),
      })
      setBarcodeError(null)
      setLookupInfo('Producto detectado por codigo de barras.')
    },
    onError: (error) => {
      setBarcodeError((error as Error).message)
    },
  })

  function handleBarcodeFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    barcodeMutation.mutate(file)
  }

  const nameLookupMutation = useMutation({
    mutationFn: (query: string) => searchOpenFoodFactsByName(query),
    onSuccess: (product) => {
      setForm((prev) => {
        if (prev.name.trim() !== lastLookupName.current) return prev
        return {
          ...prev,
          name: product.name,
          serving_g: '100',
          kcal: String(product.kcal_100g),
          prot_g: String(product.prot_100g),
          hc_g: String(product.hc_100g),
          fat_g: String(product.fat_100g),
        }
      })
      lastLookupName.current = product.name.trim()
      setAutoSource('name')
      setMacroBase100g({
        kcal: product.kcal_100g,
        prot_g: product.prot_100g,
        hc_g: product.hc_100g,
        fat_g: product.fat_100g,
      })
      setLookupInfo('Macros autocompletadas desde OpenFoodFacts por nombre.')
      setBarcodeError(null)
    },
    onError: () => {
      setLookupInfo(null)
    },
  })

  useEffect(() => {
    if (!macroBase100g) return
    const grams = Math.max(1, Number(form.serving_g) || 100)
    const ratio = grams / 100
    setForm((prev) => ({
      ...prev,
      kcal: (macroBase100g.kcal * ratio).toFixed(1).replace(/\.0$/, ''),
      prot_g: (macroBase100g.prot_g * ratio).toFixed(1).replace(/\.0$/, ''),
      hc_g: (macroBase100g.hc_g * ratio).toFixed(1).replace(/\.0$/, ''),
      fat_g: (macroBase100g.fat_g * ratio).toFixed(1).replace(/\.0$/, ''),
    }))
  }, [form.serving_g, macroBase100g])

  function handleNameBlur() {
    const trimmedName = form.name.trim()
    if (!showForm) return
    if (trimmedName.length < 3) return
    if (autoSource === 'barcode') return
    if (barcodeMutation.isPending || nameLookupMutation.isPending) return
    if (lastLookupName.current === trimmedName) return
    lastLookupName.current = trimmedName
    nameLookupMutation.mutate(trimmedName)
  }

  const formValid = form.name.trim().length > 0 && !isNaN(parseFloat(form.kcal)) && parseFloat(form.kcal) > 0

  return (
    <Box sx={{ p: 3, pb: 10, display: 'flex', flexDirection: 'column', gap: 2 }}>
      {showForm && (
        <Box
          sx={{
            bgcolor: 'background.paper',
            borderRadius: '24px',
            p: 3,
            boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
            border: '1px solid #eef2ff',
          }}
        >
          <Typography sx={{ fontWeight: 700, mb: 2, fontFamily: '"Inter", sans-serif' }}>
            {editingId ? 'Editar snack' : 'Nuevo snack rapido'}
          </Typography>

          <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <Button
              component="label"
              variant="outlined"
              size="small"
              startIcon={barcodeMutation.isPending ? <CircularProgress size={14} color="inherit" /> : <UploadFileIcon />}
              disabled={barcodeMutation.isPending}
              sx={{ borderRadius: 100 }}
            >
              Subir foto codigo de barras
              <input
                type="file"
                accept="image/*"
                capture="environment"
                hidden
                onChange={handleBarcodeFileChange}
              />
            </Button>
            <Typography sx={{ fontSize: 12, color: '#6a769e' }}>
              Rellena nombre y macros automaticamente. Por defecto se guarda para 100 g.
            </Typography>
          </Box>

          {barcodeError && (
            <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
              {barcodeError}
            </Alert>
          )}
          {lookupInfo && (
            <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
              {lookupInfo}
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <TextField
              label="Nombre"
              value={form.name}
              onChange={(e) => {
                setLookupInfo(null)
                if (autoSource !== 'barcode') {
                  setAutoSource('manual')
                  setMacroBase100g(null)
                }
                setForm((f) => ({ ...f, name: e.target.value }))
              }}
              onBlur={handleNameBlur}
              size="small"
              fullWidth
              autoFocus
              helperText={autoSource === 'barcode'
                ? 'Nombre y macros fijados desde el codigo de barras.'
                : nameLookupMutation.isPending
                  ? 'Buscando macros en OpenFoodFacts...'
                  : 'Sin foto, la busqueda solo se lanzara cuando salgas de este campo.'}
            />

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <TextField
                label="Gramos base"
                type="number"
                value={form.serving_g}
                onChange={(e) => setForm((f) => ({ ...f, serving_g: e.target.value }))}
                size="small"
                inputProps={{ min: 1, step: 1 }}
                sx={{ flex: 1, minWidth: 110 }}
              />
              {([
                ['kcal', 'kcal'],
                ['prot_g', 'Prot (g)'],
                ['hc_g', 'HC (g)'],
                ['fat_g', 'Grasas (g)'],
              ] as const).map(([key, label]) => (
                <TextField
                  key={key}
                  label={label}
                  type="number"
                  value={form[key]}
                  onChange={(e) => {
                    const nextValue = e.target.value
                    setAutoSource('manual')
                    setForm((f) => {
                      const next = { ...f, [key]: nextValue }
                      const grams = Math.max(1, Number(next.serving_g) || 100)
                      setMacroBase100g({
                        kcal: (Number(next.kcal) || 0) * (100 / grams),
                        prot_g: (Number(next.prot_g) || 0) * (100 / grams),
                        hc_g: (Number(next.hc_g) || 0) * (100 / grams),
                        fat_g: (Number(next.fat_g) || 0) * (100 / grams),
                      })
                      return next
                    })
                  }}
                  size="small"
                  inputProps={{ min: 0, step: 0.5 }}
                  sx={{ flex: 1, minWidth: 80 }}
                />
              ))}
            </Box>

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
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
              <Button
                size="small"
                onClick={() => { setShowForm(false); setEditingId(null); setBarcodeError(null) }}
                sx={{ borderRadius: 100 }}
              >
                Cancelar
              </Button>
              <Button
                size="small"
                onClick={() => {
                  setForm(EMPTY_FORM)
                  setBarcodeError(null)
                  setLookupInfo(null)
                  setAutoSource('manual')
                  setMacroBase100g(null)
                  lastLookupName.current = ''
                  barcodeMutation.reset()
                  nameLookupMutation.reset()
                }}
                sx={{ borderRadius: 100 }}
              >
                Limpiar
              </Button>
            </Box>
          </Box>
        </Box>
      )}

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress size={28} />
        </Box>
      )}

      {!isLoading && extras.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <Typography sx={{ fontSize: 48 }}>Snack</Typography>
          <Typography color="text.secondary">No hay snacks. Anade el primero.</Typography>
        </Box>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {extras.map((extra) => (
          <Box
            key={extra.id}
            sx={{
              bgcolor: 'background.paper',
              borderRadius: '16px',
              p: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
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
                fontSize: 12,
                flexShrink: 0,
                fontWeight: 700,
                color: '#4da8ff',
              }}
            >
              SNACK
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontWeight: 700, color: 'text.primary' }}>{extra.name}</Typography>
              <Box sx={{ display: 'flex', gap: 1.5, mt: 0.5, flexWrap: 'wrap' }}>
                <Typography sx={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#5071d5' }}>
                  {Math.round(extra.kcal)} kcal / {Math.round(extra.serving_g)}g
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
              <IconButton
                size="small"
                onClick={() => deleteMutation.mutate(extra.id)}
                disabled={deleteMutation.isPending}
                sx={{ color: '#6a769e', '&:hover': { color: '#ba1a1a' } }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        ))}
      </Box>

      <Fab
        color="primary"
        aria-label="Anadir snack"
        onClick={openAdd}
        sx={{
          position: 'fixed',
          bottom: 88,
          right: 20,
          borderRadius: '16px',
          bgcolor: '#005cb2',
          '&:hover': { bgcolor: '#004090' },
        }}
      >
        <AddIcon />
      </Fab>
    </Box>
  )
}

export default ExtrasTab
