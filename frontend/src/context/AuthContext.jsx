import { useEffect, useMemo, useState } from 'react'
import { authService } from '../services/authService'
import { AuthContext } from './authContextValue'
import {
  clearAuthSession,
  getStoredAuthToken,
  getStoredAuthUser,
  persistAuthSession,
} from '../services/authStorage'

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getStoredAuthToken())
  const [user, setUser] = useState(() => getStoredAuthUser())
  const [authLoading, setAuthLoading] = useState(() => Boolean(getStoredAuthToken()))

  useEffect(() => {
    async function restoreSession() {
      if (!token) {
        setAuthLoading(false)
        return
      }

      setAuthLoading(true)

      try {
        const currentUser = await authService.me()
        setUser(currentUser)
        persistAuthSession(token, currentUser)
      } catch {
        clearAuthSession()
        setToken('')
        setUser(null)
      } finally {
        setAuthLoading(false)
      }
    }

    restoreSession()
  }, [token])

  async function login(credentials) {
    const result = await authService.login(credentials)

    setToken(result.token)
    setUser(result.user)
    persistAuthSession(result.token, result.user)

    return result
  }

  function logout() {
    clearAuthSession()
    setToken('')
    setUser(null)
  }

  const value = useMemo(
    () => ({
      token,
      user,
      authLoading,
      isAuthenticated: Boolean(token && user),
      login,
      logout,
    }),
    [token, user, authLoading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
