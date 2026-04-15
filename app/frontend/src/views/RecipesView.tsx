import { useState, useCallback } from 'react'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Chip from '@mui/material/Chip'
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
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import Divider from '@mui/material/Divider'
import SpeedDial from '@mui/material/SpeedDial'
import SpeedDialAction from '@mui/material/SpeedDialAction'
import SpeedDialIcon from '@mui/material/SpeedDialIcon'
import AddIcon from '@mui/icons-material/Add'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import RestaurantIcon from '@mui/icons-material/Restaurant'
import KitchenIcon from '@mui/icons-material/Kitchen'
import CloseIcon from '@mui/icons-material/Close'
import { useDebounce } from 'use-debounce'
import { useQuery } from '@tanstack/react-query'
import ExtrasTab from '../components/ExtrasTab'
import RecipeCard from '../components/RecipeCard'
import RecipeDetailDialog from '../components/RecipeDetailDialog'
import RecipeForm from './RecipeForm'
import { useRecipes, useRecipe, useDeleteRecipe } from '../hooks/useRecipes'
import { getCategories } from '../api/categories'
import { generateRecipeFromTitle, searchRecipesByIngredients } from '../api/recipes'
import type { Recipe, RecipeSuggestion, RecipeSummary } from '../types/recipe'
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
  const [activeTab, setActiveTab] = useState(0)
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch] = useDebounce(searchInput, 300)
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<number | null>(null)

  const [formOpen, setFormOpen] = useState(false)
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null)
  const [detailRecipeId, setDetailRecipeId] = useState<number | null>(null)

  const { data: detailRecipe = null } = useRecipe(detailRecipeId)

  // Generate recipe by title state
  const [generateOpen, setGenerateOpen] = useState(false)
  const [recipeTitleInput, setRecipeTitleInput] = useState('')
  const [generateLoading, setGenerateLoading] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)

  // Despensa Virtual state
  const [pantryOpen, setPantryOpen] = useState(false)
  const [pantryInput, setPantryInput] = useState('')
  const [pantryIngredients, setPantryIngredients] = useState<string[]>([])
  const [pantryLoading, setPantryLoading] = useState(false)
  const [pantryError, setPantryError] = useState<string | null>(null)
  const [pantryResults, setPantryResults] = useState<RecipeSummary[]>([])
  const [pantrySearched, setPantrySearched] = useState(false)
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

  const handleGenerateRecipe = async () => {
    const title = recipeTitleInput.trim()
    if (!title) return

    setGenerateLoading(true)
    setGenerateError(null)
    try {
      const suggestion = await generateRecipeFromTitle(title)
      setPrefillSuggestion(suggestion)
      setGenerateOpen(false)
      setRecipeTitleInput('')
      setEditingRecipe(null)
      setFormOpen(true)
    } catch (e) {
      setGenerateError((e as Error).message)
    } finally {
      setGenerateLoading(false)
    }
  }

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

  const handlePantrySearch = async () => {
    if (pantryIngredients.length === 0) return
    setPantryLoading(true)
    setPantryError(null)
    setPantrySearched(true)
    try {
      const results = await searchRecipesByIngredients(pantryIngredients)
      setPantryResults(results)
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
    <Box>
      {/* Tabs */}
      <Box sx={{ px: 3, pt: 2, bgcolor: 'background.default' }}>
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          sx={{
            '& .MuiTabs-indicator': { bgcolor: '#4da8ff', height: 3, borderRadius: 2 },
            '& .MuiTab-root': {
              fontFamily: '"Inter", sans-serif',
              fontWeight: 700,
              fontSize: 15,
              textTransform: 'none',
              color: '#6a769e',
              '&.Mui-selected': { color: '#4da8ff' },
            },
          }}
        >
          <Tab label="Recetas" />
          <Tab label="Snacks Rápidos" />
        </Tabs>
      </Box>

      {activeTab === 1 && <ExtrasTab />}

      {activeTab === 0 && (
      <Box sx={{ p: 3, pb: 10 }}>
      {/* Search bar */}
      <Box sx={{ position: 'relative', mb: 4 }}>
        <Box
          sx={{
            position: 'absolute',
            left: 16,
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#6a769e',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
        </Box>
        <TextField
          fullWidth
          placeholder="Buscar recetas saludables..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          sx={{
            '& .MuiOutlinedInput-root': {
              pl: 6,
              py: 0.5,
              bgcolor: '#eef2ff',
              borderRadius: '16px',
              '& fieldset': { border: 'none' },
              '&.Mui-focused fieldset': { border: '2px solid #4da8ff' },
            },
          }}
        />
      </Box>

      {/* Category chips */}
      <Box
        sx={{
          overflowX: 'auto',
          display: 'flex',
          gap: 1.5,
          pb: 1,
          mb: 1,
          mx: -3,
          px: 3,
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        }}
      >
        {categories.map((cat) => (
          <Box
            key={cat.id}
            component="button"
            onClick={() => handleCategoryClick(cat.id)}
            sx={{
              flexShrink: 0,
              bgcolor: selectedCategoryId === cat.id ? '#4da8ff' : '#e8eeff',
              color: selectedCategoryId === cat.id ? 'white' : '#44464f',
              px: 3,
              py: 1.25,
              borderRadius: 100,
              fontSize: 14,
              fontWeight: selectedCategoryId === cat.id ? 700 : 600,
              fontFamily: '"Inter", sans-serif',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s',
              letterSpacing: '0.02em',
              '&:hover': {
                bgcolor: selectedCategoryId === cat.id ? '#4da8ff' : '#dde3f0',
              },
            }}
          >
            {cat.name}
          </Box>
        ))}
      </Box>

      {/* Subcategory chips */}
      {selectedCategory && selectedCategory.subcategories.length > 0 && (
        <Box
          sx={{
            overflowX: 'auto',
            display: 'flex',
            gap: 1,
            pb: 1,
            mb: 3,
            mx: -3,
            px: 3,
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
          }}
        >
          {selectedCategory.subcategories.map((sub) => (
            <Box
              key={sub.id}
              component="button"
              onClick={() => handleSubcategoryClick(sub.id)}
              sx={{
                flexShrink: 0,
                bgcolor: selectedSubcategoryId === sub.id ? '#5071d5' : '#e8eeff',
                color: selectedSubcategoryId === sub.id ? 'white' : '#44464f',
                px: 2,
                py: 0.75,
                borderRadius: 100,
                fontSize: 12,
                fontWeight: 600,
                fontFamily: '"Inter", sans-serif',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {sub.name}
            </Box>
          ))}
        </Box>
      )}

      {/* Recipe grid */}
      <Grid container spacing={3}>
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
            <Grid item xs={12} sm={6} md={4} lg={3} key={recipe.id} sx={{ display: 'flex' }}>
              <RecipeCard
                recipe={recipe}
                subcategoryName={recipe.subcategory_id ? subcategoryMap[recipe.subcategory_id] : undefined}
                onEdit={handleEdit}
                onDelete={setDeleteTarget}
                onView={(r) => setDetailRecipeId(r.id)}
              />
            </Grid>
          ))
        )}
      </Grid>

      {/* FAB SpeedDial */}
      <SpeedDial
        ariaLabel="Acciones de receta"
        sx={{
          position: 'fixed',
          bottom: 88,
          right: 20,
          '& .MuiFab-primary': {
            bgcolor: '#005cb2',
            '&:hover': { bgcolor: '#004090' },
            borderRadius: '16px',
            width: 56,
            height: 56,
          },
        }}
        icon={<SpeedDialIcon openIcon={<AddIcon />} />}
      >
        <SpeedDialAction
          icon={<AddIcon />}
          tooltipTitle="Nueva receta"
          onClick={() => { setEditingRecipe(null); setPrefillSuggestion(null); setFormOpen(true) }}
        />
        <SpeedDialAction
          icon={<AutoAwesomeIcon />}
          tooltipTitle="Generar recetas"
          onClick={() => {
            setGenerateError(null)
            setRecipeTitleInput('')
            setGenerateOpen(true)
          }}
        />
        <SpeedDialAction
          icon={<KitchenIcon />}
          tooltipTitle="Despensa virtual"
          onClick={() => {
            setPantryError(null)
            setPantryInput('')
            setPantryIngredients([])
            setPantryResults([])
            setPantrySearched(false)
            setPantryOpen(true)
          }}
        />
      </SpeedDial>

      {/* Recipe detail dialog */}
      <RecipeDetailDialog
        open={Boolean(detailRecipeId)}
        recipe={detailRecipe}
        onClose={() => setDetailRecipeId(null)}
        onEdit={(r) => { setDetailRecipeId(null); handleEdit(r) }}
      />

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

      {/* Generate recipes dialog */}
      <Dialog open={generateOpen} onClose={() => setGenerateOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>
          Generar recetas
          <IconButton
            onClick={() => setGenerateOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Escribe el nombre de la receta y la IA generará un borrador completo para revisarlo antes de guardarlo.
          </Typography>
          <TextField
            fullWidth
            autoFocus
            size="small"
            label="Nombre de la receta"
            placeholder="ej: Lasaña ligera de pollo"
            value={recipeTitleInput}
            onChange={(e) => setRecipeTitleInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                void handleGenerateRecipe()
              }
            }}
          />
          {generateError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {generateError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGenerateOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleGenerateRecipe}
            disabled={!recipeTitleInput.trim() || generateLoading}
            startIcon={generateLoading ? <CircularProgress size={16} color="inherit" /> : <AutoAwesomeIcon />}
          >
            Generar
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
          {!pantryError && pantrySearched && !pantryLoading && pantryResults.length === 0 && (
            <Alert severity="info" sx={{ mt: 1 }}>
              No se han encontrado recetas configuradas con esos ingredientes.
            </Alert>
          )}
          {pantryResults.length > 0 && (
            <List sx={{ mt: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, py: 0 }}>
              {pantryResults.map((recipe, index) => (
                <Box key={recipe.id}>
                  {index > 0 && <Divider />}
                  <ListItemButton
                    onClick={() => {
                      setPantryOpen(false)
                      setDetailRecipeId(recipe.id)
                    }}
                  >
                    <ListItemText
                      primary={recipe.name}
                      secondary={`${Math.round(recipe.kcal)} kcal/ración · P ${Math.round(recipe.prot_g)}g · HC ${Math.round(recipe.hc_g)}g · G ${Math.round(recipe.fat_g)}g`}
                    />
                  </ListItemButton>
                </Box>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPantryOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handlePantrySearch}
            disabled={pantryIngredients.length === 0 || pantryLoading}
            startIcon={pantryLoading ? <CircularProgress size={16} color="inherit" /> : <KitchenIcon />}
          >
            Buscar recetas
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
      )}
    </Box>
  )
}

export default RecipesView
