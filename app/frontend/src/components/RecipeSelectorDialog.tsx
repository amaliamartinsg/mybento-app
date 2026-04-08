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
import { useQuery } from '@tanstack/react-query'
import { useDebounce } from 'use-debounce'
import { getCategories } from '../api/categories'
import { getExtras } from '../api/extras'
import { useRecipes } from '../hooks/useRecipes'
import { useUpdateSlot, useAddExtra } from '../hooks/useMenu'
import type { MenuSlot, SlotType, MealType } from '../types/menu'

// ─── Slot → category name mapping ────────────────────────────────────────────

const SLOT_CATEGORY_NAME: Record<SlotType, string> = {
  desayuno: 'desayuno',
  media_manana: 'snack',
  comida: 'comida',
  merienda: 'snack',
  cena: 'cena',
}

const SLOT_LABELS: Record<SlotType, string> = {
  desayuno: 'Desayuno',
  media_manana: 'Media Mañana',
  comida: 'Comida',
  merienda: 'Merienda',
  cena: 'Cena',
}

const MEAL_TYPE_TABS: { value: MealType; label: string }[] = [
  { value: 'plato_unico', label: 'Plato único' },
  { value: 'primero', label: 'Primer plato' },
  { value: 'segundo', label: 'Segundo plato' },
]

// ─── Tab styles ───────────────────────────────────────────────────────────────

const TAB_SX = {
  '& .MuiTab-root': {
    fontSize: 13,
    fontFamily: '"Inter", sans-serif',
    fontWeight: 600,
    textTransform: 'none' as const,
    minHeight: 44,
  },
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  open: boolean
  onClose: () => void
  slotId: number
  slotType: SlotType
  weekStart: string
  dayId: number
  currentSlot?: MenuSlot | null
}

// ─── Component ────────────────────────────────────────────────────────────────

function RecipeSelectorDialog({ open, onClose, slotId, slotType, weekStart, dayId, currentSlot }: Props) {
  const [search, setSearch] = useState('')
  const [debouncedSearch] = useDebounce(search, 300)
  const [mealTypeTab, setMealTypeTab] = useState<MealType>('plato_unico')
  const [snackTab, setSnackTab] = useState<'recetas' | 'snacks_rapidos'>('recetas')
  const [snackGrams, setSnackGrams] = useState<Record<number, number>>({})

  const isComida = slotType === 'comida'
  const isSnack = slotType === 'desayuno' || slotType === 'media_manana' || slotType === 'merienda'
  const hasTabs = isComida || isSnack

  // Load categories to resolve slot → category_id
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  })

  // Load quick-add extras (only needed for snack tabs)
  const { data: extras } = useQuery({
    queryKey: ['extras'],
    queryFn: getExtras,
    enabled: isSnack,
  })

  const targetCategoryName = SLOT_CATEGORY_NAME[slotType]
  const categoryId = categories?.find(
    (c) => c.name.toLowerCase() === targetCategoryName,
  )?.id

  // Build recipe filter: always by category + optional search
  const recipeFilter = {
    ...(categoryId !== undefined ? { category_id: categoryId } : {}),
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  }

  const { data: recipes, isLoading } = useRecipes(
    Object.keys(recipeFilter).length > 0 ? recipeFilter : undefined,
  )

  const updateSlot = useUpdateSlot(weekStart)
  const addExtra = useAddExtra(weekStart)

  // Filter comida recipes further by meal_type tab
  const displayedRecipes = isComida
    ? recipes?.filter((r) => r.meal_type === mealTypeTab)
    : recipes

  function handleSelectRecipe(recipeId: number) {
    let payload: { recipe_id: number | null; second_recipe_id: number | null }

    if (isComida && mealTypeTab === 'segundo') {
      payload = {
        recipe_id: currentSlot?.recipe?.id ?? null,
        second_recipe_id: recipeId,
      }
    } else if (isComida) {
      payload = { recipe_id: recipeId, second_recipe_id: null }
    } else {
      payload = { recipe_id: recipeId, second_recipe_id: null }
    }

    updateSlot.mutate({ slotId, payload }, { onSuccess: handleClose })
  }

  function handleSelectExtra(extraId: number) {
    const extra = extras?.find((item) => item.id === extraId)
    const grams = snackGrams[extraId] ?? extra?.serving_g ?? 100
    addExtra.mutate(
      { dayId, payload: { extra_id: extraId, grams } },
      { onSuccess: handleClose },
    )
  }

  function handleClose() {
    setSearch('')
    onClose()
  }

  const isPending = updateSlot.isPending || addExtra.isPending

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: hasTabs ? 0 : undefined }}>
        Seleccionar receta
        <Typography variant="body2" color="text.secondary">
          {SLOT_LABELS[slotType]}
        </Typography>
      </DialogTitle>

      {/* ── Comida: 3 tabs por tipo de plato ── */}
      {isComida && (
        <Tabs
          value={mealTypeTab}
          onChange={(_e, v) => setMealTypeTab(v as MealType)}
          variant="fullWidth"
          sx={{ px: 2, borderBottom: '1px solid', borderColor: 'divider', ...TAB_SX }}
        >
          {MEAL_TYPE_TABS.map(({ value, label }) => (
            <Tab key={value} value={value} label={label} />
          ))}
        </Tabs>
      )}

      {/* ── Snack (media mañana / merienda): recetas + snacks rápidos ── */}
      {isSnack && (
        <Tabs
          value={snackTab}
          onChange={(_e, v) => setSnackTab(v as 'recetas' | 'snacks_rapidos')}
          variant="fullWidth"
          sx={{ px: 2, borderBottom: '1px solid', borderColor: 'divider', ...TAB_SX }}
        >
          <Tab value="recetas" label="Recetas" />
          <Tab value="snacks_rapidos" label="Snacks rápidos" />
        </Tabs>
      )}

      <DialogContent sx={{ pt: 1.5, pb: 1 }}>

        {/* ── Buscador (no se muestra en pestaña de snacks rápidos) ── */}
        {(!isSnack || snackTab === 'recetas') && (
          <TextField
            fullWidth
            placeholder="Buscar receta..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small"
            sx={{ mb: 1 }}
            autoFocus
          />
        )}

        {/* ── Lista de recetas ── */}
        {(!isSnack || snackTab === 'recetas') && (
          <>
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
                    onClick={() => handleSelectRecipe(recipe.id)}
                    disabled={isPending}
                  >
                    <ListItemText
                      primary={recipe.name}
                      secondary={
                        <Box component="span" sx={{ display: 'flex', gap: 0.5, mt: 0.25, flexWrap: 'wrap' }}>
                          <Chip label={`${Math.round(recipe.kcal)} kcal/r`} size="small" sx={{ height: 18, fontSize: 11 }} />
                          <Chip label={`P: ${Math.round(recipe.prot_g)}g/r`} size="small" color="primary" sx={{ height: 18, fontSize: 11 }} />
                          <Chip label={`HC: ${Math.round(recipe.hc_g)}g/r`} size="small" color="success" sx={{ height: 18, fontSize: 11 }} />
                          <Chip label={`G: ${Math.round(recipe.fat_g)}g/r`} size="small" color="warning" sx={{ height: 18, fontSize: 11 }} />
                        </Box>
                      }
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </>
        )}

        {/* ── Snacks rápidos ── */}
        {isSnack && snackTab === 'snacks_rapidos' && (
          <>
            {!extras && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <CircularProgress size={28} />
              </Box>
            )}

            {extras?.length === 0 && (
              <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                No hay snacks rápidos definidos
              </Typography>
            )}

            <List dense disablePadding>
              {extras?.map((extra) => (
                <ListItem key={extra.id} disablePadding divider>
                  <ListItemButton disabled={isPending}>
                    {(() => {
                      const grams = snackGrams[extra.id] ?? extra.serving_g
                      const ratio = grams / extra.serving_g
                      const kcal = extra.kcal * ratio
                      const prot = extra.prot_g * ratio
                      const hc = extra.hc_g * ratio
                      const fat = extra.fat_g * ratio
                      return (
                        <>
                          <ListItemText
                            primary={extra.name}
                            secondary={
                              <Box component="span" sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, mt: 0.25 }}>
                                <Box component="span" sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                  <Chip label={`${Math.round(kcal)} kcal / ${Math.round(grams)}g`} size="small" sx={{ height: 18, fontSize: 11 }} />
                                  {prot > 0 && <Chip label={`P: ${Math.round(prot)}g`} size="small" color="primary" sx={{ height: 18, fontSize: 11 }} />}
                                  {hc > 0 && <Chip label={`HC: ${Math.round(hc)}g`} size="small" color="success" sx={{ height: 18, fontSize: 11 }} />}
                                  {fat > 0 && <Chip label={`G: ${Math.round(fat)}g`} size="small" color="warning" sx={{ height: 18, fontSize: 11 }} />}
                                </Box>
                                <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                  <TextField
                                    size="small"
                                    type="number"
                                    label="Gramos"
                                    value={grams}
                                    onChange={(e) => setSnackGrams((prev) => ({ ...prev, [extra.id]: Math.max(1, Number(e.target.value) || extra.serving_g) }))}
                                    inputProps={{ min: 1, step: 5 }}
                                    sx={{ width: 110 }}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                  <Typography component="span" sx={{ fontSize: 12, color: 'text.secondary' }}>
                                    Se ajustara automaticamente al consumo.
                                  </Typography>
                                </Box>
                              </Box>
                            }
                          />
                          <Chip
                            label="Anadir"
                            color="primary"
                            onClick={() => handleSelectExtra(extra.id)}
                            disabled={isPending}
                            sx={{ fontWeight: 700, mr: 2 }}
                          />
                        </>
                      )
                    })()}
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </>
        )}

        {isPending && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
            <CircularProgress size={20} />
          </Box>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default RecipeSelectorDialog
