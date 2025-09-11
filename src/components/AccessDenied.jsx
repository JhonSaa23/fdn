import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { usePermissions } from '../hooks/usePermissions';
import { ExclamationTriangleIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

const AccessDenied = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const { getMenuItems } = usePermissions();

  useEffect(() => {
    // Si no está autenticado, redirigir al login
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location } });
      return;
    }

    // Si está autenticado, redirigir a la primera ruta permitida después de 3 segundos
    const menuItems = getMenuItems();
    if (menuItems.length > 0) {
      const timer = setTimeout(() => {
        navigate(menuItems[0].path, { replace: true });
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, navigate, location, getMenuItems]);

  const handleGoToAllowedRoute = () => {
    const menuItems = getMenuItems();
    if (menuItems.length > 0) {
      navigate(menuItems[0].path, { replace: true });
    } else {
      navigate('/login', { replace: true });
    }
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  if (!isAuthenticated) {
    // Mostrar loading mientras redirige al login
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            {/* Icono de advertencia */}
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
              <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
            </div>

            {/* Título */}
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Acceso Denegado
            </h2>

            {/* Mensaje */}
            <p className="text-gray-600 mb-6">
              No tienes permisos para acceder a esta vista
            </p>

            {/* Ruta actual */}
            <div className="bg-gray-100 rounded-lg p-3 mb-6">
              <p className="text-sm text-gray-500">Ruta solicitada:</p>
              <p className="text-sm font-mono text-gray-800">{location.pathname}</p>
            </div>

            {/* Botones de acción */}
            <div className="space-y-3">
              <button
                onClick={handleGoToAllowedRoute}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Ir a una vista permitida
              </button>

              <button
                onClick={handleGoBack}
                className="w-full flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Volver atrás
              </button>
            </div>

            {/* Mensaje de redirección automática */}
            <div className="mt-6 text-xs text-gray-500">
              <p>Serás redirigido automáticamente en unos segundos...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccessDenied;
