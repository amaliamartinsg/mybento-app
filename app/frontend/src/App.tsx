import React, { useState, useEffect, useContext } from 'react'
import { Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom'
import { useTheme } from '@mui/material/styles'
import Box from '@mui/material/Box'
import AppBar from '@mui/material/AppBar'
import IconButton from '@mui/material/IconButton'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import ListItemIcon from '@mui/material/ListItemIcon'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import LightModeIcon from '@mui/icons-material/LightMode'
import AccountCircleIcon from '@mui/icons-material/AccountCircle'
import LogoutIcon from '@mui/icons-material/Logout'
import RestaurantIcon from '@mui/icons-material/Restaurant'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import SettingsIcon from '@mui/icons-material/Settings'
import RecipesView from './views/RecipesView'
import MenuView from './views/MenuView'
import SettingsView from './views/SettingsView'
import LoginView from './views/LoginView'
import { ColorModeContext } from './main'
import { useAuth } from './contexts/AuthContext'
import logoSimple from './assets/mybento-logo-simple.png'

const ROUTES = ['/', '/menu', '/settings']

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) return null
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

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
  const { logout, user } = useAuth()
  const [tabValue, setTabValue] = useState(0)
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null)
  const isDark = theme.palette.mode === 'dark'
  const isLoginPage = location.pathname === '/login'

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
      {/* Top App Bar — hidden on login page */}
      {!isLoginPage && (
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
            <Box sx={{ width: 40 }} />

            <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Box
                component="img"
                src={logoSimple}
                alt="MyBento"
                onClick={() => { navigate('/'); setTabValue(0) }}
                sx={{
                  height: 28,
                  cursor: 'pointer',
                  filter: 'invert(1)',
                  mixBlendMode: 'screen',
                  userSelect: 'none',
                  transition: 'opacity 0.15s',
                  '&:hover': { opacity: 0.85 },
                }}
              />
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <IconButton onClick={colorMode.toggleColorMode} color="inherit" size="small">
                {isDark ? <LightModeIcon /> : <DarkModeIcon />}
              </IconButton>
              <IconButton
                color="inherit"
                size="small"
                onClick={(e) => setUserMenuAnchor(e.currentTarget)}
              >
                <AccountCircleIcon />
              </IconButton>
            </Box>

            <Menu
              anchorEl={userMenuAnchor}
              open={Boolean(userMenuAnchor)}
              onClose={() => setUserMenuAnchor(null)}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              slotProps={{
                paper: {
                  sx: {
                    mt: 1,
                    borderRadius: 3,
                    minWidth: 200,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                    overflow: 'hidden',
                  },
                },
              }}
            >
              {user?.email && (
                <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Typography sx={{ fontSize: 11, fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {user.name ?? user.email}
                  </Typography>
                  {user.name && (
                    <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: 0.25 }}>
                      {user.email}
                    </Typography>
                  )}
                </Box>
              )}
              <MenuItem
                onClick={() => { setUserMenuAnchor(null); logout() }}
                sx={{
                  py: 1.5,
                  color: '#b3261e',
                  fontWeight: 600,
                  fontSize: 14,
                  '&:hover': {
                    bgcolor: 'rgba(179,38,30,0.08)',
                  },
                }}
              >
                <ListItemIcon sx={{ color: '#b3261e', minWidth: 36 }}>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                Cerrar sesión
              </MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>
      )}

      {/* Main content */}
      <Box sx={{
        pt: isLoginPage ? 0 : '56px',
        pb: isLoginPage ? 0 : '80px',
        minHeight: '100dvh',
        bgcolor: 'background.default',
      }}>
        <Routes>
          <Route path="/login" element={<LoginView />} />
          <Route path="/" element={<PrivateRoute><RecipesView /></PrivateRoute>} />
          <Route path="/menu" element={<PrivateRoute><MenuView /></PrivateRoute>} />
          <Route path="/settings" element={<PrivateRoute><SettingsView /></PrivateRoute>} />
        </Routes>
      </Box>

      {/* Bottom Navigation — hidden on login page */}
      {!isLoginPage && <Box
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
      </Box>}
    </Box>
  )
}

export default App
