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
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useDebounce } from 'use-debounce'
import { useRecipes } from '../hooks/useRecipes'
import { useUpdateSlot } from '../hooks/useMenu'
import type { MenuSlot, SlotType, MealType } from '../types/menu'

const SLOT_LABELS: Record<SlotType, string> = {
  desayuno: 'Desayuno',
  media_manana: 'Media Mañana',
  comida: 'Comida',
  merienda: 'Merienda',
  cena: 'Cena',
}

// Labels mostrados al usuario final para cada tipo de plato
const MEAL_TYPE_TABS: { value: MealType; label: string }[] = [
  { value: 'plato_unico', label: 'Plato único' },
  { value: 'primero', label: 'Primer plato' },
  { value: 'segundo', label: 'Segundo plato' },
]

interface Props {
  open: boolean
  onClose: () => void
  slotId: number
  slotType: SlotType
  weekStart: string
  currentSlot?: MenuSlot | null
}

function RecipeSelectorDialog({ open, onClose, slotId, slotType, weekStart, currentSlot }: Props) {
  const [search, setSearch] = useState('')
  const [debouncedSearch] = useDebounce(search, 300)
  const [mealTypeTab, setMealTypeTab] = useState<MealType>('plato_unico')

  const isComida = slotType === 'comida'

  const { data: recipes, isLoading } = useRecipes(
    debouncedSearch ? { search: debouncedSearch } : undefined,
  )
  const updateSlot = useUpdateSlot(weekStart)

  // Filter by meal_type when in comida mode
  const displayedRecipes = isComida
    ? recipes?.filter((r) => r.meal_type === mealTypeTab)
    : recipes

  function handleSelect(recipeId: number) {
    let payload: { recipe_id: number | null; second_recipe_id: number | null }

    if (!isComida) {
      payload = { recipe_id: recipeId, second_recipe_id: null }
    } else if (mealTypeTab === 'segundo') {
      // Preserve the existing primero; only update segundo
      payload = {
        recipe_id: currentSlot?.recipe?.id ?? null,
        second_recipe_id: recipeId,
      }
    } else {
      // plato_unico or primero: fills recipe_id and clears segundo
      payload = { recipe_id: recipeId, second_recipe_id: null }
    }

    updateSlot.mutate(
      { slotId, payload },
      { onSuccess: onClose },
    )
  }

  function handleClose() {
    setSearch('')
    onClose()
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: isComida ? 0 : undefined }}>
        Seleccionar receta
        <Typography variant="body2" color="text.secondary">
          {SLOT_LABELS[slotType]}
        </Typography>
      </DialogTitle>

      {/* Tabs — only for comida */}
      {isComida && (
        <Tabs
          value={mealTypeTab}
          onChange={(_e, v) => setMealTypeTab(v as MealType)}
          variant="fullWidth"
          sx={{
            px: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
            '& .MuiTab-root': { fontSize: 13, fontFamily: '"Inter", sans-serif', fontWeight: 600, textTransform: 'none', minHeight: 44 },
          }}
        >
          {MEAL_TYPE_TABS.map(({ value, label }) => (
            <Tab key={value} value={value} label={label} />
          ))}
        </Tabs>
      )}

      <DialogContent sx={{ pt: 1.5, pb: 1 }}>
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

        {!isLoading && displayedRecipes?.length === 0 && (
          <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
            No se encontraron recetas
          </Typography>
        )}

        <List dense disablePadding>
          {displayedRecipes?.map((recipe) => (
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
