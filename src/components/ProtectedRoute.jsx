import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { usePermissions } from '../hooks/usePermissions';
import AccessDenied from './AccessDenied';

const ProtectedRoute = ({ children, requiredPermission = null }) => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { canAccessRoute, getMenuItems, loading: permissionsLoading } = usePermissions();
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
    const tienePermisos = canAccessRoute(location.pathname);
    
    if (!tienePermisos) {
      // Mostrar página de acceso denegado con lógica de redirección inteligente
      return <AccessDenied />;
    }
  }

  // Si está autenticado y tiene permisos, mostrar el componente protegido
  return children;
};

export default ProtectedRoute;
