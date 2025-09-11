import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { usePermissions } from '../hooks/usePermissions';

const RouteGuard = ({ children, requireAuth = true, requireAdmin = false }) => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { canAccessRoute, getMenuItems, loading: permissionsLoading } = usePermissions();
  const location = useLocation();

  // Mostrar loading mientras se verifican las credenciales
  if (authLoading || permissionsLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Si la ruta no requiere autenticación, permitir acceso
  if (!requireAuth) {
    return children;
  }

  // Si no está autenticado, redirigir al login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Si requiere ser admin pero no lo es, redirigir a una ruta permitida
  if (requireAdmin) {
    const menuItems = getMenuItems();
    const firstAllowedRoute = menuItems.length > 0 ? menuItems[0].path : '/';
    
    // Si no tiene permisos de admin, redirigir a la primera ruta permitida
    if (menuItems.length === 0) {
      return <Navigate to="/login" replace />;
    }
    
    return <Navigate to={firstAllowedRoute} replace />;
  }

  // Verificar si tiene acceso a la ruta actual
  const currentPath = location.pathname;
  const hasAccess = canAccessRoute(currentPath);

  if (!hasAccess) {
    // Obtener la primera ruta permitida para el usuario
    const menuItems = getMenuItems();
    
    if (menuItems.length === 0) {
      // Si no tiene acceso a ninguna ruta, redirigir al login
      return <Navigate to="/login" replace />;
    }

    // Redirigir a la primera ruta permitida
    const firstAllowedRoute = menuItems[0].path;
    return <Navigate to={firstAllowedRoute} replace />;
  }

  // Si tiene acceso, mostrar el componente
  return children;
};

export default RouteGuard;
