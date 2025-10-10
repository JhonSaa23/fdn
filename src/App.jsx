import { useState, createContext, useContext, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { XMarkIcon, Bars3Icon } from '@heroicons/react/24/outline';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';
import { useSecurityWarning } from './hooks/useSecurityWarning';

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
import Pedidos from './pages/Pedidos';
import Saldos from './pages/Saldos';
import ConsultaProductos from './pages/ConsultaProductos';
import DevolucionCanjeForm from './pages/DevolucionCanjeForm';
import ReporteComprasLaboratorio from './pages/ReporteComprasLaboratorio';
import Infocorp from './pages/Infocorp';
import JuegoTresEnRaya from './pages/JuegoTresEnRaya';
import ClieVend from './pages/ClieVend';
import UsersBot from './pages/UsersBot';
import GestionUsuarios from './pages/GestionUsuarios';
import Movimientos from './pages/Movimientos';
import HistorialCliente from './pages/HistorialCliente';
import LetrasPage from './pages/LetrasPage';
import VentasAcFarma from './pages/VentasAcFarma';
import Login from './pages/Login';
import AccessDenied from './components/AccessDenied';

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

  // Mensaje de seguridad global
  useSecurityWarning();

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

    // Auto-ocultar después de 3 segundos
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 3000);
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
      success: 'bg-white border-green-400 text-green-700',
      warning: 'bg-white border-yellow-400 text-yellow-700',
      danger: 'bg-white border-red-400 text-red-700',
      info: 'bg-white border-blue-400 text-blue-700',
    };

    return (
      <div className={`flex items-center px-4 py-3 ${bgColor[type]} border rounded-md fixed top-4 right-4 max-w-md shadow-2xl z-[9999] transition-all duration-300 transform animate-in slide-in-from-right-full backdrop-blur-none`} style={{ backgroundColor: 'white' }}>
        <div className="flex-grow text-sm font-medium">{message}</div>
        <button
          onClick={onClose}
          className="flex-shrink-0 ml-2 rounded-full p-1 hover:bg-gray-200 focus:outline-none focus:bg-gray-200 transition-colors"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>
    );
  };

  return (
    <SidebarContext.Provider value={sidebarContextValue}>
      <NotificationContext.Provider value={notificationContextValue}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/access-denied" element={<AccessDenied />} />
          <Route path="/*" element={
            <ProtectedRoute>
              <div className="flex h-screen bg-gray-50">
                <Sidebar />

                <main className={`flex-1 overflow-auto transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'} ml-0`}>
                  <div className="p-4 h-full bg-[#d7e5ee]">
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/importar/medifarma" element={<Medifarma />} />
                      <Route path="/importar/bcp" element={<BCP />} />
                      <Route path="/exportaciones" element={<Exportaciones />} />
                      <Route path="/consulta-movimientos" element={<ConsultaMovimientos />} />
                      <Route path="/reportes/reporte-codpro" element={<ReporteCodPro />} />
                      <Route path="/promociones" element={<Promociones />} />
                      <Route path="/bonificaciones" element={<Bonificaciones />} />
                      <Route path="/pedidos" element={<Pedidos />} />
                      <Route path="/saldos" element={<Saldos />} />
                      <Route path="/clientes" element={<Clientes />} />
                      <Route path="/infocorp" element={<Infocorp />} />
                      <Route path="/clie-vend" element={<ClieVend />} />
                      <Route path="/escalas" element={<Escalas />} />
                      <Route path="/kardex" element={<Kardex />} />
                      <Route path="/kardex-tabla" element={<KardexTabla />} />
                      <Route path="/consulta-productos" element={<ConsultaProductos />} />
                      <Route path="/devolucion-canje" element={<DevolucionCanjeForm />} />
                      <Route path="/guias" element={<Guias />} />
                      <Route path="/multi-accion" element={<MultiAccion />} />
                      <Route path="/reportes/picking-procter" element={<ReportePickingProcter />} />
                      <Route path="/reportes/concurso" element={<ReporteConcurso />} />
                      <Route path="/reportes/loreal-notas" element={<ReporteNotasLoreal />} />
                      <Route path="/reportes/compras-laboratorio" element={<ReporteComprasLaboratorio />} />
                      <Route path="/reportes/ventas-ac-farma" element={<VentasAcFarma />} />
                      <Route path="/juego-tres-en-raya" element={<JuegoTresEnRaya />} />
                      <Route path="/usersbot" element={<UsersBot />} />
                      <Route path="/gestion-usuarios" element={<GestionUsuarios />} />
                      <Route path="/movimientos" element={<Movimientos />} />
                      <Route path="/historial-cliente" element={<HistorialCliente />} />
                      <Route path="/letras" element={<LetrasPage />} />
                    </Routes>
                  </div>
                </main>

                {/* Botón flotante para móvil - solo visible cuando sidebar está cerrado */}
                {!isSidebarOpen && (
                  <button
                    onClick={toggleSidebar}
                    className="md:hidden fixed top-1 left-1 bg-slate-600 hover:bg-slate-700 text-white rounded-full p-2 shadow-lg z-50 transition-all duration-200 hover:scale-110"
                    title="Abrir menú"
                  >
                    <Bars3Icon className="h-5 w-5" />
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
            </ProtectedRoute>
          } />
        </Routes>
      </NotificationContext.Provider>
    </SidebarContext.Provider>
  );
}

export default App; 
