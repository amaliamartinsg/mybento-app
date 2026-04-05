import { createTheme } from '@mui/material/styles'
import type { PaletteMode } from '@mui/material'

// ─── Culinary Atelier — Design Tokens ─────────────────────────────────────────
//
// Light:  surface #fef7fd · primary #68548d · secondary #21638d
// Dark:   surface #141218 · primary #d0bcff · secondary #86cce3
//
// No 1px borders — depth via tonal layering.
// Ambient shadows: blur 32-48px, opacity 4-6%.
// Primary CTAs: gradient #68548d → #b39ddb (velvet feel).

export function createAppTheme(mode: PaletteMode) {
  const light = mode === 'light'

  return createTheme({
    palette: {
      mode,
      primary: {
        main:         light ? '#68548d' : '#d0bcff',
        light:        light ? '#b39ddb' : '#e9ddff',
        dark:         light ? '#4a3870' : '#a98edd',
        contrastText: light ? '#ffffff' : '#381e72',
      },
      secondary: {
        main:         light ? '#21638d' : '#86cce3',
        light:        light ? '#5b9dbf' : '#b3e5f5',
        dark:         light ? '#0d4a6e' : '#4fa8c5',
        contrastText: light ? '#ffffff' : '#003549',
      },
      background: {
        default: light ? '#fef7fd' : '#141218',   // surface
        paper:   light ? '#ffffff' : '#1d1b20',   // surface_container_lowest
      },
      text: {
        primary:   light ? '#1d1b1f' : '#e6e0e9', // on_surface
        secondary: light ? '#49454e' : '#cac4d0', // on_surface_variant
      },
      divider: light ? 'rgba(121,116,126,0.15)' : 'rgba(202,196,208,0.12)',
      error: {
        main: light ? '#b3261e' : '#f2b8b5',
      },
    },

    typography: {
      fontFamily: '"Lexend", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: { fontWeight: 700, letterSpacing: '-0.02em' },
      h2: { fontWeight: 700, letterSpacing: '-0.02em' },
      h3: { fontWeight: 700, letterSpacing: '-0.02em' },
      h4: { fontWeight: 700 },
      h5: { fontWeight: 700 },
      h6: { fontWeight: 700 },
      body1: { lineHeight: 1.6 },
      body2: { lineHeight: 1.6 },
    },

    shape: {
      borderRadius: 12,
    },

    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            // Tonal lift — no shadow, just surface_container_lowest on surface_container_low
            boxShadow: 'none',
            backgroundColor: light ? '#ffffff' : '#1d1b20',
          },
        },
      },

      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            textTransform: 'none',
            fontWeight: 600,
            fontFamily: '"Lexend", sans-serif',
            boxShadow: 'none',
          },
          // Primary CTA: velvet gradient
          containedPrimary: {
            background: light
              ? 'linear-gradient(135deg, #68548d 0%, #b39ddb 100%)'
              : 'linear-gradient(135deg, #a98edd 0%, #d0bcff 100%)',
            color: light ? '#ffffff' : '#381e72',
            '&:hover': {
              background: light
                ? 'linear-gradient(135deg, #4a3870 0%, #9c87c9 100%)'
                : 'linear-gradient(135deg, #9178cc 0%, #c3aff5 100%)',
              boxShadow: `0 8px 32px rgba(${light ? '104,84,141' : '208,188,255'},0.25)`,
            },
            '&.Mui-disabled': {
              background: light ? '#e6dff1' : '#3a3540',
              color: light ? '#9e99a3' : '#6b6570',
            },
          },
          // Secondary: surface with tinted text
          containedSecondary: {
            backgroundColor: light ? '#d7ecf8' : '#003549',
            color: light ? '#0d4a6e' : '#86cce3',
            boxShadow: 'none',
            '&:hover': {
              backgroundColor: light ? '#c3dff0' : '#01455e',
              boxShadow: 'none',
            },
          },
          outlined: {
            borderColor: light ? 'rgba(121,116,126,0.3)' : 'rgba(202,196,208,0.3)',
          },
        },
      },

      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 20,
            fontFamily: '"Lexend", sans-serif',
            fontWeight: 500,
            border: 'none',
            // Default (unselected): secondary_fixed tint
            backgroundColor: light ? '#dae8f5' : '#1a3545',
            color: light ? '#21638d' : '#86cce3',
            // Primary color variant: primary_fixed tint
            '&.MuiChip-colorPrimary': {
              backgroundColor: light ? '#e8dff8' : '#2e1f50',
              color: light ? '#68548d' : '#d0bcff',
            },
          },
        },
      },

      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },

      MuiSlider: {
        styleOverrides: {
          root: { height: 6 },
          thumb: { width: 18, height: 18 },
          track: { borderRadius: 100 },
          rail: {
            borderRadius: 100,
            opacity: 1,
            backgroundColor: light ? '#e8dff8' : '#3a3540',
          },
        },
      },

      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 8,
              // surface_container_high
              backgroundColor: light ? '#ece6f0' : '#2b2831',
              '& fieldset': { border: 'none' },
              '&:hover fieldset': { border: 'none' },
              // Ghost border on focus
              '&.Mui-focused': {
                backgroundColor: light ? '#e6dff1' : '#322e3a',
              },
              '&.Mui-focused fieldset': {
                border: `2px solid rgba(${light ? '104,84,141' : '208,188,255'},0.5)`,
              },
            },
          },
        },
      },

      MuiSelect: {
        styleOverrides: {
          root: { borderRadius: 8 },
        },
      },

      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 24,
            // Ambient shadow
            boxShadow: light
              ? '0 8px 48px rgba(73,69,78,0.06)'
              : '0 8px 48px rgba(0,0,0,0.4)',
          },
        },
      },

      MuiToggleButton: {
        styleOverrides: {
          root: {
            borderRadius: '8px !important',
            textTransform: 'none',
            fontWeight: 600,
            fontFamily: '"Lexend", sans-serif',
            border: 'none',
            color: light ? '#49454e' : '#cac4d0',
            '&.Mui-selected': {
              backgroundColor: light ? '#e8dff8' : '#2e1f50',
              color: light ? '#68548d' : '#d0bcff',
              '&:hover': {
                backgroundColor: light ? '#ddd5f2' : '#3a2860',
              },
            },
          },
        },
      },

      MuiToggleButtonGroup: {
        styleOverrides: {
          root: {
            backgroundColor: light ? '#f8f2f7' : '#1d1b20',
            borderRadius: 12,
            padding: 4,
            gap: 2,
          },
        },
      },

      MuiAppBar: {
        styleOverrides: {
          root: {
            // Glassmorphism top bar
            backgroundColor: light
              ? 'rgba(254,247,253,0.70)'
              : 'rgba(20,18,24,0.70)',
            backdropFilter: 'blur(20px)',
            boxShadow: 'none',
            color: light ? '#1d1b1f' : '#e6e0e9',
          },
        },
      },

      MuiDivider: {
        styleOverrides: {
          root: {
            borderColor: light
              ? 'rgba(121,116,126,0.12)'
              : 'rgba(202,196,208,0.10)',
          },
        },
      },
    },
  })
}

export default createAppTheme('light')
