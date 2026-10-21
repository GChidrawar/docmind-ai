import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

/** Renders nested routes for signed-in users; everyone else goes to /login. */
export default function ProtectedRoute() {
  const signedIn = useAuthStore((s) => !!s.session?.token)
  const location = useLocation()
  return signedIn ? <Outlet /> : <Navigate to="/login" replace state={{ from: location.pathname }} />
}
