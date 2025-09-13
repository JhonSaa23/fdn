import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import axiosClient from '../services/axiosClient';

export const usePermissions = () => {
  const { usuario, loading: authLoading } = useAuth();
  const [vistasSistema, setVistasSistema] = useState([]);
  const [vistasUsuario, setVistasUsuario] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vistasCargadas, setVistasCargadas] = useState(false);

  // console.log('🔍 usePermissions:', { usuario, authLoading });

  // Cargar vistas del sistema y del usuario
  useEffect(() => {
    if (usuario && !authLoading && !vistasCargadas) {
      // Verificar que el usuario tenga un token válido antes de cargar vistas
      const token = localStorage.getItem('authToken');
      if (token) {
        cargarVistas();
      } else {
        setVistasSistema([]);
        setVistasUsuario([]);
        setLoading(false);
      }
    } else if (!authLoading && !usuario) {
      // Si no hay usuario y auth terminó de cargar, limpiar vistas
      setVistasSistema([]);
      setVistasUsuario([]);
      setLoading(false);
      setVistasCargadas(false);
    }
  }, [usuario, authLoading, vistasCargadas]);

  const cargarVistas = async () => {
    try {
      setLoading(true);
      
      // Solo cargar vistas del sistema si el usuario es administrador
      if (usuario.tipoUsuario === 'Admin') {
        try {
          const vistasResponse = await axiosClient.get('/vistas');
          if (vistasResponse.data.success) {
            setVistasSistema(vistasResponse.data.data);
          }
        } catch (error) {
          console.error('Error cargando vistas del sistema:', error);
          // Si falla, continuar sin vistas del sistema
        }
      } else {
        // Para usuarios no administradores, no cargar vistas del sistema
        setVistasSistema([]);
      }

      // Cargar vistas permitidas para el usuario
      try {
        const usuarioVistasResponse = await axiosClient.get(`/vistas/usuario/${usuario.idus}`);
        if (usuarioVistasResponse.data.success) {
          setVistasUsuario(usuarioVistasResponse.data.data);
        }
      } catch (error) {
        console.error('Error cargando vistas del usuario:', error);
        // Si falla, usar un conjunto básico de vistas para usuarios no administradores
        setVistasUsuario([]);
        // No redirigir al login si falla la carga de vistas
        // El usuario puede seguir usando la aplicación con permisos limitados
      }
    } catch (error) {
      console.error('Error general cargando vistas:', error);
    } finally {
      setLoading(false);
      setVistasCargadas(true);
    }
  };

  const canAccessRoute = (route) => {
    if (!usuario) {
      return false;
    }
    
    // Si estamos cargando, permitir acceso temporalmente
    if (loading) {
      return true;
    }
    
    // Si no hay vistas cargadas después del loading, solo permitir dashboard
    if (vistasUsuario.length === 0) {
      // Solo permitir acceso al dashboard si no hay vistas asignadas
      return route === '/' || route === '/login';
    }
    
    // Verificar si el usuario tiene acceso a esta ruta específica
    const tieneAcceso = vistasUsuario.some(vista => vista.Ruta === route);
    
    return tieneAcceso;
  };

  const isRouteValid = (route) => {
    const rutasValidas = [
      '/', '/importar/medifarma', '/importar/bcp', '/exportaciones', 
      '/consulta-movimientos', '/reportes/reporte-codpro', '/promociones', 
      '/bonificaciones', '/pedidos', '/saldos', '/movimientos', '/clientes', 
      '/infocorp', '/clie-vend', '/usersbot', '/gestion-usuarios', '/escalas', 
      '/kardex-tabla', '/guias', '/multi-accion', '/consulta-productos', 
      '/devolucion-canje', '/historial-cliente', '/reportes/picking-procter',
      '/reportes/concurso', '/reportes/loreal-notas', '/reportes/compras-laboratorio'
    ];
    
    return rutasValidas.includes(route);
  };

  const getMenuItems = useCallback(() => {
    if (!usuario) return [];
    
    // Agrupar vistas por subrutas
    const menuItems = [];
    const subrutas = {};
    
    vistasUsuario.forEach(vista => {
      // Detectar si es una subruta (ej: /reportes/picking-procter)
      const pathParts = vista.Ruta.split('/');
      if (pathParts.length > 2) {
        // Es una subruta, agrupar bajo el padre
        const parentPath = `/${pathParts[1]}`; // ej: /reportes
        const parentName = pathParts[1].charAt(0).toUpperCase() + pathParts[1].slice(1); // ej: Reportes
        
        if (!subrutas[parentPath]) {
          subrutas[parentPath] = {
            path: parentPath,
            name: parentName,
            icon: 'FolderIcon', // Icono genérico para carpetas
            categoria: vista.Categoria,
            submenu: [],
            orden: vista.Orden // Agregar el orden del primer elemento
          };
        }
        
        subrutas[parentPath].submenu.push({
          path: vista.Ruta,
          name: vista.Nombre,
          icon: vista.Icono,
          categoria: vista.Categoria,
          orden: vista.Orden
        });
      } else {
        // Es una ruta principal, agregar directamente
        menuItems.push({
          path: vista.Ruta,
          name: vista.Nombre,
          icon: vista.Icono,
          categoria: vista.Categoria,
          orden: vista.Orden
        });
      }
    });
    
    // Agregar los menús con subrutas en la posición correcta
    Object.values(subrutas).forEach(subruta => {
      // Ordenar submenús por orden
      subruta.submenu.sort((a, b) => a.orden - b.orden);
      
      // Insertar en la posición correcta según el orden
      const insertIndex = menuItems.findIndex(item => item.orden > subruta.orden);
      if (insertIndex === -1) {
        menuItems.push(subruta);
      } else {
        menuItems.splice(insertIndex, 0, subruta);
      }
    });
    
    // Ordenar todos los elementos por orden
    menuItems.sort((a, b) => a.orden - b.orden);
    
    return menuItems;
  }, [usuario, vistasUsuario]);

  const getVistasSistema = useCallback(() => {
    return vistasSistema;
  }, [vistasSistema]);

  const getVistasUsuario = useCallback(() => {
    return vistasUsuario;
  }, [vistasUsuario]);

  return {
    loading,
    canAccessRoute,
    isRouteValid,
    getMenuItems,
    getVistasSistema,
    getVistasUsuario,
    cargarVistas
  };
};
