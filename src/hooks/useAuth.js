import { useState, useEffect } from 'react';
import { cerrarSesion } from '../services/api';

export const useAuth = () => {
  const [usuario, setUsuario] = useState(null);
  const [sesion, setSesion] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    verificarSesion();
  }, []);

  const verificarSesion = () => {
    try {
      const token = localStorage.getItem('authToken');
      const usuarioData = localStorage.getItem('user');
      
      if (!token || !usuarioData) {
        setUsuario(null);
        setSesion(null);
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      const usuarioParsed = JSON.parse(usuarioData);

      // El token JWT ya maneja la expiración automáticamente
      // Si el token es válido, el usuario está autenticado
      setUsuario(usuarioParsed);
      setSesion({ token: token }); // Mantener compatibilidad
      setIsAuthenticated(true);
      setLoading(false);

    } catch (error) {
      console.error('Error verificando sesión:', error);
      logout();
    }
  };

  const login = (usuarioData, sesionData, token) => {
    localStorage.setItem('user', JSON.stringify(usuarioData));
    localStorage.setItem('authToken', token);
    localStorage.setItem('sesion', JSON.stringify(sesionData)); // Mantener compatibilidad
    setUsuario(usuarioData);
    setSesion(sesionData);
    setIsAuthenticated(true);
  };

  const logout = async () => {
    try {
      // Si hay un usuario logueado, cerrar sesión en el backend
      if (usuario?.idus) {
        await cerrarSesion(usuario.idus);
      }
    } catch (error) {
      console.error('Error cerrando sesión en backend:', error);
      // Continuar con el logout local aunque falle el backend
    } finally {
      // Limpiar datos locales
      localStorage.removeItem('user');
      localStorage.removeItem('authToken');
      localStorage.removeItem('sesion');
      setUsuario(null);
      setSesion(null);
      setIsAuthenticated(false);
      
      // Redirigir inmediatamente al login después del logout
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
  };

  const actualizarSesion = (nuevaSesion) => {
    localStorage.setItem('sesion', JSON.stringify(nuevaSesion));
    setSesion(nuevaSesion);
  };

  return {
    usuario,
    sesion,
    isAuthenticated,
    loading,
    login,
    logout,
    actualizarSesion,
    verificarSesion
  };
};
