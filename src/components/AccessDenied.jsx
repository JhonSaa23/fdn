import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { usePermissions } from '../hooks/usePermissions';
import { ExclamationTriangleIcon, ArrowLeftIcon, HomeIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

const AccessDenied = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const { getMenuItems, getVistasUsuario } = usePermissions();
  const [rutasDisponibles, setRutasDisponibles] = useState([]);

  // Memoizar la función para evitar bucles infinitos
  const cargarRutasDisponibles = useCallback(() => {
    const menuItems = getMenuItems();
    const vistasUsuario = getVistasUsuario();
    
    if (menuItems.length > 0) {
      setRutasDisponibles(menuItems);
    } else if (vistasUsuario.length > 0) {
      // Si no hay menú pero hay vistas, crear lista básica
      const rutas = vistasUsuario.map(vista => ({
        path: vista.Ruta,
        name: vista.Nombre,
        icon: vista.Icono || 'HomeIcon'
      }));
      setRutasDisponibles(rutas);
    } else {
      // Si no hay vistas, mostrar rutas básicas
      setRutasDisponibles([
        { path: '/', name: 'Dashboard', icon: 'HomeIcon' }
      ]);
    }
  }, [getMenuItems, getVistasUsuario]);

  useEffect(() => {
    cargarRutasDisponibles();
  }, [cargarRutasDisponibles]);

  const handleGoToRoute = (ruta) => {
    navigate(ruta, { replace: true });
  };

  const handleGoToDashboard = () => {
    navigate('/', { replace: true });
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  // Si no está autenticado, redirigir al login
  if (!isAuthenticated) {
    navigate('/login', { state: { from: location } });
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl">
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

            {/* Rutas disponibles */}
            {rutasDisponibles.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Vistas disponibles para ti:
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {rutasDisponibles.map((ruta, index) => (
                    <button
                      key={index}
                      onClick={() => handleGoToRoute(ruta.path)}
                      className="flex items-center p-3 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors duration-200"
                    >
                      <CheckCircleIcon className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0" />
                      <div className="text-left">
                        <p className="text-sm font-medium text-blue-900">{ruta.name}</p>
                        <p className="text-xs text-blue-600 font-mono">{ruta.path}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Botones de acción */}
            <div className="space-y-3">
              <button
                onClick={handleGoToDashboard}
                className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <HomeIcon className="h-4 w-4 mr-2" />
                Ir al Dashboard
              </button>

              <button
                onClick={handleGoBack}
                className="w-full flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Volver atrás
              </button>
            </div>

            {/* Mensaje informativo */}
            <div className="mt-6 text-xs text-gray-500">
              <p>Contacta al administrador si necesitas acceso a más vistas.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccessDenied;
