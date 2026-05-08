import { Navigate, Route, Routes } from 'react-router-dom';
import AppShell from './layout/AppShell';
import DashboardPage from './pages/DashboardPage';
import BookingsPage from './pages/BookingsPage';
import CitiesPage from './pages/CitiesPage';
import DriversPage from './pages/DriversPage';
import TripsPage from './pages/TripsPage';
import VehicleDriversPage from './pages/VehicleDriversPage';
import VehiclesPage from './pages/VehiclesPage';
import RoutesPage from './pages/RoutesPage';
import UsersPage from './pages/UsersPage';
import LoginPage from './pages/LoginPage';
import { GuestRoute, ProtectedRoute, RoleRoute } from './components/auth/RouteGuards';
import { useAuth } from './hooks/useAuth';

function RootRedirect() {
  const { authLoading, isAuthenticated, user } = useAuth()

  if (authLoading) {
    return null
  }

  return <Navigate to={isAuthenticated ? (user?.role === 'Admin' ? '/dashboard' : '/bookings') : '/login'} replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />

      <Route element={<GuestRoute />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/bookings" element={<BookingsPage />} />
          <Route element={<RoleRoute allowedRoles={['Admin']} />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/trips" element={<TripsPage />} />
            <Route path="/cities" element={<CitiesPage />} />
            <Route path="/vehicles" element={<VehiclesPage />} />
            <Route path="/routes" element={<RoutesPage />} />
            <Route path="/drivers" element={<DriversPage />} />
            <Route path="/vehicle-drivers" element={<VehicleDriversPage />} />
            <Route path="/users" element={<UsersPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
