import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { usePermissions } from '../hooks/usePermissions';
import AccessDenied from './AccessDenied';
import NotFound from './NotFound';

const ProtectedRoute = ({ children, requiredPermission = null }) => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { canAccessRoute, isRouteValid, getMenuItems, loading: permissionsLoading } = usePermissions();
  const location = useLocation();

  // Mostrar loading mientras se verifican las credenciales
  if (authLoading || permissionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando sesión y permisos...</p>
        </div>
      </div>
    );
  }

  // Si no está autenticado, redirigir al login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Verificar permisos para todas las rutas (excepto login)
  if (location.pathname !== '/login') {
    // Si no es una ruta válida del sistema, mostrar 404 inmediatamente
    if (!isRouteValid(location.pathname)) {
      return <NotFound />;
    }
    
    // Solo verificar permisos si no estamos cargando
    if (!permissionsLoading) {
      const tienePermisos = canAccessRoute(location.pathname);
      
      // Si no tiene permisos para una ruta válida, mostrar acceso denegado
      if (!tienePermisos) {
        return <AccessDenied />;
      }
    }
  }
  // Si está autenticado y tiene permisos, mostrar el componente protegido
  return children;
};

export default ProtectedRoute;
