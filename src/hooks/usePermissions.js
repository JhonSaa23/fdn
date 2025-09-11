import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import axiosClient from '../services/axiosClient';

export const usePermissions = () => {
  const { usuario, loading: authLoading } = useAuth();
  const [vistasSistema, setVistasSistema] = useState([]);
  const [vistasUsuario, setVistasUsuario] = useState([]);
  const [loading, setLoading] = useState(true);

  // console.log('🔍 usePermissions:', { usuario, authLoading });

  // Cargar vistas del sistema y del usuario
  useEffect(() => {
    if (usuario && !authLoading) {
      // Verificar que el usuario tenga un token válido antes de cargar vistas
      const token = localStorage.getItem('authToken');
      if (token) {
        // Pequeño delay para asegurar que el token esté disponible
        setTimeout(() => {
          cargarVistas();
        }, 100);
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
    }
  }, [usuario, authLoading]);

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
      }
    } catch (error) {
      console.error('Error general cargando vistas:', error);
    } finally {
      setLoading(false);
    }
  };

  const canAccessRoute = (route) => {
    if (!usuario) {

      return false;
    }
    
    // Verificar si el usuario tiene acceso a esta ruta específica
    // Incluso los Admins deben respetar los permisos asignados
    const tieneAcceso = vistasUsuario.some(vista => vista.Ruta === route);
    
    // console.log('🔒 canAccessRoute:', {
    //   route,
    //   usuario: usuario.Nombres,
    //   tipoUsuario: usuario.TipoUsuario,
    //   vistasUsuario: vistasUsuario.map(v => v.Ruta),
    //   tieneAcceso
    // });
    
    return tieneAcceso;
  };

  const getMenuItems = () => {
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
  };

  const getVistasSistema = () => {
    return vistasSistema;
  };

  const getVistasUsuario = () => {
    return vistasUsuario;
  };

  return {
    loading,
    canAccessRoute,
    getMenuItems,
    getVistasSistema,
    getVistasUsuario,
    cargarVistas
  };
};
