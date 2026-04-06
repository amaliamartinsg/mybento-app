import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import EditIcon from '@mui/icons-material/Edit'
import LaunchIcon from '@mui/icons-material/Launch'
import RestaurantIcon from '@mui/icons-material/Restaurant'
import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import type { Recipe } from '../types/recipe'

interface Props {
  open: boolean
  recipe: Recipe | null
  onClose: () => void
  onEdit: (recipe: Recipe) => void
}

const MACROS = [
  { key: 'kcal', label: 'kcal/r', color: '#68548d', bg: 'rgba(104,84,141,0.1)', fmt: (r: Recipe) => `${Math.round(r.kcal)}` },
  { key: 'prot', label: 'Prot/r', color: '#21638d', bg: 'rgba(33,99,141,0.1)', fmt: (r: Recipe) => `${Math.round(r.prot_g)}g` },
  { key: 'hc', label: 'HC/r', color: '#b56a00', bg: 'rgba(181,106,0,0.1)', fmt: (r: Recipe) => `${Math.round(r.hc_g)}g` },
  { key: 'fat', label: 'Grasas/r', color: '#b3261e', bg: 'rgba(179,38,30,0.1)', fmt: (r: Recipe) => `${Math.round(r.fat_g)}g` },
]

function RecipeDetailDialog({ open, recipe, onClose, onEdit }: Props) {
  if (!recipe) return null

  return (
    <Dialog open={open} onClose={onClose} fullScreen>
      <AppBar sx={{ position: 'relative', boxShadow: 'none' }}>
        <Toolbar sx={{ height: 56, minHeight: '56px !important', px: 2, gap: 1 }}>
          <IconButton edge="start" color="inherit" onClick={onClose}>
            <ArrowBackIcon />
          </IconButton>
          <Typography
            sx={{ flex: 1, fontFamily: '"Lexend", sans-serif', fontWeight: 700, fontSize: 17, letterSpacing: '-0.01em' }}
            noWrap
          >
            {recipe.name}
          </Typography>
          <IconButton color="inherit" onClick={() => onEdit(recipe)} aria-label="Editar">
            <EditIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box sx={{ bgcolor: 'background.default', minHeight: '100%', overflowY: 'auto' }}>
        <Box sx={{ position: 'relative', height: 260, overflow: 'hidden', bgcolor: 'rgba(104,84,141,0.06)' }}>
          {recipe.image_url ? (
            <Box
              component="img"
              src={recipe.image_url}
              alt={recipe.name}
              sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          ) : (
            <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <RestaurantIcon sx={{ fontSize: 72, color: 'rgba(104,84,141,0.2)' }} />
            </Box>
          )}
        </Box>

        <Box sx={{ maxWidth: 640, mx: 'auto', px: 3, pt: 3, pb: 8 }}>
          <Typography
            sx={{ fontFamily: '"Lexend", sans-serif', fontWeight: 800, fontSize: 26, letterSpacing: '-0.02em', color: 'text.primary', mb: 0.5 }}
          >
            {recipe.name}
          </Typography>
          <Typography sx={{ fontSize: 13, color: 'text.secondary', mb: 3 }}>
            {recipe.servings} {recipe.servings === 1 ? 'ración' : 'raciones'} · macros por ración
          </Typography>

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
            {MACROS.map(({ key, label, color, bg, fmt }) => (
              <Box
                key={key}
                sx={{
                  bgcolor: bg,
                  color,
                  px: 2,
                  py: 1,
                  borderRadius: 100,
                  fontSize: 13,
                  fontWeight: 700,
                  fontFamily: '"Lexend", sans-serif',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 0,
                  minWidth: 64,
                }}
              >
                <span style={{ fontSize: 16, fontWeight: 800 }}>{fmt(recipe)}</span>
                <span style={{ fontSize: 10, fontWeight: 600, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
              </Box>
            ))}
          </Box>

          {recipe.external_url && (
            <Button
              component="a"
              href={recipe.external_url}
              target="_blank"
              rel="noopener noreferrer"
              variant="outlined"
              startIcon={<LaunchIcon />}
              sx={{
                mb: 3,
                borderRadius: 100,
                textTransform: 'none',
                fontFamily: '"Lexend", sans-serif',
                fontWeight: 600,
                borderColor: 'rgba(104,84,141,0.35)',
                color: 'primary.main',
                '&:hover': { borderColor: 'primary.main', bgcolor: 'rgba(104,84,141,0.06)' },
              }}
            >
              Ver receta original
            </Button>
          )}

          <Divider sx={{ mb: 3 }} />

          <Typography
            sx={{ fontFamily: '"Lexend", sans-serif', fontWeight: 700, fontSize: 18, color: 'text.primary', mb: 2 }}
          >
            Ingredientes
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 4 }}>
            {recipe.ingredients.map((ing) => (
              <Box
                key={ing.id}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  px: 2,
                  py: 1.25,
                  bgcolor: 'background.paper',
                  borderRadius: 2,
                }}
              >
                <Typography sx={{ fontWeight: 500, color: 'text.primary', fontSize: 14 }}>
                  {ing.name}
                </Typography>
                <Typography sx={{ fontWeight: 700, color: 'text.secondary', fontSize: 13, fontFamily: '"Lexend", sans-serif' }}>
                  {ing.quantity_g}g
                </Typography>
              </Box>
            ))}
          </Box>

          {recipe.instructions_text && (
            <>
              <Divider sx={{ mb: 3 }} />
              <Typography
                sx={{ fontFamily: '"Lexend", sans-serif', fontWeight: 700, fontSize: 18, color: 'text.primary', mb: 2 }}
              >
                Preparación
              </Typography>
              <Typography
                sx={{ color: 'text.secondary', lineHeight: 1.8, fontSize: 15, whiteSpace: 'pre-line' }}
              >
                {recipe.instructions_text}
              </Typography>
            </>
          )}
        </Box>
      </Box>
    </Dialog>
  )
}

export default RecipeDetailDialog
