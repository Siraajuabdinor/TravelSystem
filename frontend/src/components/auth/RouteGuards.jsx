import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

function getDefaultAuthenticatedPath(user) {
  return user?.role === 'Admin' ? '/dashboard' : '/bookings'
}

function AuthLoadingScreen() {
  return (
    <div className="auth-layout auth-layout-centered">
      <div className="auth-card auth-card-compact">
        <h1>Checking your session...</h1>
        <p>Please wait while we verify your account.</p>
      </div>
    </div>
  )
}

export function ProtectedRoute() {
  const { authLoading, isAuthenticated } = useAuth()
  const location = useLocation()

  if (authLoading) {
    return <AuthLoadingScreen />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}

export function GuestRoute() {
  const { authLoading, isAuthenticated, user } = useAuth()

  if (authLoading) {
    return <AuthLoadingScreen />
  }

  if (isAuthenticated) {
    return <Navigate to={getDefaultAuthenticatedPath(user)} replace />
  }

  return <Outlet />
}

export function RoleRoute({ allowedRoles }) {
  const { authLoading, isAuthenticated, user } = useAuth()

  if (authLoading) {
    return <AuthLoadingScreen />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (!allowedRoles.includes(user?.role)) {
    return <Navigate to={getDefaultAuthenticatedPath(user)} replace />
  }

  return <Outlet />
}
