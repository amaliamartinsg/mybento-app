import { useState } from 'react'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import SaveIcon from '@mui/icons-material/Save'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Fab from '@mui/material/Fab'
import IconButton from '@mui/material/IconButton'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createExtra, deleteExtra, getExtras, updateExtra } from '../api/extras'
import type { Extra } from '../types/extra'

interface ExtraFormState {
  name: string; kcal: string; prot_g: string; hc_g: string; fat_g: string
}

const EMPTY_FORM: ExtraFormState = { name: '', kcal: '', prot_g: '0', hc_g: '0', fat_g: '0' }

function ExtrasTab() {
  const queryClient = useQueryClient()
  const { data: extras = [], isLoading } = useQuery({ queryKey: ['extras'], queryFn: getExtras })
  const [form, setForm] = useState<ExtraFormState>(EMPTY_FORM)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)

  function openAdd() { setEditingId(null); setForm(EMPTY_FORM); setShowForm(true) }
  function openEdit(extra: Extra) {
    setEditingId(extra.id)
    setForm({ name: extra.name, kcal: String(extra.kcal), prot_g: String(extra.prot_g), hc_g: String(extra.hc_g), fat_g: String(extra.fat_g) })
    setShowForm(true)
  }
  function invalidate() { queryClient.invalidateQueries({ queryKey: ['extras'] }) }

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        name: form.name.trim(),
        kcal: parseFloat(form.kcal),
        prot_g: parseFloat(form.prot_g) || 0,
        hc_g: parseFloat(form.hc_g) || 0,
        fat_g: parseFloat(form.fat_g) || 0,
      }
      return editingId !== null ? updateExtra(editingId, payload) : createExtra(payload)
    },
    onSuccess: () => { invalidate(); setShowForm(false); setForm(EMPTY_FORM); setEditingId(null) },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteExtra(id),
    onSuccess: () => invalidate(),
  })

  const formValid = form.name.trim().length > 0 && !isNaN(parseFloat(form.kcal)) && parseFloat(form.kcal) > 0

  return (
    <Box sx={{ p: 3, pb: 10, display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Inline form */}
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
            {editingId ? 'Editar snack' : 'Nuevo snack rápido'}
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <TextField
              label="Nombre"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              size="small"
              fullWidth
              autoFocus
            />
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
              <Button size="small" onClick={() => { setShowForm(false); setEditingId(null) }} sx={{ borderRadius: 100 }}>
                Cancelar
              </Button>
            </Box>
          </Box>
        </Box>
      )}

      {/* List */}
      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress size={28} />
        </Box>
      )}

      {!isLoading && extras.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <Typography sx={{ fontSize: 48 }}>🥗</Typography>
          <Typography color="text.secondary">No hay snacks. ¡Añade el primero!</Typography>
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
                fontSize: 22,
                flexShrink: 0,
              }}
            >
              🥗
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontWeight: 700, color: 'text.primary' }}>{extra.name}</Typography>
              <Box sx={{ display: 'flex', gap: 1.5, mt: 0.5, flexWrap: 'wrap' }}>
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

      {/* FAB */}
      <Fab
        color="primary"
        aria-label="Añadir snack"
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
