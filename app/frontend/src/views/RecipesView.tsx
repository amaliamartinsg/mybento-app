import { useState, useCallback } from 'react'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Chip from '@mui/material/Chip'
import Fab from '@mui/material/Fab'
import Skeleton from '@mui/material/Skeleton'
import Card from '@mui/material/Card'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import CircularProgress from '@mui/material/CircularProgress'
import SpeedDial from '@mui/material/SpeedDial'
import SpeedDialAction from '@mui/material/SpeedDialAction'
import SpeedDialIcon from '@mui/material/SpeedDialIcon'
import AddIcon from '@mui/icons-material/Add'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import RestaurantIcon from '@mui/icons-material/Restaurant'
import CloseIcon from '@mui/icons-material/Close'
import { useDebounce } from 'use-debounce'
import { useQuery } from '@tanstack/react-query'
import RecipeCard from '../components/RecipeCard'
import RecipeForm from './RecipeForm'
import { useRecipes, useDeleteRecipe } from '../hooks/useRecipes'
import { getCategories } from '../api/categories'
import { suggestRecipe } from '../api/recipes'
import type { Recipe, RecipeSuggestion } from '../types/recipe'
import type { Category } from '../types/category'

function SkeletonGrid() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <Grid item xs={12} sm={6} md={4} lg={3} key={i}>
          <Card>
            <Skeleton variant="rectangular" height={140} />
            <Box sx={{ p: 2 }}>
              <Skeleton variant="text" width="70%" />
              <Skeleton variant="text" width="40%" />
              <Box sx={{ display: 'flex', gap: 0.5, mt: 1 }}>
                <Skeleton variant="rounded" width={60} height={24} />
                <Skeleton variant="rounded" width={50} height={24} />
                <Skeleton variant="rounded" width={50} height={24} />
              </Box>
            </Box>
          </Card>
        </Grid>
      ))}
    </>
  )
}

function RecipesView() {
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch] = useDebounce(searchInput, 300)
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<number | null>(null)

  const [formOpen, setFormOpen] = useState(false)
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null)

  // Despensa Virtual state
  const [pantryOpen, setPantryOpen] = useState(false)
  const [pantryInput, setPantryInput] = useState('')
  const [pantryIngredients, setPantryIngredients] = useState<string[]>([])
  const [pantryLoading, setPantryLoading] = useState(false)
  const [pantryError, setPantryError] = useState<string | null>(null)
  const [prefillSuggestion, setPrefillSuggestion] = useState<RecipeSuggestion | null>(null)

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<Recipe | null>(null)

  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  })

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: getCategories,
  })

  const filters = {
    ...(selectedSubcategoryId ? { subcategory_id: selectedSubcategoryId } : selectedCategoryId ? { category_id: selectedCategoryId } : {}),
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  }
  const { data: recipes = [], isLoading } = useRecipes(Object.keys(filters).length ? filters : undefined)

  const deleteRecipe = useDeleteRecipe()

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId) ?? null

  const handleCategoryClick = (catId: number) => {
    if (selectedCategoryId === catId) {
      setSelectedCategoryId(null)
      setSelectedSubcategoryId(null)
    } else {
      setSelectedCategoryId(catId)
      setSelectedSubcategoryId(null)
    }
  }

  const handleSubcategoryClick = (subId: number) => {
    setSelectedSubcategoryId(selectedSubcategoryId === subId ? null : subId)
  }

  const handleEdit = (recipe: Recipe) => {
    setEditingRecipe(recipe)
    setFormOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    try {
      await deleteRecipe.mutateAsync(deleteTarget.id)
      setSnackbar({ open: true, message: 'Receta eliminada', severity: 'success' })
    } catch (e) {
      setSnackbar({ open: true, message: (e as Error).message, severity: 'error' })
    } finally {
      setDeleteTarget(null)
    }
  }

  const handleFormClose = useCallback(
    (saved?: boolean) => {
      setFormOpen(false)
      setEditingRecipe(null)
      setPrefillSuggestion(null)
      if (saved) setSnackbar({ open: true, message: 'Receta guardada correctamente', severity: 'success' })
    },
    [],
  )

  // Despensa Virtual
  const handlePantryKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === ',') && pantryInput.trim()) {
      e.preventDefault()
      const value = pantryInput.trim().replace(/,$/, '')
      if (value && !pantryIngredients.includes(value)) {
        setPantryIngredients((prev) => [...prev, value])
      }
      setPantryInput('')
    }
  }

  const handlePantrySuggest = async () => {
    if (pantryIngredients.length === 0) return
    setPantryLoading(true)
    setPantryError(null)
    try {
      const suggestion = await suggestRecipe(pantryIngredients)
      setPrefillSuggestion(suggestion)
      setPantryOpen(false)
      setPantryIngredients([])
      setPantryInput('')
      setEditingRecipe(null)
      setFormOpen(true)
    } catch (e) {
      setPantryError((e as Error).message)
    } finally {
      setPantryLoading(false)
    }
  }

  // Build subcategory name map for RecipeCard labels
  const subcategoryMap: Record<number, string> = {}
  categories.forEach((cat) => {
    cat.subcategories.forEach((sub) => {
      subcategoryMap[sub.id] = sub.name
    })
  })

  return (
    <Box sx={{ p: 2, pb: 10 }}>
      {/* Search */}
      <TextField
        fullWidth
        size="small"
        placeholder="Buscar recetas..."
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        sx={{ mb: 2 }}
      />

      {/* Category chips */}
      <Box sx={{ overflowX: 'auto', display: 'flex', gap: 1, pb: 1, mb: 1 }}>
        {categories.map((cat) => (
          <Chip
            key={cat.id}
            label={cat.name}
            onClick={() => handleCategoryClick(cat.id)}
            color={selectedCategoryId === cat.id ? 'primary' : 'default'}
            variant={selectedCategoryId === cat.id ? 'filled' : 'outlined'}
            sx={{ flexShrink: 0 }}
          />
        ))}
      </Box>

      {/* Subcategory chips */}
      {selectedCategory && selectedCategory.subcategories.length > 0 && (
        <Box sx={{ overflowX: 'auto', display: 'flex', gap: 1, pb: 1, mb: 2 }}>
          {selectedCategory.subcategories.map((sub) => (
            <Chip
              key={sub.id}
              label={sub.name}
              size="small"
              onClick={() => handleSubcategoryClick(sub.id)}
              color={selectedSubcategoryId === sub.id ? 'secondary' : 'default'}
              variant={selectedSubcategoryId === sub.id ? 'filled' : 'outlined'}
              sx={{ flexShrink: 0 }}
            />
          ))}
        </Box>
      )}

      {/* Recipe grid */}
      <Grid container spacing={2}>
        {isLoading ? (
          <SkeletonGrid />
        ) : recipes.length === 0 ? (
          <Grid item xs={12}>
            <Box
              sx={{
                textAlign: 'center',
                py: 8,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
              }}
            >
              <RestaurantIcon sx={{ fontSize: 64, color: 'text.disabled' }} />
              <Typography color="text.secondary">
                No hay recetas. ¡Añade la primera!
              </Typography>
            </Box>
          </Grid>
        ) : (
          recipes.map((recipe) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={recipe.id}>
              <RecipeCard
                recipe={recipe}
                subcategoryName={recipe.subcategory_id ? subcategoryMap[recipe.subcategory_id] : undefined}
                onEdit={handleEdit}
                onDelete={setDeleteTarget}
              />
            </Grid>
          ))
        )}
      </Grid>

      {/* FAB SpeedDial */}
      <SpeedDial
        ariaLabel="Acciones de receta"
        sx={{ position: 'fixed', bottom: 72, right: 16 }}
        icon={<SpeedDialIcon openIcon={<AddIcon />} />}
      >
        <SpeedDialAction
          icon={<AddIcon />}
          tooltipTitle="Nueva receta"
          onClick={() => { setEditingRecipe(null); setPrefillSuggestion(null); setFormOpen(true) }}
        />
        <SpeedDialAction
          icon={<AutoAwesomeIcon />}
          tooltipTitle="Despensa Virtual"
          onClick={() => setPantryOpen(true)}
        />
      </SpeedDial>

      {/* Recipe form dialog */}
      <RecipeForm
        open={formOpen}
        onClose={handleFormClose}
        recipe={editingRecipe}
        prefill={prefillSuggestion}
        categories={categories}
      />

      {/* Delete confirm dialog */}
      <Dialog open={deleteTarget !== null} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Eliminar receta</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Seguro que quieres eliminar <strong>{deleteTarget?.name}</strong>? Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Cancelar</Button>
          <Button color="error" onClick={handleDeleteConfirm} disabled={deleteRecipe.isPending}>
            {deleteRecipe.isPending ? <CircularProgress size={18} /> : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Despensa Virtual dialog */}
      <Dialog open={pantryOpen} onClose={() => setPantryOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>
          Despensa Virtual
          <IconButton
            onClick={() => setPantryOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Escribe los ingredientes que tienes y pulsa Enter para añadirlos. Luego haz clic en Sugerir.
          </Typography>
          <TextField
            fullWidth
            size="small"
            label="Ingrediente"
            placeholder="ej: pollo, arroz, tomate..."
            value={pantryInput}
            onChange={(e) => setPantryInput(e.target.value)}
            onKeyDown={handlePantryKeyDown}
            sx={{ mb: 1.5 }}
          />
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
            {pantryIngredients.map((ing) => (
              <Chip
                key={ing}
                label={ing}
                onDelete={() => setPantryIngredients((prev) => prev.filter((i) => i !== ing))}
                size="small"
              />
            ))}
          </Box>
          {pantryError && (
            <Alert severity="error" sx={{ mt: 1 }}>
              {pantryError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPantryOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handlePantrySuggest}
            disabled={pantryIngredients.length === 0 || pantryLoading}
            startIcon={pantryLoading ? <CircularProgress size={16} color="inherit" /> : <AutoAwesomeIcon />}
          >
            Sugerir
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default RecipesView
