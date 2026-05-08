const TOKEN_STORAGE_KEY = 'transport_auth_token'
const USER_STORAGE_KEY = 'transport_auth_user'

export function getStoredAuthToken() {
  if (typeof window === 'undefined') {
    return ''
  }

  return window.localStorage.getItem(TOKEN_STORAGE_KEY) ?? ''
}

export function getStoredAuthUser() {
  if (typeof window === 'undefined') {
    return null
  }

  const rawUser = window.localStorage.getItem(USER_STORAGE_KEY)

  if (!rawUser) {
    return null
  }

  try {
    return JSON.parse(rawUser)
  } catch {
    window.localStorage.removeItem(USER_STORAGE_KEY)
    return null
  }
}

export function persistAuthSession(token, user) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(TOKEN_STORAGE_KEY, token)
  window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
}

export function clearAuthSession() {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem(TOKEN_STORAGE_KEY)
  window.localStorage.removeItem(USER_STORAGE_KEY)
}
