import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { useLocation } from 'react-router-dom';
import { useSidebar, useNotification } from '../App';

// Mapa de títulos para cada ruta
const pageTitles = {
  '/': 'Inicio',
  '/importar/medifarma': 'Importar Medifarma',
  '/importar/bcp': 'Importar BCP',
  '/bbva': 'Importar BBVA',
  '/descuento-cliente': 'Importar Descuento Cliente',
  '/exportaciones': 'Exportaciones',
  '/letras': 'Letras',
  '/tipificaciones': 'Tipificaciones',
  '/consulta-movimientos': 'Consultar Movimientos',
  '/reporte-codpro': 'Reporte CodPro',
  '/promociones': 'Promociones',
  '/infocorp': 'Infocorp',
  '/escalas': 'Escalas',
  '/multi-accion': 'Multi Acción',
  '/reportes/picking-procter': 'Reporte Picking Procter - Cobertura General',
  '/reportes/loreal-notas': 'Reporte Notas de Crédito Loreal',
  '/reportes/concurso': 'Reporte Concurso',
};

// Componente de notificación
function Notification({ type, message, onClose }) {
  const bgColor = {
    success: 'bg-green-100 border-green-400 text-green-700',
    warning: 'bg-yellow-100 border-yellow-400 text-yellow-700',
    danger: 'bg-red-100 border-red-400 text-red-700',
    info: 'bg-blue-100 border-blue-400 text-blue-700',
  };
  
  return (
    <div className={`flex items-center px-4 py-3 ${bgColor[type]} border rounded-md absolute right-8 top-20 max-w-md shadow-lg z-50 transition-all`}>
      <div className="flex-grow">{message}</div>
      <button 
        onClick={onClose} 
        className="flex-shrink-0 ml-2 rounded-full p-1 hover:bg-gray-200 focus:outline-none focus:bg-gray-200"
      >
        <XMarkIcon className="h-4 w-4" />
      </button>
    </div>
  );
}

function Header() {
  const { toggleSidebar, isSidebarCollapsed, toggleSidebarCollapse } = useSidebar();
  const { notification, hideNotification } = useNotification();
  const location = useLocation();
  const currentTitle = pageTitles[location.pathname] || 'Sistema de Importación';
  
  const handleMenuClick = () => {
    // En móvil, abre/cierra el sidebar
    if (window.innerWidth < 768) {
      toggleSidebar();
    } 
    // En desktop, colapsa/expande el sidebar
    else {
      toggleSidebarCollapse();
    }
  };
  
  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center px-4 md:px-6">
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
            onClick={handleMenuClick}
          >
            <span className="sr-only">Abrir menú</span>
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>
          
          <h1 className="ml-4 text-lg font-semibold text-gray-900">{currentTitle}</h1>
        </div>
        
        <div className="flex flex-1 items-center justify-end px-4 md:px-6">
          <div className="ml-4 flex items-center space-x-4">
            {notification.show ? (
              <div className={`flex items-center text-sm font-medium px-3 py-1 rounded-md ${
                notification.type === 'success' ? 'bg-green-100 text-green-700' :
                notification.type === 'danger' ? 'bg-red-100 text-red-700' :
                notification.type === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                'bg-blue-100 text-blue-700'
              }`}>
                <span>{notification.text}</span>
                <button 
                  onClick={hideNotification}
                  className="ml-2 rounded-full p-1 hover:bg-gray-200 focus:outline-none"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </header>
    </>
  );
}

export default Header; 
