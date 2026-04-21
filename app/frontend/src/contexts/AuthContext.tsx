import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMeApi, loginApi, registerApi, type UserPublic } from '../api/auth'

const TOKEN_KEY = 'mb_token'

interface AuthContextValue {
  user: UserPublic | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name?: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY))
  const [user, setUser] = useState<UserPublic | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!token) {
      setIsLoading(false)
      return
    }
    getMeApi(token)
      .then(setUser)
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY)
        setToken(null)
      })
      .finally(() => setIsLoading(false))
  }, [token])

  const _saveToken = useCallback((t: string) => {
    localStorage.setItem(TOKEN_KEY, t)
    setToken(t)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const { access_token } = await loginApi(email, password)
    _saveToken(access_token)
    const me = await getMeApi(access_token)
    setUser(me)
    navigate('/')
  }, [_saveToken, navigate])

  const register = useCallback(async (email: string, password: string, name?: string) => {
    const { access_token } = await registerApi(email, password, name)
    _saveToken(access_token)
    const me = await getMeApi(access_token)
    setUser(me)
    navigate('/')
  }, [_saveToken, navigate])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    setToken(null)
    setUser(null)
    navigate('/login')
  }, [navigate])

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
