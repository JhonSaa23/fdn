import { useState, createContext, useContext, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import TresEnRaya from './pages/TresEnRaya';

// Crear contexto para notificaciones
export const NotificationContext = createContext();

export function useNotification() {
  return useContext(NotificationContext);
}

function TresEnRayaApp() {
  // Estado para notificaciones
  const [notification, setNotification] = useState({ 
    show: false, 
    type: '', 
    text: '' 
  });

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
    <NotificationContext.Provider value={notificationContextValue}>
      <div className="h-screen bg-gray-50">
        <main className="w-full h-full overflow-auto">
          <div className="p-4 h-full">
            <TresEnRaya />
          </div>
        </main>
        
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
  );
}

export default TresEnRayaApp;
