import { useState, useEffect, useContext } from 'react'
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { useTheme } from '@mui/material/styles'
import Box from '@mui/material/Box'
import AppBar from '@mui/material/AppBar'
import IconButton from '@mui/material/IconButton'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import LightModeIcon from '@mui/icons-material/LightMode'
import RestaurantIcon from '@mui/icons-material/Restaurant'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import SettingsIcon from '@mui/icons-material/Settings'
import RecipesView from './views/RecipesView'
import MenuView from './views/MenuView'
import SettingsView from './views/SettingsView'
import { ColorModeContext } from './main'
import logoSimple from './assets/mybento-logo-simple.png'

const ROUTES = ['/', '/menu', '/settings']

const NAV_ITEMS = [
  { label: 'Recetas', Icon: RestaurantIcon },
  { label: 'Menú', Icon: CalendarMonthIcon },
  { label: 'Ajustes', Icon: SettingsIcon },
]

function App() {
  const location = useLocation()
  const navigate = useNavigate()
  const theme = useTheme()
  const colorMode = useContext(ColorModeContext)
  const [tabValue, setTabValue] = useState(0)
  const isDark = theme.palette.mode === 'dark'

  useEffect(() => {
    const idx = ROUTES.indexOf(location.pathname)
    if (idx !== -1) setTabValue(idx)
  }, [location.pathname])

  const handleTabChange = (newValue: number) => {
    setTabValue(newValue)
    navigate(ROUTES[newValue])
  }

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100dvh' }}>
      {/* Top App Bar */}
      <AppBar
        position="fixed"
        sx={{
          bgcolor: 'primary.main',
          boxShadow: 'none',
          top: 0,
          zIndex: 50,
          height: 56,
        }}
      >
        <Toolbar sx={{ height: 56, minHeight: '56px !important', px: 2 }}>
          {/* Left spacer — same width as the right icon button to keep logo centered */}
          <Box sx={{ width: 40 }} />

          {/* Centered logo */}
          <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Box
              component="img"
              src={logoSimple}
              alt="MyBento"
              onClick={() => { navigate('/'); setTabValue(0) }}
              sx={{
                height: 28,
                cursor: 'pointer',
                filter: 'brightness(0) invert(1)',
                userSelect: 'none',
                transition: 'opacity 0.15s',
                '&:hover': { opacity: 0.85 },
              }}
            />
          </Box>

          {/* Dark mode toggle */}
          <IconButton onClick={colorMode.toggleColorMode} color="inherit" size="small" sx={{ width: 40 }}>
            {isDark ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Main content */}
      <Box sx={{ pt: '56px', pb: '80px', minHeight: '100dvh', bgcolor: 'background.default' }}>
        <Routes>
          <Route path="/" element={<RecipesView />} />
          <Route path="/menu" element={<MenuView />} />
          <Route path="/settings" element={<SettingsView />} />
        </Routes>
      </Box>

      {/* Bottom Navigation */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          bgcolor: isDark ? 'rgba(30,32,37,0.92)' : 'rgba(200,215,255,0.85)',
          backdropFilter: 'blur(20px)',
          borderTopLeftRadius: 32,
          borderTopRightRadius: 32,
          boxShadow: '0 -4px 24px rgba(0,130,253,0.06)',
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          px: 2,
          py: 1.5,
        }}
      >
        {NAV_ITEMS.map(({ label, Icon }, idx) => {
          const active = tabValue === idx
          return (
            <Box
              key={label}
              onClick={() => handleTabChange(idx)}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                px: 2.5,
                py: 0.75,
                borderRadius: 3,
                cursor: 'pointer',
                bgcolor: active ? 'primary.main' : 'transparent',
                color: active ? 'white' : 'text.primary',
                transition: 'all 0.2s',
                userSelect: 'none',
                '&:hover': {
                  bgcolor: active ? 'primary.main' : 'rgba(0,130,253,0.08)',
                },
              }}
            >
              <Icon sx={{ fontSize: 22 }} />
              <Typography
                sx={{
                  fontFamily: '"Inter", sans-serif',
                  fontWeight: 500,
                  fontSize: 11,
                  mt: 0.25,
                  lineHeight: 1,
                }}
              >
                {label}
              </Typography>
            </Box>
          )
        })}
      </Box>
    </Box>
  )
}

export default App
