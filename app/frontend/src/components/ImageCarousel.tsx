import CheckIcon from '@mui/icons-material/Check'
import Box from '@mui/material/Box'
import Skeleton from '@mui/material/Skeleton'

interface ImageCarouselProps {
  images: string[]
  selectedUrl: string | null
  onSelect: (url: string) => void
  isLoading?: boolean
}

function ImageCarousel({ images, selectedUrl, onSelect, isLoading }: ImageCarouselProps) {
  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          overflowX: 'auto',
          px: 3,
          py: 2,
          scrollSnapType: 'x mandatory',
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        }}
      >
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton
            key={i}
            variant="rectangular"
            width={128}
            height={176}
            sx={{ borderRadius: '16px', flexShrink: 0 }}
          />
        ))}
      </Box>
    )
  }

  if (images.length === 0) {
    return (
      <Box sx={{ px: 3, py: 3, color: '#6a769e', fontSize: 14 }}>
        No se encontraron imágenes.
      </Box>
    )
  }

  return (
    <Box
      sx={{
        display: 'flex',
        gap: 2,
        overflowX: 'auto',
        px: 3,
        py: 2,
        scrollSnapType: 'x mandatory',
        scrollbarWidth: 'none',
        '&::-webkit-scrollbar': { display: 'none' },
      }}
    >
      {images.map((url) => {
        const isSelected = selectedUrl === url
        return (
          <Box
            key={url}
            onClick={() => onSelect(url)}
            sx={{
              position: 'relative',
              width: 128,
              height: 176,
              flexShrink: 0,
              scrollSnapAlign: 'start',
              cursor: 'pointer',
              borderRadius: '16px',
              overflow: 'hidden',
              border: isSelected ? '3px solid #4da8ff' : '3px solid transparent',
              boxShadow: isSelected ? '0 0 0 3px rgba(0,130,253,0.25)' : 'none',
              transition: 'all 0.2s',
              filter: isSelected ? 'none' : 'grayscale(25%) brightness(0.97)',
              '&:hover': {
                filter: 'none',
                transform: 'scale(1.02)',
              },
            }}
          >
            <Box
              component="img"
              src={url}
              alt="Imagen de receta"
              sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
            {/* Selected checkmark overlay */}
            {isSelected && (
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  bgcolor: 'rgba(0,130,253,0.18)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    bgcolor: '#4da8ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                  }}
                >
                  <CheckIcon sx={{ color: 'white', fontSize: 18 }} />
                </Box>
              </Box>
            )}
          </Box>
        )
      })}
    </Box>
  )
}

export default ImageCarousel
