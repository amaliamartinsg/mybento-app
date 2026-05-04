import { useState } from 'react'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import IconButton from '@mui/material/IconButton'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getUnitWeights, createUnitWeight, updateUnitWeight, deleteUnitWeight } from '../../api/unitWeights'
import type { UnitWeight } from '../../types/unitWeight'
import { sectionCard, sectionTitle } from './settingsStyles'

function UnitWeightsSection() {
  const queryClient = useQueryClient()
  const { data: unitWeights, isLoading } = useQuery({ queryKey: ['unit-weights'], queryFn: getUnitWeights })

  const [newIngredientName, setNewIngredientName] = useState('')
  const [newGramsPerUnit, setNewGramsPerUnit] = useState('')
  const [addingNew, setAddingNew] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingGrams, setEditingGrams] = useState('')

  function invalidate() { queryClient.invalidateQueries({ queryKey: ['unit-weights'] }) }

  const addMutation = useMutation({
    mutationFn: () =>
      createUnitWeight({
        ingredient_name: newIngredientName.trim(),
        grams_per_unit: parseFloat(newGramsPerUnit),
      }),
    onSuccess: () => {
      invalidate()
      setNewIngredientName('')
      setNewGramsPerUnit('')
      setAddingNew(false)
    },
  })

  const updateMutation = useMutation({
    mutationFn: (uw: UnitWeight) =>
      updateUnitWeight(uw.id, { grams_per_unit: parseFloat(editingGrams) }),
    onSuccess: () => { invalidate(); setEditingId(null) },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteUnitWeight(id),
    onSuccess: () => invalidate(),
  })

  const canAdd =
    newIngredientName.trim().length > 0 &&
    newGramsPerUnit.trim().length > 0 &&
    parseFloat(newGramsPerUnit) > 0

  return (
    <Box component="section" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography sx={sectionTitle}>Pesos por Unidad</Typography>
        <Button
          size="small"
          startIcon={<AddIcon />}
          onClick={() => setAddingNew(true)}
          disabled={addingNew}
          sx={{ bgcolor: 'rgba(0,130,253,0.08)', color: '#4da8ff', borderRadius: 100, px: 2, fontWeight: 700, '&:hover': { bgcolor: 'rgba(0,130,253,0.15)' } }}
        >
          Nueva
        </Button>
      </Box>

      {addingNew && (
        <Box
          sx={{
            display: 'flex',
            gap: 1,
            alignItems: 'center',
            flexWrap: 'wrap',
            bgcolor: 'background.paper',
            p: 2,
            borderRadius: '16px',
          }}
        >
          <TextField
            value={newIngredientName}
            onChange={(e) => setNewIngredientName(e.target.value)}
            size="small"
            placeholder="Ingrediente (ej: Huevo)"
            autoFocus
            sx={{ flex: 2, minWidth: 140, '& .MuiOutlinedInput-root': { bgcolor: 'white', borderRadius: '10px' } }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && canAdd) addMutation.mutate()
              if (e.key === 'Escape') setAddingNew(false)
            }}
          />
          <TextField
            value={newGramsPerUnit}
            onChange={(e) => setNewGramsPerUnit(e.target.value)}
            size="small"
            type="number"
            placeholder="g/ud."
            inputProps={{ min: 0.1, step: 0.5 }}
            sx={{ flex: 1, minWidth: 80, '& .MuiOutlinedInput-root': { bgcolor: 'white', borderRadius: '10px' } }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && canAdd) addMutation.mutate()
              if (e.key === 'Escape') setAddingNew(false)
            }}
          />
          <Button
            size="small"
            variant="contained"
            onClick={() => addMutation.mutate()}
            disabled={!canAdd || addMutation.isPending}
            sx={{ borderRadius: 100 }}
          >
            Crear
          </Button>
          <Button size="small" onClick={() => setAddingNew(false)} sx={{ borderRadius: 100 }}>
            Cancelar
          </Button>
        </Box>
      )}

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
          <CircularProgress size={28} />
        </Box>
      )}

      <Box sx={sectionCard}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {unitWeights?.length === 0 && (
            <Typography sx={{ color: '#6a769e', fontSize: 14 }}>
              No hay pesos definidos. Crea el primero.
            </Typography>
          )}
          {unitWeights?.map((uw) => (
            <Box
              key={uw.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                py: 1,
                px: 2,
                bgcolor: '#f0f4ff',
                borderRadius: '12px',
                gap: 1,
              }}
            >
              <Typography sx={{ fontWeight: 600, color: '#1a1c1e', flex: 2, fontSize: 14 }}>
                {uw.ingredient_name}
              </Typography>
              {editingId === uw.id ? (
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flex: 1 }}>
                  <TextField
                    value={editingGrams}
                    onChange={(e) => setEditingGrams(e.target.value)}
                    size="small"
                    type="number"
                    inputProps={{ min: 0.1, step: 0.5 }}
                    autoFocus
                    sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'white', borderRadius: '10px' } }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && parseFloat(editingGrams) > 0) updateMutation.mutate(uw)
                      if (e.key === 'Escape') setEditingId(null)
                    }}
                  />
                  <Button
                    size="small"
                    onClick={() => updateMutation.mutate(uw)}
                    disabled={!editingGrams || parseFloat(editingGrams) <= 0 || updateMutation.isPending}
                    sx={{ borderRadius: 100 }}
                  >
                    OK
                  </Button>
                </Box>
              ) : (
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#4da8ff', minWidth: 56, textAlign: 'right' }}>
                  {uw.grams_per_unit} g/ud.
                </Typography>
              )}
              <Box sx={{ display: 'flex', gap: 0.25 }}>
                <IconButton
                  size="small"
                  onClick={() => { setEditingId(uw.id); setEditingGrams(String(uw.grams_per_unit)) }}
                  sx={{ color: '#6a769e' }}
                >
                  <EditIcon sx={{ fontSize: 16 }} />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => deleteMutation.mutate(uw.id)}
                  disabled={deleteMutation.isPending}
                  sx={{ color: '#6a769e', '&:hover': { color: '#ba1a1a' } }}
                >
                  <DeleteIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  )
}

export default UnitWeightsSection
