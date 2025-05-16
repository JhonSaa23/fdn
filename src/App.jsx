import { useState, createContext, useContext } from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';

import Home from './pages/Home';
import Medifarma from './pages/Medifarma';
import BCP from './pages/BCP';
import BBVA from './pages/BBVA';
import DescuentoCliente from './pages/DescuentoCliente';
import Exportaciones from './pages/Exportaciones';
import Letras from './pages/Letras';
import Tipificaciones from './pages/Tipificaciones';
import ConsultaMovimientos from './pages/ConsultaMovimientos';
import ReporteCodPro from './pages/ReporteCodPro';

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
  // Estado para el sidebar
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Estado para notificaciones
  const [notification, setNotification] = useState({ 
    show: false, 
    type: '', 
    text: '' 
  });

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  // Función para mostrar notificaciones
  const showNotification = (type, text) => {
    setNotification({ show: true, type, text });
    
    // Auto-ocultar después de 5 segundos
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 5000);
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

  return (
    <SidebarContext.Provider value={sidebarContextValue}>
      <NotificationContext.Provider value={notificationContextValue}>
        <div className="flex h-screen bg-gray-50">
          <Sidebar />
          
          <div className={`w-full flex flex-col flex-1 transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'md:pl-20' : 'md:pl-64'}`}>
            <Header />
            
            <main className="flex-1 p-4 overflow-auto">
              <div className="container mx-auto">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/medifarma" element={<Medifarma />} />
                  <Route path="/bcp" element={<BCP />} />
                  <Route path="/bbva" element={<BBVA />} />
                  <Route path="/descuento-cliente" element={<DescuentoCliente />} />
                  <Route path="/exportaciones" element={<Exportaciones />} />
                  <Route path="/letras" element={<Letras />} />
                  <Route path="/tipificaciones" element={<Tipificaciones />} />
                  <Route path="/consulta-movimientos" element={<ConsultaMovimientos />} />
                  <Route path="/reporte-codpro" element={<ReporteCodPro />} />
                </Routes>
              </div>
            </main>
          </div>
        </div>
      </NotificationContext.Provider>
    </SidebarContext.Provider>
  );
}

export default App; 