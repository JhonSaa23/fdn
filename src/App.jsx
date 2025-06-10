import { useState, createContext, useContext, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';

import Home from './pages/Home';
import Medifarma from './pages/Medifarma';
import BCP from './pages/BCP';
import Exportaciones from './pages/Exportaciones';
import ConsultaMovimientos from './pages/ConsultaMovimientos';
import ReporteCodPro from './pages/ReporteCodPro';
import Promociones from './pages/Promociones';
import Escalas from './pages/Escalas';
import MultiAccion from './pages/MultiAccion';
import ReportePickingProcter from './pages/ReportePickingProcter';
import ReporteConcurso from './pages/ReporteConcurso';
import ReporteNotasLoreal from './pages/ReporteNotasLoreal';

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
                  <Route path="/exportaciones" element={<Exportaciones />} />
                  <Route path="/consulta-movimientos" element={<ConsultaMovimientos />} />
                  <Route path="/reporte-codpro" element={<ReporteCodPro />} />
                  <Route path="/promociones" element={<Promociones />} />
                  <Route path="/escalas" element={<Escalas />} />
                  <Route path="/multi-accion" element={<MultiAccion />} />
                  <Route path="/reportes/picking-procter" element={<ReportePickingProcter />} />
                  <Route path="/reportes/concurso" element={<ReporteConcurso />} />
                  <Route path="/reportes/loreal-notas" element={<ReporteNotasLoreal />} />
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