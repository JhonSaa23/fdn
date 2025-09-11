import { Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { usePermissions } from '../hooks/usePermissions';

const ProtectedRoute = ({ children, requiredPermission = null }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const { canAccessRoute, loading: permissionsLoading } = usePermissions();

  useEffect(() => {
    verificarSesion();
  }, []);

  const verificarSesion = () => {
    try {
      // Verificar si hay datos de usuario en localStorage
      const usuario = localStorage.getItem('usuario');
      const sesion = localStorage.getItem('sesion');
      
      if (!usuario || !sesion) {
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      const usuarioData = JSON.parse(usuario);
      const sesionData = JSON.parse(sesion);

      // Verificar si la sesión no ha expirado
      const ahora = new Date();
      const expiraEn = new Date(sesionData.expiraEn);

      if (ahora > expiraEn) {
        // Sesión expirada, limpiar localStorage
        localStorage.removeItem('usuario');
        localStorage.removeItem('sesion');
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      // Verificar si el código de acceso sigue siendo válido
      const codigoExpira = new Date(sesionData.codigoAccesoExpira);
      if (ahora > codigoExpira) {
        // Código de acceso expirado, limpiar localStorage
        localStorage.removeItem('usuario');
        localStorage.removeItem('sesion');
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      // Usuario autenticado y sesión válida
      setIsAuthenticated(true);
      setLoading(false);

    } catch (error) {
      console.error('Error verificando sesión:', error);
      // En caso de error, limpiar localStorage y redirigir
      localStorage.removeItem('usuario');
      localStorage.removeItem('sesion');
      setIsAuthenticated(false);
      setLoading(false);
    }
  };

  // Mostrar loading mientras se verifica la sesión o se cargan los permisos
  if (loading || permissionsLoading) {
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
    // console.log('🛡️ ProtectedRoute:', {
    //   ruta: location.pathname,
    //   tienePermisos,
    //   isAuthenticated
    // });
    
    if (!tienePermisos) {
      return (
        <div className="flex items-center justify-center h-screen bg-gray-100">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600 mb-2">Acceso Denegado</div>
            <div className="text-gray-600">No tienes permisos para acceder a esta vista</div>
            <div className="text-sm text-gray-500 mt-2">Ruta: {location.pathname}</div>
          </div>
        </div>
      );
    }
  }

  // Si está autenticado, mostrar el componente protegido
  return children;
};

export default ProtectedRoute;
