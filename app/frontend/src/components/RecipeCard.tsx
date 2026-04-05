import Card from '@mui/material/Card'
import CardMedia from '@mui/material/CardMedia'
import CardContent from '@mui/material/CardContent'
import CardActions from '@mui/material/CardActions'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Box from '@mui/material/Box'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import RestaurantIcon from '@mui/icons-material/Restaurant'
import type { Recipe } from '../types/recipe'

interface RecipeCardProps {
  recipe: Recipe
  subcategoryName?: string
  onEdit: (recipe: Recipe) => void
  onDelete: (recipe: Recipe) => void
}

function RecipeCard({ recipe, subcategoryName, onEdit, onDelete }: RecipeCardProps) {
  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        '&:hover .card-actions': { opacity: 1 },
      }}
    >
      {recipe.image_url ? (
        <CardMedia
          component="img"
          height="140"
          image={recipe.image_url}
          alt={recipe.name}
          sx={{ objectFit: 'cover' }}
        />
      ) : (
        <Box
          sx={{
            height: 140,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'action.hover',
          }}
        >
          <RestaurantIcon sx={{ fontSize: 48, color: 'text.disabled' }} />
        </Box>
      )}

      <CardContent sx={{ flexGrow: 1, pb: 0 }}>
        <Typography variant="subtitle1" fontWeight={600} noWrap title={recipe.name}>
          {recipe.name}
        </Typography>
        {subcategoryName && (
          <Typography variant="caption" color="text.secondary">
            {subcategoryName}
          </Typography>
        )}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
          <Chip label={`${Math.round(recipe.kcal)} kcal`} size="small" color="primary" variant="outlined" />
          <Chip label={`P: ${Math.round(recipe.prot_g)}g`} size="small" variant="outlined" />
          <Chip label={`HC: ${Math.round(recipe.hc_g)}g`} size="small" variant="outlined" />
          <Chip label={`G: ${Math.round(recipe.fat_g)}g`} size="small" variant="outlined" />
        </Box>
      </CardContent>

      <CardActions
        className="card-actions"
        sx={{
          justifyContent: 'flex-end',
          opacity: 0,
          transition: 'opacity 0.2s',
          pt: 0,
        }}
      >
        <IconButton size="small" onClick={() => onEdit(recipe)} aria-label="Editar receta">
          <EditIcon fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          onClick={() => onDelete(recipe)}
          aria-label="Eliminar receta"
          color="error"
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      </CardActions>
    </Card>
  )
}

export default RecipeCard
