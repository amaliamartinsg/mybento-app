import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import RestaurantIcon from '@mui/icons-material/Restaurant'
import type { Recipe } from '../types/recipe'

interface RecipeCardProps {
  recipe: Recipe
  subcategoryName?: string
  onEdit: (recipe: Recipe) => void
  onDelete: (recipe: Recipe) => void
  onView: (recipe: Recipe) => void
}

function RecipeCard({ recipe, subcategoryName, onEdit, onDelete, onView }: RecipeCardProps) {
  return (
    <Box
      onClick={() => onView(recipe)}
      sx={{
        borderRadius: '24px',
        overflow: 'hidden',
        bgcolor: 'background.paper',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        transition: 'box-shadow 0.2s',
        cursor: 'pointer',
        '&:hover': { boxShadow: '0 6px 20px rgba(0,0,0,0.12)' },
        '&:hover .recipe-actions': { opacity: 1 },
      }}
    >
      {/* Image area */}
      <Box sx={{ position: 'relative', height: 208, overflow: 'hidden' }}>
        {recipe.image_url ? (
          <Box
            component="img"
            src={recipe.image_url}
            alt={recipe.name}
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'transform 0.5s',
              display: 'block',
              '.MuiBox-root:hover &': { transform: 'scale(1.08)' },
            }}
          />
        ) : (
          <Box
            sx={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: '#eef2ff',
            }}
          >
            <RestaurantIcon sx={{ fontSize: 56, color: '#c3c7d0' }} />
          </Box>
        )}

        {/* Kcal badge */}
        <Box
          sx={{
            position: 'absolute',
            top: 12,
            right: 12,
            bgcolor: 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(8px)',
            px: 1.5,
            py: 0.5,
            borderRadius: 100,
            fontSize: 12,
            fontWeight: 700,
            color: '#4da8ff',
            lineHeight: 1.4,
            fontFamily: '"Inter", sans-serif',
          }}
        >
          {Math.round(recipe.kcal)} kcal
        </Box>

        {/* Edit / Delete on hover */}
        <Box
          className="recipe-actions"
          sx={{
            position: 'absolute',
            top: 8,
            left: 8,
            display: 'flex',
            gap: 0.5,
            opacity: 0,
            transition: 'opacity 0.2s',
          }}
        >
          <IconButton
            size="small"
            onClick={(e) => { e.stopPropagation(); onEdit(recipe) }}
            aria-label="Editar receta"
            sx={{ bgcolor: 'rgba(255,255,255,0.9)', '&:hover': { bgcolor: 'white' } }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={(e) => { e.stopPropagation(); onDelete(recipe) }}
            aria-label="Eliminar receta"
            sx={{ bgcolor: 'rgba(255,255,255,0.9)', '&:hover': { bgcolor: 'white' }, color: 'error.main' }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      {/* Card content */}
      <Box sx={{ p: 3 }}>
        {subcategoryName && (
          <Typography
            sx={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: 'text.secondary',
              mb: 0.5,
              fontFamily: '"Inter", sans-serif',
            }}
          >
            {subcategoryName}
          </Typography>
        )}
        <Typography
          title={recipe.name}
          sx={{
            fontFamily: '"Inter", sans-serif',
            fontWeight: 800,
            fontSize: 18,
            lineHeight: 1.25,
            color: 'text.primary',
            mb: 2,
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {recipe.name}
        </Typography>

        {/* Macro tags */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          <Box
            sx={{
              bgcolor: 'rgba(21,101,192,0.1)',
              color: '#1565C0',
              px: 1.5,
              py: 0.5,
              borderRadius: 1.5,
              fontSize: 11,
              fontWeight: 700,
              fontFamily: '"Inter", sans-serif',
            }}
          >
            P: {Math.round(recipe.prot_g)}g
          </Box>
          <Box
            sx={{
              bgcolor: 'rgba(245,127,23,0.1)',
              color: '#F57F17',
              px: 1.5,
              py: 0.5,
              borderRadius: 1.5,
              fontSize: 11,
              fontWeight: 700,
              fontFamily: '"Inter", sans-serif',
            }}
          >
            HC: {Math.round(recipe.hc_g)}g
          </Box>
          <Box
            sx={{
              bgcolor: 'rgba(198,40,40,0.1)',
              color: '#C62828',
              px: 1.5,
              py: 0.5,
              borderRadius: 1.5,
              fontSize: 11,
              fontWeight: 700,
              fontFamily: '"Inter", sans-serif',
            }}
          >
            G: {Math.round(recipe.fat_g)}g
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

export default RecipeCard
