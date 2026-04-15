import React, { useEffect, useRef, useState } from 'react'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import AddIcon from '@mui/icons-material/Add'
import AddAPhotoIcon from '@mui/icons-material/AddAPhoto'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh'
import CasinoIcon from '@mui/icons-material/Casino'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import DeleteIcon from '@mui/icons-material/Delete'
import GroupsIcon from '@mui/icons-material/Groups'
import RemoveIcon from '@mui/icons-material/Remove'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import Alert from '@mui/material/Alert'
import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import FormControl from '@mui/material/FormControl'
import FormHelperText from '@mui/material/FormHelperText'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import TextField from '@mui/material/TextField'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import ImageCarousel from '../components/ImageCarousel'
import { useCreateRecipe, useUpdateRecipe } from '../hooks/useRecipes'
import { resolveBarcodeNutrition, searchImages, scrapeRecipe } from '../api/recipes'
import { lookupUnitWeight, createUnitWeight } from '../api/unitWeights'
import type {
  BarcodeResolvedProduct,
  Recipe,
  RecipeCreate,
  RecipeUpdate,
  RecipeSuggestion,
  MealType,
  ScrapedRecipe,
} from '../types/recipe'
import type { Category } from '../types/category'

// ─── Shared label style ───────────────────────────────────────────────────────

const fieldLabel = {
  fontSize: 12,
  fontWeight: 700,
  color: '#4da8ff',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.08em',
  fontFamily: '"Inter", sans-serif',
  mb: 0.75,
  px: 0.5,
}

const styledInput = {
  '& .MuiOutlinedInput-root': {
    bgcolor: 'background.paper',
    borderRadius: '16px',
    '& fieldset': { border: '1px solid rgba(195,199,208,0.4)' },
    '&:hover fieldset': { border: '1px solid rgba(0,130,253,0.3)' },
    '&.Mui-focused fieldset': { border: '2px solid #4da8ff' },
  },
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface RecipeFormValues {
  name: string
  subcategory_id: string
  meal_type: MealType
  servings: number
  instructions_text: string
  image_url: string
  external_url: string
  ingredients: { name: string; quantity_g: number }[]
  kcal: number
  prot_g: number
  hc_g: number
  fat_g: number
}

interface RecipeFormProps {
  open: boolean
  onClose: (saved?: boolean) => void
  recipe?: Recipe | null
  prefill?: RecipeSuggestion | null
  categories: Category[]
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Unit = 'g' | 'kg' | 'ud'
type IngredientResolution = BarcodeResolvedProduct | null

// ─── Component ────────────────────────────────────────────────────────────────

function RecipeForm({ open, onClose, recipe, prefill, categories }: RecipeFormProps) {
  const createRecipe = useCreateRecipe()
  const updateRecipe = useUpdateRecipe()

  const [carouselImages, setCarouselImages] = useState<string[]>([])
  const [carouselLoading, setCarouselLoading] = useState(false)
  const [carouselError, setCarouselError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [scrapeLoading, setScrapeLoading] = useState(false)
  const [scrapeError, setScrapeError] = useState<string | null>(null)
  const [showImagePicker, setShowImagePicker] = useState(false)
  const [ingredientUnits, setIngredientUnits] = useState<Unit[]>(['g'])
  const [ingredientResolutions, setIngredientResolutions] = useState<IngredientResolution[]>([null])
  const [barcodeLoadingIndex, setBarcodeLoadingIndex] = useState<number | null>(null)
  const [unitWeightDialog, setUnitWeightDialog] = useState<{
    open: boolean
    ingredientIndex: number
    ingredientName: string
    gramsInput: string
  } | null>(null)
  const ingredientBarcodeInputs = useRef<Array<HTMLInputElement | null>>([])

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting, dirtyFields },
  } = useForm<RecipeFormValues>({
    defaultValues: {
      name: '',
      subcategory_id: '',
      meal_type: 'plato_unico',
      servings: 1,
      instructions_text: '',
      image_url: '',
      external_url: '',
      ingredients: [{ name: '', quantity_g: 100 }],
      kcal: 0,
      prot_g: 0,
      hc_g: 0,
      fat_g: 0,
    },
  })

  const { fields, append, remove, replace } = useFieldArray({ control, name: 'ingredients' })

  const selectedImageUrl = watch('image_url')
  const recipeName = watch('name')
  const servings = watch('servings')
  const watchedExternalUrl = watch('external_url')

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('')

  useEffect(() => {
    if (!open) return
    setCarouselImages([])
    setCarouselError(null)
    setSubmitError(null)
    setScrapeError(null)
    setShowImagePicker(false)

    if (prefill) {
      const prefillIngredients = prefill.ingredients.map((i) => ({ name: i.name, quantity_g: i.quantity_g }))
      reset({
        name: prefill.name,
        subcategory_id: '',
        meal_type: 'plato_unico',
        servings: prefill.servings ?? 1,
        instructions_text: prefill.instructions_text ?? '',
        image_url: '',
        external_url: '',
        ingredients: prefillIngredients,
      })
      setIngredientUnits(Array(prefillIngredients.length).fill('g'))
      setIngredientResolutions(Array(prefillIngredients.length).fill(null))
      setSelectedCategoryId('')
      return
    }

    if (recipe) {
      const subcat = recipe.subcategory_id ?? null
      const cat = subcat
        ? categories.find((c) => c.subcategories.some((s) => s.id === subcat))
        : null
      const recipeIngredients =
        recipe.ingredients.length > 0
          ? recipe.ingredients.map((i) => ({ name: i.name, quantity_g: i.quantity_g }))
          : [{ name: '', quantity_g: 100 }]
      const recipeResolutions =
        recipe.ingredients.length > 0
          ? recipe.ingredients.map((i) => (
            i.nutrition_product_id
              ? {
                  product_id: i.nutrition_product_id,
                  name: i.name,
                  barcode: i.barcode ?? '',
                  source: i.nutrition_source ?? 'openfoodfacts',
                  source_ref: i.nutrition_source_ref ?? null,
                  kcal_100g: i.kcal_100g,
                  prot_100g: i.prot_100g,
                  hc_100g: i.hc_100g,
                  fat_100g: i.fat_100g,
                }
              : null
          ))
          : [null]
      reset({
        name: recipe.name,
        subcategory_id: subcat !== null ? String(subcat) : '',
        meal_type: recipe.meal_type ?? 'plato_unico',
        servings: recipe.servings,
        instructions_text: recipe.instructions_text ?? '',
        image_url: recipe.image_url ?? '',
        external_url: recipe.external_url ?? '',
        ingredients: recipeIngredients,
        kcal: recipe.kcal,
        prot_g: recipe.prot_g,
        hc_g: recipe.hc_g,
        fat_g: recipe.fat_g,
      })
      setIngredientUnits(Array(recipeIngredients.length).fill('g'))
      setIngredientResolutions(recipeResolutions)
      setSelectedCategoryId(cat ? String(cat.id) : '')
      return
    }

    reset({
      name: '',
      subcategory_id: '',
      meal_type: 'plato_unico',
      servings: 1,
      instructions_text: '',
      image_url: '',
      external_url: '',
      ingredients: [{ name: '', quantity_g: 100 }],
    })
    setIngredientUnits(['g'])
    setIngredientResolutions([null])
    setSelectedCategoryId('')
  }, [open, recipe, prefill, categories, reset])

  useEffect(() => {
    if (!recipe || !open) return
    const safeServings = Math.max(1, servings || 1)

    if (!dirtyFields.kcal) {
      setValue('kcal', Number(((recipe.kcal * recipe.servings) / safeServings).toFixed(1)), { shouldDirty: false })
    }
    if (!dirtyFields.prot_g) {
      setValue('prot_g', Number(((recipe.prot_g * recipe.servings) / safeServings).toFixed(1)), { shouldDirty: false })
    }
    if (!dirtyFields.hc_g) {
      setValue('hc_g', Number(((recipe.hc_g * recipe.servings) / safeServings).toFixed(1)), { shouldDirty: false })
    }
    if (!dirtyFields.fat_g) {
      setValue('fat_g', Number(((recipe.fat_g * recipe.servings) / safeServings).toFixed(1)), { shouldDirty: false })
    }
  }, [
    dirtyFields.fat_g,
    dirtyFields.hc_g,
    dirtyFields.kcal,
    dirtyFields.prot_g,
    open,
    recipe,
    servings,
    setValue,
  ])

  const handleCategoryChange = (catId: string) => {
    setSelectedCategoryId(catId)
    setValue('subcategory_id', '')
  }

  const selectedCategory = categories.find((c) => String(c.id) === selectedCategoryId) ?? null
  const isComidaCategory = selectedCategory?.name.toLowerCase() === 'comida'
  const watchedMealType = watch('meal_type')

  const handleScrapeUrl = async () => {
    const url = watchedExternalUrl.trim()
    if (!url) return
    setScrapeLoading(true)
    setScrapeError(null)
    try {
      const scraped: ScrapedRecipe = await scrapeRecipe(url)
      setValue('name', scraped.name)
      if (scraped.servings) setValue('servings', scraped.servings)
      if (scraped.instructions_text) setValue('instructions_text', scraped.instructions_text)
      if (scraped.ingredients && scraped.ingredients.length > 0) {
        const validIngredients = scraped.ingredients
          .filter((i) => i.name)
          .map((i) => ({ name: i.name, quantity_g: i.quantity_g ?? 100 }))
        if (validIngredients.length > 0) {
          replace(validIngredients)
          setIngredientUnits(Array(validIngredients.length).fill('g'))
          setIngredientResolutions(Array(validIngredients.length).fill(null))
        }
      }
    } catch (e) {
      setScrapeError((e as Error).message)
    } finally {
      setScrapeLoading(false)
    }
  }

  const handleSearchImages = async (page: number = 1) => {
    const query = recipeName.trim() || 'comida saludable'
    setCarouselLoading(true)
    setCarouselError(null)
    setShowImagePicker(true)
    try {
      const urls = await searchImages(query, page)
      setCarouselImages(urls)
    } catch (e) {
      setCarouselError((e as Error).message)
    } finally {
      setCarouselLoading(false)
    }
  }

  const handleShuffleImages = () => {
    const randomPage = Math.floor(Math.random() * 15) + 1
    handleSearchImages(randomPage)
  }

  const setIngredientResolutionAt = (index: number, resolution: IngredientResolution) => {
    setIngredientResolutions((prev) => prev.map((item, i) => (i === index ? resolution : item)))
  }

  const clearIngredientResolution = (index: number) => {
    setIngredientResolutionAt(index, null)
  }

  const handleLocalImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string
      if (dataUrl) {
        setValue('image_url', dataUrl)
        setShowImagePicker(false)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleIngredientBarcodeUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setBarcodeLoadingIndex(index)
    setSubmitError(null)
    try {
      const result = await resolveBarcodeNutrition(file)
      setValue(`ingredients.${index}.name`, result.product.name, { shouldDirty: true, shouldValidate: true })
      setIngredientResolutionAt(index, result.product)
    } catch (error) {
      clearIngredientResolution(index)
      setSubmitError((error as Error).message)
    } finally {
      setBarcodeLoadingIndex(null)
    }
  }

  const handleUnitChange = async (index: number, newUnit: Unit) => {
    const units = [...ingredientUnits]
    units[index] = newUnit
    setIngredientUnits(units)

    if (newUnit === 'ud') {
      const ingName = watch(`ingredients.${index}.name`).trim()
      if (ingName) {
        const found = await lookupUnitWeight(ingName)
        if (!found) {
          setUnitWeightDialog({
            open: true,
            ingredientIndex: index,
            ingredientName: ingName,
            gramsInput: '',
          })
        }
        // If found, do nothing — the quantity_g will be computed at submit time
      }
    }
  }

  const onSubmit = async (values: RecipeFormValues) => {
    setSubmitError(null)

    const basePayload = {
      name: values.name.trim(),
      subcategory_id: values.subcategory_id ? Number(values.subcategory_id) : null,
      meal_type: values.meal_type,
      servings: values.servings,
      instructions_text: values.instructions_text.trim() || null,
      image_url: values.image_url.trim() || null,
      external_url: values.external_url.trim() || null,
    }
    try {
      if (recipe) {
        const updatePayload: RecipeUpdate = {
          ...basePayload,
        }
        const ingredientsDirty =
          Array.isArray(dirtyFields.ingredients) &&
          dirtyFields.ingredients.some((ingredientDirty) => Boolean(ingredientDirty?.name || ingredientDirty?.quantity_g))
        if (ingredientsDirty) {
          updatePayload.ingredients = await Promise.all(
            values.ingredients.map(async (ing, index) => {
              const unit = ingredientUnits[index] ?? 'g'
              let quantity_g = Number(ing.quantity_g)
              if (unit === 'kg') {
                quantity_g = quantity_g * 1000
              } else if (unit === 'ud') {
                const found = await lookupUnitWeight(ing.name.trim())
                if (found) {
                  quantity_g = quantity_g * found.grams_per_unit
                }
              }
              const resolution = ingredientResolutions[index]
              return {
                name: ing.name.trim(),
                quantity_g,
                resolved_nutrition: resolution ? { product_id: resolution.product_id } : undefined,
              }
            })
          )
        }
        if (dirtyFields.kcal) updatePayload.kcal = Number(values.kcal)
        if (dirtyFields.prot_g) updatePayload.prot_g = Number(values.prot_g)
        if (dirtyFields.hc_g) updatePayload.hc_g = Number(values.hc_g)
        if (dirtyFields.fat_g) updatePayload.fat_g = Number(values.fat_g)
        await updateRecipe.mutateAsync({ id: recipe.id, payload: updatePayload })
      } else {
        // Convert quantities to grams based on units
        const convertedIngredients = await Promise.all(
          values.ingredients.map(async (ing, index) => {
            const unit = ingredientUnits[index] ?? 'g'
            let quantity_g = Number(ing.quantity_g)
            if (unit === 'kg') {
              quantity_g = quantity_g * 1000
            } else if (unit === 'ud') {
              const found = await lookupUnitWeight(ing.name.trim())
              if (found) {
                quantity_g = quantity_g * found.grams_per_unit
              }
            }
            const resolution = ingredientResolutions[index]
            return {
              name: ing.name.trim(),
              quantity_g,
              resolved_nutrition: resolution ? { product_id: resolution.product_id } : undefined,
            }
          })
        )
        await createRecipe.mutateAsync({ ...basePayload, ingredients: convertedIngredients } as RecipeCreate)
      }
      onClose(true)
    } catch (e) {
      setSubmitError((e as Error).message)
    }
  }

  const title = recipe ? 'Editar Receta' : prefill ? 'Revisar Sugerencia' : 'Nueva Receta'

  return (
    <Dialog open={open} onClose={() => onClose()} fullScreen>
      {/* ── Top bar ── */}
      <AppBar sx={{ position: 'relative', bgcolor: '#005cb2', boxShadow: 'none' }}>
        <Toolbar sx={{ height: 56, minHeight: '56px !important', px: 2, gap: 2 }}>
          <IconButton edge="start" color="inherit" onClick={() => onClose()}>
            <ArrowBackIcon />
          </IconButton>
          <Typography
            sx={{ flex: 1, fontFamily: '"Inter", sans-serif', fontWeight: 700, fontSize: 19, color: 'white', letterSpacing: '-0.02em' }}
          >
            {title}
          </Typography>
        </Toolbar>
      </AppBar>

      {/* ── Scrollable content ── */}
      <Box
        component="form"
        noValidate
        onSubmit={handleSubmit(onSubmit)}
        sx={{ bgcolor: '#f8f9ff', minHeight: '100%', overflowY: 'auto', pb: 16 }}
      >
        <Box sx={{ maxWidth: 640, mx: 'auto', px: 3, pt: 4 }}>

          {/* ── Hero image area ── */}
          <Box sx={{ mb: 4 }}>
            {selectedImageUrl ? (
              /* Selected image preview */
              <Box sx={{ position: 'relative', width: '100%', height: 224, borderRadius: '24px', overflow: 'hidden' }}>
                <Box
                  component="img"
                  src={selectedImageUrl}
                  alt="Imagen receta"
                  sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Button
                    onClick={() => handleSearchImages()}
                    disabled={carouselLoading}
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.9)',
                      color: '#4da8ff',
                      borderRadius: 100,
                      fontWeight: 700,
                      px: 3,
                      '&:hover': { bgcolor: 'white' },
                    }}
                    startIcon={<AddAPhotoIcon />}
                  >
                    Cambiar imagen
                  </Button>
                </Box>
              </Box>
            ) : (
              /* Upload placeholder */
              <Box
                onClick={() => handleSearchImages()}
                sx={{
                  width: '100%',
                  height: 224,
                  borderRadius: '24px',
                  border: '2px dashed #c3c7d0',
                  bgcolor: '#f0f4ff',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1.5,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': { bgcolor: '#eef2ff', borderColor: '#4da8ff' },
                }}
              >
                <Box
                  sx={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    bgcolor: 'rgba(0,130,253,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#4da8ff',
                    transition: 'transform 0.2s',
                    '&:hover': { transform: 'scale(1.1)' },
                  }}
                >
                  <AddAPhotoIcon sx={{ fontSize: 28 }} />
                </Box>
                <Typography sx={{ fontFamily: '"Inter", sans-serif', fontWeight: 600, color: '#44464f' }}>
                  Toca para buscar imágenes
                </Typography>
                {carouselLoading && <CircularProgress size={20} sx={{ color: '#4da8ff' }} />}
              </Box>
            )}
          </Box>

          {/* ── Image picker panel (bottom-sheet style) ── */}
          {showImagePicker && (
            <Box
              sx={{
                bgcolor: 'background.paper',
                borderRadius: '24px',
                mb: 4,
                overflow: 'hidden',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3, pt: 3, pb: 2 }}>
                <Typography sx={{ fontFamily: '"Inter", sans-serif', fontWeight: 700, fontSize: 18 }}>
                  Elige una imagen
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <IconButton
                    size="small"
                    onClick={handleShuffleImages}
                    disabled={carouselLoading}
                    title="Otras imágenes"
                    sx={{ bgcolor: '#eef2ff', '&:hover': { bgcolor: '#dde3f0' } }}
                  >
                    <CasinoIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={() => setShowImagePicker(false)} sx={{ bgcolor: '#eef2ff', '&:hover': { bgcolor: '#dde3f0' } }}>
                    <ArrowBackIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>

              {carouselError && (
                <Alert severity="error" sx={{ mx: 3, mb: 2, borderRadius: 2 }}>{carouselError}</Alert>
              )}

              <ImageCarousel
                images={carouselImages}
                selectedUrl={selectedImageUrl}
                onSelect={(url) => setValue('image_url', url)}
                isLoading={carouselLoading}
              />

              <Box sx={{ px: 3, pb: selectedImageUrl && !carouselLoading ? 0 : 3 }}>
                <Button
                  component="label"
                  fullWidth
                  variant="outlined"
                  startIcon={<UploadFileIcon />}
                  sx={{
                    borderRadius: '14px',
                    borderColor: '#c3c7d0',
                    color: '#44464f',
                    fontFamily: '"Inter", sans-serif',
                    fontWeight: 600,
                    py: 1.5,
                    '&:hover': { borderColor: '#4da8ff', color: '#4da8ff' },
                  }}
                >
                  Subir desde el dispositivo
                  <input type="file" accept="image/*" hidden onChange={handleLocalImageUpload} />
                </Button>
              </Box>

              {selectedImageUrl && !carouselLoading && (
                <Box sx={{ px: 3, pt: 2, pb: 3 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={() => setShowImagePicker(false)}
                    sx={{
                      background: 'linear-gradient(90deg, #4da8ff 0%, #005cb2 100%)',
                      borderRadius: '14px',
                      py: 1.5,
                      fontFamily: '"Inter", sans-serif',
                      fontWeight: 700,
                      fontSize: 15,
                      boxShadow: '0 4px 16px rgba(0,130,253,0.25)',
                    }}
                  >
                    Usar esta imagen
                  </Button>
                </Box>
              )}
            </Box>
          )}

          {/* ── Basic info ── */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mb: 4 }}>
            {/* Name */}
            <Box>
              <Typography sx={fieldLabel}>Nombre de la receta</Typography>
              <TextField
                fullWidth
                required
                placeholder="Ej: Bowl de Quinoa y Salmón"
                {...register('name', { required: 'El nombre es obligatorio' })}
                error={!!errors.name}
                helperText={errors.name?.message}
                sx={styledInput}
                inputProps={{
                  style: {
                    fontFamily: '"Inter", sans-serif',
                    fontWeight: 500,
                    padding: '16px 20px',
                  },
                }}
              />
            </Box>

            {/* Category + Subcategory */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <Box>
                <Typography sx={fieldLabel}>Categoría</Typography>
                <FormControl fullWidth>
                  <Select
                    value={selectedCategoryId}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    displayEmpty
                    sx={{
                      bgcolor: 'background.paper',
                      borderRadius: '16px',
                      fontFamily: '"Inter", sans-serif',
                      fontWeight: 500,
                      '& .MuiOutlinedInput-notchedOutline': { border: '1px solid rgba(195,199,208,0.4)' },
                      '&:hover .MuiOutlinedInput-notchedOutline': { border: '1px solid rgba(0,130,253,0.3)' },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { border: '2px solid #4da8ff' },
                      '& .MuiSelect-select': { py: 2, px: 2.5 },
                    }}
                  >
                    <MenuItem value="">— Sin categoría —</MenuItem>
                    {categories.map((cat) => (
                      <MenuItem key={cat.id} value={String(cat.id)}>{cat.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              <Box>
                <Typography sx={{ ...fieldLabel, color: selectedCategory ? '#4da8ff' : '#c3c7d0' }}>
                  Subcategoría
                </Typography>
                <Controller
                  control={control}
                  name="subcategory_id"
                  render={({ field }) => (
                    <FormControl fullWidth disabled={!selectedCategory}>
                      <Select
                        {...field}
                        displayEmpty
                        sx={{
                          bgcolor: selectedCategory ? 'background.paper' : '#f8f9ff',
                          borderRadius: '16px',
                          fontFamily: '"Inter", sans-serif',
                          fontWeight: 500,
                          '& .MuiOutlinedInput-notchedOutline': { border: '1px solid rgba(195,199,208,0.4)' },
                          '&:hover .MuiOutlinedInput-notchedOutline': { border: '1px solid rgba(0,130,253,0.3)' },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { border: '2px solid #4da8ff' },
                          '& .MuiSelect-select': { py: 2, px: 2.5 },
                        }}
                      >
                        <MenuItem value="">— Sin subcategoría —</MenuItem>
                        {selectedCategory?.subcategories.map((sub) => (
                          <MenuItem key={sub.id} value={String(sub.id)}>{sub.name}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Box>
            </Box>

            {/* Meal type selector — only for Comida category */}
            {isComidaCategory && (
              <Box>
                <Typography sx={fieldLabel}>Tipo de plato</Typography>
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                  {([
                    { value: 'plato_unico', label: 'Plato único' },
                    { value: 'primero', label: '1er plato' },
                    { value: 'segundo', label: '2º plato' },
                  ] as const).map(({ value, label }) => (
                    <Box
                      key={value}
                      onClick={() => setValue('meal_type', value)}
                      sx={{
                        flex: 1,
                        py: 1.5,
                        px: 1,
                        textAlign: 'center',
                        borderRadius: '16px',
                        cursor: 'pointer',
                        border: watchedMealType === value
                          ? '2px solid #4da8ff'
                          : '2px solid rgba(195,199,208,0.4)',
                        bgcolor: watchedMealType === value ? '#eef2ff' : 'background.paper',
                        transition: 'all 0.15s',
                        '&:hover': { borderColor: '#4da8ff' },
                      }}
                    >
                      <Typography sx={{
                        fontFamily: '"Inter", sans-serif',
                        fontWeight: watchedMealType === value ? 700 : 500,
                        fontSize: 13,
                        color: watchedMealType === value ? '#4da8ff' : '#44464f',
                      }}>
                        {label}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}

            {/* Servings counter */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                p: 2,
                bgcolor: '#eef2ff',
                borderRadius: '24px',
                border: '1px solid rgba(195,199,208,0.2)',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <GroupsIcon sx={{ color: '#4da8ff', fontSize: 22 }} />
                <Typography sx={{ fontFamily: '"Inter", sans-serif', fontWeight: 700, color: '#1a1c1e' }}>
                  Nº de raciones
                </Typography>
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  bgcolor: 'background.paper',
                  borderRadius: '16px',
                  p: 0.5,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                  border: '1px solid rgba(195,199,208,0.25)',
                }}
              >
                <IconButton
                  size="small"
                  onClick={() => setValue('servings', Math.max(1, servings - 1))}
                  sx={{ width: 40, height: 40, borderRadius: '12px', color: '#4da8ff', '&:hover': { bgcolor: '#f0f4ff' } }}
                >
                  <RemoveIcon />
                </IconButton>
                <Typography
                  sx={{ fontFamily: '"Inter", sans-serif', fontWeight: 900, fontSize: 18, minWidth: 24, textAlign: 'center', color: '#1a1c1e' }}
                >
                  {servings}
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => setValue('servings', servings + 1)}
                  sx={{ width: 40, height: 40, borderRadius: '12px', color: '#4da8ff', '&:hover': { bgcolor: '#f0f4ff' } }}
                >
                  <AddIcon />
                </IconButton>
              </Box>
            </Box>
          </Box>

          {/* ── Ingredients ── */}
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography sx={{ fontFamily: '"Inter", sans-serif', fontWeight: 800, fontSize: 18, color: '#1a1c1e' }}>
                Ingredientes
              </Typography>
              <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#6a769e', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                {fields.length} {fields.length === 1 ? 'Añadido' : 'Añadidos'}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {fields.map((field, index) => (
                <Box
                  key={field.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    p: 1,
                    bgcolor: 'background.paper',
                    borderRadius: '16px',
                    border: '1px solid rgba(195,199,208,0.2)',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                  }}
                >
                  {/* Ingredient name */}
                  <Box sx={{ flex: 1, px: 1 }}>
                    {ingredientResolutions[index] && (
                      <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#2e7d32', mb: 0.25 }}>
                        Código de barras detectado
                      </Typography>
                    )}
                    <input
                      style={{
                        width: '100%',
                        border: 'none',
                        background: 'transparent',
                        fontFamily: '"Inter", sans-serif',
                        fontWeight: 500,
                        fontSize: 14,
                        color: '#1a1c1e',
                        outline: 'none',
                      }}
                      placeholder="Nombre del ingrediente"
                      {...register(`ingredients.${index}.name`, {
                        required: true,
                        onChange: () => {
                          if (ingredientResolutions[index]) {
                            clearIngredientResolution(index)
                          }
                        },
                      })}
                    />
                    {ingredientResolutions[index]?.barcode && (
                      <Typography sx={{ fontSize: 11, color: '#6a769e', mt: 0.25 }}>
                        EAN: {ingredientResolutions[index]?.barcode}
                      </Typography>
                    )}
                  </Box>
                  {/* Grams */}
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      bgcolor: '#eef2ff',
                      borderRadius: '12px',
                      px: 1.5,
                      py: 1,
                      minWidth: 88,
                    }}
                  >
                    <input
                      type="number"
                      style={{
                        width: 48,
                        border: 'none',
                        background: 'transparent',
                        fontFamily: '"Inter", sans-serif',
                        fontWeight: 700,
                        fontSize: 14,
                        color: '#1a1c1e',
                        textAlign: 'right',
                        outline: 'none',
                      }}
                      min={0.1}
                      step="0.1"
                      {...register(`ingredients.${index}.quantity_g`, { required: true, min: 0.1, valueAsNumber: true })}
                    />
                    <select
                      value={ingredientUnits[index] ?? 'g'}
                      onChange={(e) => handleUnitChange(index, e.target.value as Unit)}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        fontFamily: '"Inter", sans-serif',
                        fontWeight: 700,
                        fontSize: 11,
                        color: '#6a769e',
                        cursor: 'pointer',
                        outline: 'none',
                        padding: 0,
                      }}
                    >
                      <option value="g">g</option>
                      <option value="kg">kg</option>
                      <option value="ud">ud.</option>
                    </select>
                  </Box>
                  <IconButton
                    size="small"
                    onClick={() => ingredientBarcodeInputs.current[index]?.click()}
                    disabled={barcodeLoadingIndex === index}
                    sx={{
                      color: ingredientResolutions[index] ? '#2e7d32' : '#4da8ff',
                      borderRadius: '12px',
                      p: 1,
                      '&:hover': { bgcolor: '#eef2ff' },
                    }}
                    title="Resolver por código de barras"
                  >
                    {barcodeLoadingIndex === index ? <CircularProgress size={18} /> : <UploadFileIcon fontSize="small" />}
                  </IconButton>
                  <input
                    ref={(node) => { ingredientBarcodeInputs.current[index] = node }}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => void handleIngredientBarcodeUpload(index, e)}
                  />
                  {/* Delete */}
                  <IconButton
                    size="small"
                    onClick={() => {
                      remove(index)
                      setIngredientUnits((u) => u.filter((_, i) => i !== index))
                      setIngredientResolutions((r) => r.filter((_, i) => i !== index))
                      ingredientBarcodeInputs.current = ingredientBarcodeInputs.current.filter((_, i) => i !== index)
                    }}
                    disabled={fields.length === 1}
                    sx={{
                      color: fields.length === 1 ? '#c3c7d0' : '#ba1a1a',
                      borderRadius: '12px',
                      p: 1,
                      '&:hover': { bgcolor: '#ffdad6' },
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
            </Box>

            {errors.ingredients && (
              <FormHelperText error sx={{ mt: 1 }}>Añade al menos un ingrediente con nombre y cantidad.</FormHelperText>
            )}

            {/* Add ingredient button */}
            <Button
              fullWidth
              startIcon={<AddIcon />}
              onClick={() => {
                append({ name: '', quantity_g: 100 })
                setIngredientUnits((u) => [...u, 'g'])
                setIngredientResolutions((r) => [...r, null])
              }}
              sx={{
                mt: 2,
                py: 1.75,
                border: '2px solid rgba(0,130,253,0.2)',
                borderRadius: '16px',
                color: '#4da8ff',
                fontFamily: '"Inter", sans-serif',
                fontWeight: 700,
                fontSize: 14,
                '&:hover': { bgcolor: 'rgba(0,130,253,0.04)', border: '2px solid rgba(0,130,253,0.4)' },
              }}
            >
              Añadir ingrediente
            </Button>
          </Box>

          {/* ── Macros (edit mode only) ── */}
          {recipe && (
            <Box sx={{ mb: 4 }}>
              <Typography sx={fieldLabel}>Macros por ración</Typography>
              <Typography
                sx={{
                  fontSize: 13,
                  color: '#6a769e',
                  fontFamily: '"Inter", sans-serif',
                  mb: 1.5,
                  px: 0.5,
                }}
              >
                Estos valores son para 1 ración. Si cambias ingredientes o raciones, se recalculan al guardar.
              </Typography>
              <Box
                sx={{
                  bgcolor: 'background.paper',
                  borderRadius: '20px',
                  p: 2.5,
                  border: '1px solid rgba(195,199,208,0.3)',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 2,
                }}
              >
                {([
                  ['kcal', 'kcal', '#5071d5'],
                  ['prot_g', 'Proteínas (g)', '#1565C0'],
                  ['hc_g', 'Hidratos (g)', '#F57F17'],
                  ['fat_g', 'Grasas (g)', '#C62828'],
                ] as const).map(([field, label, color]) => (
                  <Box key={field}>
                    <Typography sx={{ fontSize: 11, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.08em', mb: 0.5 }}>
                      {label}
                    </Typography>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      {...register(field, { valueAsNumber: true, min: 0 })}
                      style={{
                        width: '100%',
                        border: '1px solid rgba(195,199,208,0.4)',
                        borderRadius: 12,
                        background: '#f8f9ff',
                        fontFamily: '"Inter", sans-serif',
                        fontWeight: 700,
                        fontSize: 15,
                        color,
                        outline: 'none',
                        padding: '10px 14px',
                        boxSizing: 'border-box',
                      }}
                    />
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          {/* ── Instructions ── */}
          <Box sx={{ mb: 4 }}>
            <Typography sx={fieldLabel}>Instrucciones de preparación</Typography>
            <TextField
              multiline
              rows={6}
              fullWidth
              placeholder="Describe los pasos para cocinar esta delicia..."
              {...register('instructions_text')}
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'background.paper',
                  borderRadius: '24px',
                  fontFamily: '"Inter", sans-serif',
                  lineHeight: 1.6,
                  '& fieldset': { border: '1px solid rgba(195,199,208,0.4)' },
                  '&:hover fieldset': { border: '1px solid rgba(0,130,253,0.3)' },
                  '&.Mui-focused fieldset': { border: '2px solid #4da8ff' },
                },
                '& textarea': { padding: '20px' },
              }}
            />
          </Box>

          {/* ── External link ── */}
          <Box sx={{ mb: 4 }}>
            <Typography sx={fieldLabel}>Enlace externo</Typography>
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
              <TextField
                fullWidth
                placeholder="https://..."
                {...register('external_url')}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'background.paper',
                    borderRadius: '16px',
                    fontFamily: '"Lexend", sans-serif',
                    '& fieldset': { border: '1px solid rgba(195,199,208,0.4)' },
                    '&:hover fieldset': { border: '1px solid rgba(104,84,141,0.3)' },
                    '&.Mui-focused fieldset': { border: '2px solid rgba(104,84,141,0.5)' },
                  },
                }}
                inputProps={{ style: { fontFamily: '"Lexend", sans-serif', fontWeight: 400, padding: '16px 20px' } }}
              />
              <Button
                onClick={handleScrapeUrl}
                disabled={scrapeLoading || !watchedExternalUrl.trim()}
                startIcon={
                  scrapeLoading
                    ? <CircularProgress size={16} color="inherit" />
                    : <AutoFixHighIcon />
                }
                sx={{
                  minWidth: 120,
                  height: 56,
                  borderRadius: '16px',
                  fontFamily: '"Inter", sans-serif',
                  fontWeight: 700,
                  fontSize: 13,
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  background: scrapeLoading
                    ? '#c3c7d0'
                    : 'linear-gradient(135deg, #7c5cbf 0%, #4a2d8a 100%)',
                  color: 'white',
                  boxShadow: scrapeLoading ? 'none' : '0 4px 14px rgba(104,84,141,0.35)',
                  '&:hover': { background: 'linear-gradient(135deg, #8f6fd4 0%, #5a3da0 100%)' },
                  '&.Mui-disabled': { background: '#c3c7d0', color: 'white' },
                }}
              >
                {scrapeLoading ? 'Generando…' : 'Generar'}
              </Button>
            </Box>
            {scrapeError && (
              <Alert severity="error" sx={{ mt: 1.5, borderRadius: 2, fontFamily: '"Inter", sans-serif' }}>
                {scrapeError}
              </Alert>
            )}
          </Box>

          {submitError && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>{submitError}</Alert>
          )}
        </Box>
      </Box>

      {/* ── Sticky save button ── */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          bgcolor: 'rgba(248,249,255,0.95)',
          backdropFilter: 'blur(12px)',
          px: 3,
          pt: 2,
          pb: 3,
          boxShadow: '0 -4px 24px rgba(0,130,253,0.08)',
        }}
      >
        <Box sx={{ maxWidth: 640, mx: 'auto' }}>
          <Button
            fullWidth
            type="submit"
            form="recipe-form"
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            startIcon={
              isSubmitting
                ? <CircularProgress size={20} color="inherit" />
                : <CheckCircleIcon />
            }
            sx={{
              background: 'linear-gradient(135deg, #4da8ff 0%, #005cb2 100%)',
              borderRadius: '16px',
              py: 2,
              fontSize: 16,
              fontFamily: '"Inter", sans-serif',
              fontWeight: 900,
              color: 'white',
              boxShadow: '0 8px 24px rgba(0,130,253,0.3)',
              '&:hover': { background: 'linear-gradient(135deg, #0a521a 0%, #256229 100%)' },
              '&.Mui-disabled': { background: '#c3c7d0', color: 'white' },
            }}
          >
            Guardar receta
          </Button>
        </Box>
      </Box>

      {/* Unit weight definition dialog */}
      <Dialog
        open={Boolean(unitWeightDialog?.open)}
        onClose={() => setUnitWeightDialog(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontFamily: '"Inter", sans-serif', fontWeight: 700 }}>
          Definir peso por unidad
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2, fontSize: 14, color: 'text.secondary' }}>
            ¿Cuántos gramos pesa 1 unidad de <strong>{unitWeightDialog?.ingredientName}</strong>?
          </Typography>
          <TextField
            autoFocus
            fullWidth
            type="number"
            label="Gramos por unidad"
            value={unitWeightDialog?.gramsInput ?? ''}
            onChange={(e) =>
              setUnitWeightDialog((d) => d ? { ...d, gramsInput: e.target.value } : null)
            }
            inputProps={{ min: 1, step: 0.5 }}
            size="small"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUnitWeightDialog(null)}>Cancelar</Button>
          <Button
            variant="contained"
            disabled={!unitWeightDialog?.gramsInput || parseFloat(unitWeightDialog.gramsInput) <= 0}
            onClick={async () => {
              if (!unitWeightDialog) return
              await createUnitWeight({
                ingredient_name: unitWeightDialog.ingredientName,
                grams_per_unit: parseFloat(unitWeightDialog.gramsInput),
              })
              setUnitWeightDialog(null)
            }}
            sx={{ borderRadius: 100 }}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  )
}

export default RecipeForm
