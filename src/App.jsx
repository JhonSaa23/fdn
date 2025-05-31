import { useState, createContext, useContext } from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';

import Home from './pages/Home';
import Medifarma from './pages/Medifarma';
import BCP from './pages/BCP';
import Exportaciones from './pages/Exportaciones';
import ConsultaMovimientos from './pages/ConsultaMovimientos';
import ReporteCodPro from './pages/ReporteCodPro';
import Escalas from './pages/Escalas';
import MultiAccion from './pages/MultiAccion';
import ReportePickingProcter from './pages/ReportePickingProcter';
import ReporteConcurso from './pages/ReporteConcurso';

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

// Crear contexto para el estado de conexión a la base de datos
export const DatabaseConnectionContext = createContext();

export function useDatabaseConnection() {
  return useContext(DatabaseConnectionContext);
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

  // Estado para la conexión a la base de datos
  const [isDbConnected, setIsDbConnected] = useState(true);

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

  const dbConnectionContextValue = {
    isDbConnected,
    setIsDbConnected
  };

  return (
    <SidebarContext.Provider value={sidebarContextValue}>
      <NotificationContext.Provider value={notificationContextValue}>
        <DatabaseConnectionContext.Provider value={dbConnectionContextValue}>
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
                    <Route path="/escalas" element={<Escalas />} />
                    <Route path="/multi-accion" element={<MultiAccion />} />
                    <Route path="/reportes/picking-procter" element={<ReportePickingProcter />} />
                    <Route path="/reportes/concurso" element={<ReporteConcurso />} />
                  </Routes>
                </div>
              </main>
            </div>
          </div>
        </DatabaseConnectionContext.Provider>
      </NotificationContext.Provider>
    </SidebarContext.Provider>
  );
}

export default App; 