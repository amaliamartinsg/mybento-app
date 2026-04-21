import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import type { PaletteMode } from '@mui/material'
import App from './App'
import { createAppTheme } from './theme'
import { AuthProvider } from './contexts/AuthContext'

export const ColorModeContext = React.createContext({ toggleColorMode: () => {} })

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000 } },
})

function Root() {
  const [mode, setMode] = React.useState<PaletteMode>(
    () => (localStorage.getItem('colorMode') as PaletteMode) || 'light',
  )
  const colorMode = React.useMemo(
    () => ({
      toggleColorMode: () =>
        setMode((prev) => {
          const next = prev === 'light' ? 'dark' : 'light'
          localStorage.setItem('colorMode', next)
          return next
        }),
    }),
    [],
  )
  const theme = React.useMemo(() => createAppTheme(mode), [mode])

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <AuthProvider>
              <App />
            </AuthProvider>
          </BrowserRouter>
        </QueryClientProvider>
      </ThemeProvider>
    </ColorModeContext.Provider>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
)
