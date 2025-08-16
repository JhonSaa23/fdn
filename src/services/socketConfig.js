import { io } from 'socket.io-client';

// Configuración para Socket.IO
export const SOCKET_CONFIG = {
  // URL del servidor WebSocket
  SERVER_URL: 'http://localhost:3023',
  
  // Namespace para el juego Tres en Raya
  NAMESPACE: '/tresEnRaya',
  
  // Configuración de conexión
  CONNECTION_OPTIONS: {
    transports: ['websocket', 'polling'],
    timeout: 20000,
    forceNew: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
    reconnectionDelayMax: 5000,
    maxReconnectionAttempts: 5
  },
  
  // URLs completas
  get FULL_URL() {
    return `${this.SERVER_URL}${this.NAMESPACE}`;
  }
};

// Función para crear una conexión Socket.IO
export const createSocketConnection = () => {
  return io(SOCKET_CONFIG.FULL_URL, SOCKET_CONFIG.CONNECTION_OPTIONS);
};
