import Box from '@mui/material/Box'
import Skeleton from '@mui/material/Skeleton'
import Typography from '@mui/material/Typography'

interface ImageCarouselProps {
  images: string[]
  selectedUrl: string | null
  onSelect: (url: string) => void
  isLoading?: boolean
}

function ImageCarousel({ images, selectedUrl, onSelect, isLoading }: ImageCarouselProps) {
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', py: 1 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} variant="rectangular" width={120} height={80} sx={{ borderRadius: 1, flexShrink: 0 }} />
        ))}
      </Box>
    )
  }

  if (images.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
        No se encontraron imágenes.
      </Typography>
    )
  }

  return (
    <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', py: 1 }}>
      {images.map((url) => (
        <Box
          key={url}
          component="img"
          src={url}
          alt="Imagen de receta"
          onClick={() => onSelect(url)}
          sx={{
            width: 120,
            height: 80,
            objectFit: 'cover',
            borderRadius: 1,
            flexShrink: 0,
            cursor: 'pointer',
            border: '3px solid',
            borderColor: selectedUrl === url ? 'primary.main' : 'transparent',
            transition: 'border-color 0.15s',
            '&:hover': { opacity: 0.85 },
          }}
        />
      ))}
    </Box>
  )
}

export default ImageCarousel
