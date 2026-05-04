import React, { useState, useEffect, useContext } from 'react'
import { Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom'
import { useTheme } from '@mui/material/styles'
import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import AccountCircleIcon from '@mui/icons-material/AccountCircle'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import CategoryIcon from '@mui/icons-material/Category'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter'
import LightModeIcon from '@mui/icons-material/LightMode'
import LogoutIcon from '@mui/icons-material/Logout'
import MenuIcon from '@mui/icons-material/Menu'
import PersonIcon from '@mui/icons-material/Person'
import RestaurantIcon from '@mui/icons-material/Restaurant'
import LandingView from './views/LandingView'
import LoginView from './views/LoginView'
import MenuView from './views/MenuView'
import RecipesView from './views/RecipesView'
import SettingsView from './views/SettingsView'
import { ColorModeContext } from './main'
import { useAuth } from './contexts/AuthContext'
import logoSimple from './assets/mybento-logo-simple.png'

const ROUTES = ['/recipes', '/menu']

const NAV_ITEMS = [
  { label: 'Recetas', Icon: RestaurantIcon },
  { label: 'Menú', Icon: CalendarMonthIcon },
]

const SETTINGS_ITEMS = [
  { label: 'Perfil', route: '/settings/profile', Icon: PersonIcon },
  { label: 'Categorías', route: '/settings/categories', Icon: CategoryIcon },
  { label: 'Pesos Unitarios', route: '/settings/unit-weights', Icon: FitnessCenterIcon },
]

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) return null
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

function App() {
  const location = useLocation()
  const navigate = useNavigate()
  const theme = useTheme()
  const colorMode = useContext(ColorModeContext)
  const { logout, user } = useAuth()
  const [tabValue, setTabValue] = useState(0)
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const isDark = theme.palette.mode === 'dark'
  const isLoginPage = location.pathname === '/login'
  const isLandingPage = location.pathname === '/'
  const hideShell = isLoginPage || isLandingPage

  useEffect(() => {
    const idx = ROUTES.indexOf(location.pathname)
    setTabValue(idx !== -1 ? idx : -1)
  }, [location.pathname])

  const handleTabChange = (newValue: number) => {
    setTabValue(newValue)
    navigate(ROUTES[newValue])
  }

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100dvh' }}>
      {/* Top App Bar — hidden on login and landing */}
      {!hideShell && (
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
            <IconButton
              color="inherit"
              size="small"
              onClick={() => setDrawerOpen(true)}
              aria-label="Abrir ajustes"
            >
              <MenuIcon />
            </IconButton>

            <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Box
                component="img"
                src={logoSimple}
                alt="MyBento"
                onClick={() => { navigate('/recipes'); setTabValue(0) }}
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
                  '&:hover': { bgcolor: 'rgba(179,38,30,0.08)' },
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

      {/* Settings Drawer */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: 260,
            pt: 2,
            borderTopRightRadius: 24,
            borderBottomRightRadius: 24,
          },
        }}
      >
        <Typography
          sx={{
            px: 2.5,
            pb: 1.5,
            fontWeight: 700,
            fontSize: 13,
            color: 'text.secondary',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          Ajustes
        </Typography>
        <List disablePadding>
          {SETTINGS_ITEMS.map(({ label, route, Icon }) => {
            const active = location.pathname === route
            return (
              <ListItemButton
                key={route}
                selected={active}
                onClick={() => { navigate(route); setDrawerOpen(false) }}
                sx={{
                  mx: 1,
                  borderRadius: 2,
                  mb: 0.5,
                  '&.Mui-selected': { bgcolor: 'rgba(0,130,253,0.1)', color: 'primary.main' },
                  '&.Mui-selected:hover': { bgcolor: 'rgba(0,130,253,0.15)' },
                }}
              >
                <ListItemIcon sx={{ minWidth: 36, color: active ? 'primary.main' : 'text.secondary' }}>
                  <Icon fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary={label}
                  primaryTypographyProps={{ fontWeight: active ? 700 : 500, fontSize: 15 }}
                />
              </ListItemButton>
            )
          })}
        </List>
      </Drawer>

      {/* Main content */}
      <Box sx={{
        pt: hideShell ? 0 : '56px',
        pb: hideShell ? 0 : '80px',
        minHeight: '100dvh',
        bgcolor: 'background.default',
      }}>
        <Routes>
          <Route path="/" element={<LandingView />} />
          <Route path="/login" element={<LoginView />} />
          <Route path="/recipes" element={<PrivateRoute><RecipesView /></PrivateRoute>} />
          <Route path="/menu" element={<PrivateRoute><MenuView /></PrivateRoute>} />
          <Route path="/settings/*" element={<PrivateRoute><SettingsView /></PrivateRoute>} />
        </Routes>
      </Box>

      {/* Bottom Navigation — hidden on login and landing */}
      {!hideShell && (
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
      )}
    </Box>
  )
}

export default App
