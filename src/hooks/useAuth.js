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
      const usuarioData = localStorage.getItem('usuario');
      const sesionData = localStorage.getItem('sesion');
      
      if (!usuarioData || !sesionData) {
        setUsuario(null);
        setSesion(null);
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      const usuarioParsed = JSON.parse(usuarioData);
      const sesionParsed = JSON.parse(sesionData);

      // Verificar si la sesión no ha expirado
      const ahora = new Date();
      const expiraEn = new Date(sesionParsed.expiraEn);

      if (ahora > expiraEn) {
        logout();
        return;
      }

      // Verificar si el código de acceso sigue siendo válido
      const codigoExpira = new Date(sesionParsed.codigoAccesoExpira);
      if (ahora > codigoExpira) {
        logout();
        return;
      }

      setUsuario(usuarioParsed);
      setSesion(sesionParsed);
      setIsAuthenticated(true);
      setLoading(false);

    } catch (error) {
      console.error('Error verificando sesión:', error);
      logout();
    }
  };

  const login = (usuarioData, sesionData) => {
    localStorage.setItem('usuario', JSON.stringify(usuarioData));
    localStorage.setItem('sesion', JSON.stringify(sesionData));
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
      localStorage.removeItem('usuario');
      localStorage.removeItem('sesion');
      setUsuario(null);
      setSesion(null);
      setIsAuthenticated(false);
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
