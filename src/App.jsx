import { useState, createContext, useContext, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { XMarkIcon, Bars3Icon } from '@heroicons/react/24/outline';
import Sidebar from './components/Sidebar';

import Home from './pages/Home';
import Medifarma from './pages/Medifarma';
import BCP from './pages/BCP';
import Exportaciones from './pages/Exportaciones';
import ConsultaMovimientos from './pages/ConsultaMovimientos';
import ReporteCodPro from './pages/ReporteCodPro';
import Promociones from './pages/Promociones';
import Clientes from './pages/Clientes';
import Escalas from './pages/Escalas';
import Kardex from './pages/Kardex';
import KardexTabla from './pages/KardexTabla';
import Guias from './pages/Guias';
import MultiAccion from './pages/MultiAccion';
import ReportePickingProcter from './pages/ReportePickingProcter';
import ReporteConcurso from './pages/ReporteConcurso';
import ReporteNotasLoreal from './pages/ReporteNotasLoreal';
import Bonificaciones from './pages/Bonificaciones';

// Crear contexto para manejar el estado del sidebar
export const SidebarContext = createContext();

export function useSidebar() {
  return useContext(SidebarContext);
}

// Crear contexto para notificaciones
export const NotificationContext = createContext();

export function useNotification() {
  return useContext(NotificationContext);
}

function App() {
  // Estado para el sidebar - cerrado por defecto en móvil
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Estado para notificaciones
  const [notification, setNotification] = useState({ 
    show: false, 
    type: '', 
    text: '' 
  });

  const location = useLocation();

  // Ocultar notificaciones al cambiar de ruta
  useEffect(() => {
    if (notification.show) {
      setNotification({ ...notification, show: false });
    }
  }, [location.pathname]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  // Función para mostrar notificaciones
  const showNotification = (type, text) => {
    setNotification({ show: true, type, text });
    
    // Se elimina el auto-ocultar después de 5 segundos
    // para que las notificaciones permanezcan hasta que el usuario las cierre
  };

  const hideNotification = () => {
    setNotification({ ...notification, show: false });
  };

  const sidebarContextValue = {
    isSidebarOpen,
    setIsSidebarOpen,
    isSidebarCollapsed, 
    setIsSidebarCollapsed,
    toggleSidebar,
    toggleSidebarCollapse
  };

  const notificationContextValue = {
    notification,
    showNotification,
    hideNotification
  };

  // Componente de notificación
  const Notification = ({ type, message, onClose }) => {
    const bgColor = {
      success: 'bg-green-100 border-green-400 text-green-700',
      warning: 'bg-yellow-100 border-yellow-400 text-yellow-700',
      danger: 'bg-red-100 border-red-400 text-red-700',
      info: 'bg-blue-100 border-blue-400 text-blue-700',
    };
    
    return (
      <div className={`flex items-center px-4 py-3 ${bgColor[type]} border rounded-md fixed top-4 right-4 max-w-md shadow-lg z-50 transition-all`}>
        <div className="flex-grow">{message}</div>
        <button 
          onClick={onClose} 
          className="flex-shrink-0 ml-2 rounded-full p-1 hover:bg-gray-200 focus:outline-none focus:bg-gray-200"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>
    );
  };

  return (
    <SidebarContext.Provider value={sidebarContextValue}>
      <NotificationContext.Provider value={notificationContextValue}>
        <div className="flex h-screen bg-gray-50">
          <Sidebar />
          
          <main className={`flex-1 overflow-auto transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'} ml-0`}>
            <div className="p-4 h-full">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/medifarma" element={<Medifarma />} />
                <Route path="/bcp" element={<BCP />} />
                <Route path="/exportaciones" element={<Exportaciones />} />
                <Route path="/consulta-movimientos" element={<ConsultaMovimientos />} />
                <Route path="/reporte-codpro" element={<ReporteCodPro />} />
                <Route path="/promociones" element={<Promociones />} />
                <Route path="/bonificaciones" element={<Bonificaciones />} />
                <Route path="/clientes" element={<Clientes />} />
                <Route path="/escalas" element={<Escalas />} />
                <Route path="/kardex" element={<Kardex />} />
                <Route path="/kardex-tabla" element={<KardexTabla />} />
                <Route path="/guias" element={<Guias />} />
                <Route path="/multi-accion" element={<MultiAccion />} />
                <Route path="/reportes/picking-procter" element={<ReportePickingProcter />} />
                <Route path="/reportes/concurso" element={<ReporteConcurso />} />
                <Route path="/reportes/loreal-notas" element={<ReporteNotasLoreal />} />
              </Routes>
            </div>
          </main>
          
          {/* Botón flotante para móvil - solo visible cuando sidebar está cerrado */}
          {!isSidebarOpen && (
            <button
              onClick={toggleSidebar}
              className="md:hidden fixed top-2 left-2 bg-slate-600 hover:bg-slate-700 text-white rounded-full p-3 shadow-lg z-50 transition-all duration-200 hover:scale-110"
              title="Abrir menú"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
          )}
          
          {/* Notificaciones */}
          {notification.show && (
            <Notification 
              type={notification.type}
              message={notification.text}
              onClose={hideNotification}
            />
          )}
        </div>
      </NotificationContext.Provider>
    </SidebarContext.Provider>
  );
}

export default App; 