import { useEffect, useState } from 'react'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import InputLabel from '@mui/material/InputLabel'
import FormControl from '@mui/material/FormControl'
import FormHelperText from '@mui/material/FormHelperText'
import IconButton from '@mui/material/IconButton'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import ImageSearchIcon from '@mui/icons-material/ImageSearch'
import CloseIcon from '@mui/icons-material/Close'
import ImageCarousel from '../components/ImageCarousel'
import { useCreateRecipe, useUpdateRecipe } from '../hooks/useRecipes'
import { searchImages } from '../api/recipes'
import type { Recipe, RecipeCreate, RecipeSuggestion } from '../types/recipe'
import type { Category } from '../types/category'

interface RecipeFormValues {
  name: string
  subcategory_id: string
  servings: number
  instructions_text: string
  image_url: string
  ingredients: { name: string; quantity_g: number }[]
}

interface RecipeFormProps {
  open: boolean
  onClose: (saved?: boolean) => void
  recipe?: Recipe | null
  prefill?: RecipeSuggestion | null
  categories: Category[]
}

function RecipeForm({ open, onClose, recipe, prefill, categories }: RecipeFormProps) {
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'))

  const createRecipe = useCreateRecipe()
  const updateRecipe = useUpdateRecipe()

  const [carouselImages, setCarouselImages] = useState<string[]>([])
  const [carouselLoading, setCarouselLoading] = useState(false)
  const [carouselError, setCarouselError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RecipeFormValues>({
    defaultValues: {
      name: '',
      subcategory_id: '',
      servings: 1,
      instructions_text: '',
      image_url: '',
      ingredients: [{ name: '', quantity_g: 100 }],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'ingredients' })

  const selectedImageUrl = watch('image_url')
  const recipeName = watch('name')

  // Selected category derived from subcategory_id
  const watchedSubcatId = watch('subcategory_id')
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('')

  useEffect(() => {
    if (!open) return
    setCarouselImages([])
    setCarouselError(null)
    setSubmitError(null)

    if (prefill) {
      reset({
        name: prefill.name,
        subcategory_id: '',
        servings: 1,
        instructions_text: prefill.instructions_text,
        image_url: '',
        ingredients: prefill.ingredients.map((i) => ({ name: i.name, quantity_g: i.quantity_g })),
      })
      setSelectedCategoryId('')
      return
    }

    if (recipe) {
      const subcat = recipe.subcategory_id ?? null
      const cat = subcat
        ? categories.find((c) => c.subcategories.some((s) => s.id === subcat))
        : null
      reset({
        name: recipe.name,
        subcategory_id: subcat !== null ? String(subcat) : '',
        servings: recipe.servings,
        instructions_text: recipe.instructions_text ?? '',
        image_url: recipe.image_url ?? '',
        ingredients:
          recipe.ingredients.length > 0
            ? recipe.ingredients.map((i) => ({ name: i.name, quantity_g: i.quantity_g }))
            : [{ name: '', quantity_g: 100 }],
      })
      setSelectedCategoryId(cat ? String(cat.id) : '')
      return
    }

    reset({
      name: '',
      subcategory_id: '',
      servings: 1,
      instructions_text: '',
      image_url: '',
      ingredients: [{ name: '', quantity_g: 100 }],
    })
    setSelectedCategoryId('')
  }, [open, recipe, prefill, categories, reset])

  // When category changes, reset subcategory
  const handleCategoryChange = (catId: string) => {
    setSelectedCategoryId(catId)
    setValue('subcategory_id', '')
  }

  const selectedCategory = categories.find((c) => String(c.id) === selectedCategoryId) ?? null

  const handleSearchImages = async () => {
    const query = recipeName.trim() || 'comida'
    setCarouselLoading(true)
    setCarouselError(null)
    try {
      const urls = await searchImages(query)
      setCarouselImages(urls)
    } catch (e) {
      setCarouselError((e as Error).message)
    } finally {
      setCarouselLoading(false)
    }
  }

  const onSubmit = async (values: RecipeFormValues) => {
    setSubmitError(null)
    const payload: RecipeCreate = {
      name: values.name.trim(),
      subcategory_id: values.subcategory_id ? Number(values.subcategory_id) : null,
      servings: values.servings,
      instructions_text: values.instructions_text.trim() || null,
      image_url: values.image_url.trim() || null,
      ingredients: values.ingredients.map((i) => ({
        name: i.name.trim(),
        quantity_g: Number(i.quantity_g),
      })),
    }

    try {
      if (recipe) {
        await updateRecipe.mutateAsync({ id: recipe.id, payload })
      } else {
        await createRecipe.mutateAsync(payload)
      }
      onClose(true)
    } catch (e) {
      setSubmitError((e as Error).message)
    }
  }

  return (
    <Dialog open={open} onClose={() => onClose()} fullScreen={fullScreen} fullWidth maxWidth="md">
      <DialogTitle sx={{ pr: 6 }}>
        {recipe ? 'Editar receta' : prefill ? 'Revisar receta sugerida' : 'Nueva receta'}
        <IconButton onClick={() => onClose()} sx={{ position: 'absolute', right: 8, top: 8 }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Box component="form" noValidate sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Name */}
          <TextField
            label="Nombre de la receta"
            fullWidth
            required
            {...register('name', { required: 'El nombre es obligatorio' })}
            error={!!errors.name}
            helperText={errors.name?.message}
          />

          {/* Category + Subcategory */}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <FormControl sx={{ minWidth: 160, flex: 1 }}>
              <InputLabel>Categoría</InputLabel>
              <Select
                value={selectedCategoryId}
                label="Categoría"
                onChange={(e) => handleCategoryChange(e.target.value)}
              >
                <MenuItem value="">— Sin categoría —</MenuItem>
                {categories.map((cat) => (
                  <MenuItem key={cat.id} value={String(cat.id)}>
                    {cat.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Controller
              control={control}
              name="subcategory_id"
              render={({ field }) => (
                <FormControl sx={{ minWidth: 160, flex: 1 }} disabled={!selectedCategory}>
                  <InputLabel>Subcategoría</InputLabel>
                  <Select {...field} label="Subcategoría">
                    <MenuItem value="">— Sin subcategoría —</MenuItem>
                    {selectedCategory?.subcategories.map((sub) => (
                      <MenuItem key={sub.id} value={String(sub.id)}>
                        {sub.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            />

            <TextField
              label="Raciones"
              type="number"
              sx={{ width: 100 }}
              inputProps={{ min: 1 }}
              {...register('servings', { min: 1, valueAsNumber: true })}
              error={!!errors.servings}
            />
          </Box>

          {/* Instructions */}
          <TextField
            label="Instrucciones"
            multiline
            rows={4}
            fullWidth
            {...register('instructions_text')}
          />

          <Divider />

          {/* Ingredients */}
          <Typography variant="subtitle2" fontWeight={600}>
            Ingredientes
          </Typography>
          {fields.map((field, index) => (
            <Box key={field.id} sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
              <TextField
                label="Nombre"
                sx={{ flex: 1 }}
                {...register(`ingredients.${index}.name`, { required: 'Obligatorio' })}
                error={!!errors.ingredients?.[index]?.name}
                helperText={errors.ingredients?.[index]?.name?.message}
              />
              <TextField
                label="Gramos"
                type="number"
                sx={{ width: 100 }}
                inputProps={{ min: 1 }}
                {...register(`ingredients.${index}.quantity_g`, {
                  required: true,
                  min: 1,
                  valueAsNumber: true,
                })}
                error={!!errors.ingredients?.[index]?.quantity_g}
              />
              <IconButton
                onClick={() => remove(index)}
                disabled={fields.length === 1}
                color="error"
                sx={{ mt: 0.5 }}
              >
                <DeleteIcon />
              </IconButton>
            </Box>
          ))}
          <Button
            startIcon={<AddIcon />}
            onClick={() => append({ name: '', quantity_g: 100 })}
            variant="outlined"
            size="small"
            sx={{ alignSelf: 'flex-start' }}
          >
            Añadir ingrediente
          </Button>
          {errors.ingredients && (
            <FormHelperText error>Añade al menos un ingrediente con nombre y cantidad.</FormHelperText>
          )}

          <Divider />

          {/* Image */}
          <Typography variant="subtitle2" fontWeight={600}>
            Imagen
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
            <TextField
              label="URL de imagen"
              fullWidth
              {...register('image_url')}
              placeholder="https://..."
            />
            <Button
              variant="outlined"
              startIcon={<ImageSearchIcon />}
              onClick={handleSearchImages}
              disabled={carouselLoading}
              sx={{ whiteSpace: 'nowrap', mt: 0.5 }}
            >
              {carouselLoading ? <CircularProgress size={16} /> : 'Buscar'}
            </Button>
          </Box>
          {carouselError && <Alert severity="error">{carouselError}</Alert>}
          {(carouselImages.length > 0 || carouselLoading) && (
            <ImageCarousel
              images={carouselImages}
              selectedUrl={selectedImageUrl}
              onSelect={(url) => setValue('image_url', url)}
              isLoading={carouselLoading}
            />
          )}

          {submitError && <Alert severity="error">{submitError}</Alert>}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={() => onClose()}>Cancelar</Button>
        <Button
          variant="contained"
          onClick={handleSubmit(onSubmit)}
          disabled={isSubmitting}
          startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : undefined}
        >
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default RecipeForm
