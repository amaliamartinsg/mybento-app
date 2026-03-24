import { useState } from 'react'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useDebounce } from 'use-debounce'
import { useRecipes } from '../hooks/useRecipes'
import { useUpdateSlot } from '../hooks/useMenu'
import type { SlotType } from '../types/menu'

const SLOT_LABELS: Record<SlotType, string> = {
  desayuno: 'Desayuno',
  media_manana: 'Media Mañana',
  comida: 'Comida',
  merienda: 'Merienda',
  cena: 'Cena',
}

interface Props {
  open: boolean
  onClose: () => void
  slotId: number
  slotType: SlotType
  weekStart: string
}

function RecipeSelectorDialog({ open, onClose, slotId, slotType, weekStart }: Props) {
  const [search, setSearch] = useState('')
  const [debouncedSearch] = useDebounce(search, 300)

  const { data: recipes, isLoading } = useRecipes(
    debouncedSearch ? { search: debouncedSearch } : undefined,
  )
  const updateSlot = useUpdateSlot(weekStart)

  function handleSelect(recipeId: number) {
    updateSlot.mutate(
      { slotId, payload: { recipe_id: recipeId } },
      { onSuccess: onClose },
    )
  }

  function handleClose() {
    setSearch('')
    onClose()
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Seleccionar receta
        <Typography variant="body2" color="text.secondary">
          {SLOT_LABELS[slotType]}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ pt: 0, pb: 1 }}>
        <TextField
          fullWidth
          placeholder="Buscar receta..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          sx={{ mb: 1 }}
          autoFocus
        />

        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress size={28} />
          </Box>
        )}

        {!isLoading && recipes?.length === 0 && (
          <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
            No se encontraron recetas
          </Typography>
        )}

        <List dense disablePadding>
          {recipes?.map((recipe) => (
            <ListItem key={recipe.id} disablePadding divider>
              <ListItemButton
                onClick={() => handleSelect(recipe.id)}
                disabled={updateSlot.isPending}
              >
                <ListItemText
                  primary={recipe.name}
                  secondary={
                    <Box
                      component="span"
                      sx={{ display: 'flex', gap: 0.5, mt: 0.25, flexWrap: 'wrap' }}
                    >
                      <Chip
                        label={`${Math.round(recipe.kcal)} kcal`}
                        size="small"
                        sx={{ height: 18, fontSize: 11 }}
                      />
                      <Chip
                        label={`P: ${Math.round(recipe.prot_g)}g`}
                        size="small"
                        color="primary"
                        sx={{ height: 18, fontSize: 11 }}
                      />
                      <Chip
                        label={`HC: ${Math.round(recipe.hc_g)}g`}
                        size="small"
                        color="success"
                        sx={{ height: 18, fontSize: 11 }}
                      />
                      <Chip
                        label={`G: ${Math.round(recipe.fat_g)}g`}
                        size="small"
                        color="warning"
                        sx={{ height: 18, fontSize: 11 }}
                      />
                    </Box>
                  }
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>

        {updateSlot.isPending && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
            <CircularProgress size={20} />
          </Box>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default RecipeSelectorDialog
