import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import io from 'socket.io-client';
import {
  ArrowUpTrayIcon,
  TagIcon,
  GiftIcon,
  UserGroupIcon,
  ChartBarIcon,
  TableCellsIcon,
  TruckIcon,
  Bars3Icon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  ClockIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import axiosClient from '../services/axiosClient';

function Home() {
  const location = useLocation();
  const [socket, setSocket] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);
  const fallbackIntervalRef = useRef(null);

  // Función para cargar actividad reciente desde la API
  const loadRecentActivity = async () => {
    try {
      const response = await axiosClient.get('/dashboard/recent-activity');
      if (response.data.success) {
        setRecentActivity(response.data.data);
      }
    } catch (error) {
      console.error('Error al cargar actividad reciente:', error);
    }
  };

  // Conectar WebSocket cuando esté en la ruta principal
  useEffect(() => {
    // Solo conectar si estamos en la ruta principal "/"
    if (location.pathname !== '/') {
      // Si salimos de la ruta principal, desconectar
      if (socketRef.current) {
        socketRef.current.emit('leave-dashboard');
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
      }
      if (fallbackIntervalRef.current) {
        clearInterval(fallbackIntervalRef.current);
        fallbackIntervalRef.current = null;
      }
      return;
    }

    // Cargar datos iniciales siempre
    loadRecentActivity();

    const socketUrl = import.meta.env.VITE_API_URL;
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      console.error('No hay token de autenticación disponible');
      setIsConnected(false);
      // Fallback: actualizar cada 5 segundos con HTTP polling
      fallbackIntervalRef.current = setInterval(() => {
        loadRecentActivity();
      }, 5000);
      return () => {
        if (fallbackIntervalRef.current) {
          clearInterval(fallbackIntervalRef.current);
          fallbackIntervalRef.current = null;
        }
      };
    }
    
    // Conectar socket con autenticación
    const newSocket = io(socketUrl, {
      transports: ['polling', 'websocket'], // Polling primero como fallback
      upgrade: true,
      rememberUpgrade: true,
      timeout: 20000,
      forceNew: false,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      auth: {
        token: token
      },
      extraHeaders: token ? {
        Authorization: `Bearer ${token}`
      } : {},
      query: token ? {
        token: token
      } : {}
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    // Eventos del socket
    newSocket.on('connect', () => {
      console.log('✅ Socket conectado:', newSocket.id);
      setIsConnected(true);
      // Unirse al canal del dashboard
      newSocket.emit('join-dashboard');
      
      // Cargar actividad reciente inicial
      loadRecentActivity();
    });

    newSocket.on('disconnect', (reason) => {
      console.log('❌ Socket desconectado:', reason);
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Error de conexión socket.io:', error.message);
      setIsConnected(false);
      // Intentar reconectar después de 3 segundos
      setTimeout(() => {
        if (socketRef.current && !socketRef.current.connected) {
          console.log('🔄 Intentando reconectar...');
          socketRef.current.connect();
        }
      }, 3000);
    });

    // Escuchar nuevos registros
    newSocket.on('new-activity', (data) => {
      console.log('📊 Nuevos registros recibidos:', data.length);
      setRecentActivity(data);
    });

    // Escuchar actividad reciente inicial
    newSocket.on('recent-activity', (data) => {
      console.log('📊 Actividad reciente recibida:', data.length);
      setRecentActivity(data);
    });

    // Escuchar errores del servidor
    newSocket.on('error', (error) => {
      console.error('❌ Error del servidor:', error);
    });

    // Fallback: Si después de 5 segundos no se conecta, usar HTTP polling
    const fallbackTimeout = setTimeout(() => {
      if (socketRef.current && !socketRef.current.connected) {
        console.log('⚠️ Socket no conectado después de 5s, usando HTTP polling como fallback');
        setIsConnected(false);
        // Limpiar cualquier intervalo anterior
        if (fallbackIntervalRef.current) {
          clearInterval(fallbackIntervalRef.current);
        }
        // Iniciar polling HTTP cada 5 segundos
        fallbackIntervalRef.current = setInterval(() => {
          loadRecentActivity();
        }, 5000);
      }
    }, 5000);

    // Limpiar cuando se conecte el socket
    newSocket.on('connect', () => {
      clearTimeout(fallbackTimeout);
      if (fallbackIntervalRef.current) {
        clearInterval(fallbackIntervalRef.current);
        fallbackIntervalRef.current = null;
      }
    });

    // Limpiar al desmontar
    return () => {
      clearTimeout(fallbackTimeout);
      if (fallbackIntervalRef.current) {
        clearInterval(fallbackIntervalRef.current);
        fallbackIntervalRef.current = null;
      }
      if (newSocket) {
        newSocket.emit('leave-dashboard');
        newSocket.disconnect();
      }
    };
  }, [location.pathname]);

  // Formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const moduleGroups = [
    {
      title: 'Importación',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      modules: [
        { name: 'Medifarma', icon: <ArrowUpTrayIcon className="w-5 h-5" />, path: '/importar/medifarma' },
        { name: 'BCP', icon: <ArrowUpTrayIcon className="w-5 h-5" />, path: '/importar/bcp' }
      ]
    },
    {
      title: 'Productos',
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      modules: [
        { name: 'Promociones', icon: <TagIcon className="w-5 h-5" />, path: '/promociones' },
        { name: 'Bonificaciones', icon: <GiftIcon className="w-5 h-5" />, path: '/bonificaciones' },
        { name: 'Escalas', icon: <ChartBarIcon className="w-5 h-5" />, path: '/escalas' }
      ]
    },
    {
      title: 'Inventario',
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      modules: [
        { name: 'Kardex', icon: <TableCellsIcon className="w-5 h-5" />, path: '/kardex-tabla' },
        { name: 'Guías', icon: <TruckIcon className="w-5 h-5" />, path: '/guias' },
        { name: 'Multi Acción', icon: <Bars3Icon className="w-5 h-5" />, path: '/multi-accion' }
      ]
    },
    {
      title: 'Gestión',
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      modules: [
        { name: 'Clientes', icon: <UserGroupIcon className="w-5 h-5" />, path: '/clientes' },
        { name: 'Consulta Productos', icon: <MagnifyingGlassIcon className="w-5 h-5" />, path: '/consulta-productos' },
        { name: 'Reportes', icon: <DocumentTextIcon className="w-5 h-5" />, path: '/reportes/reporte-codpro' }
      ]
    }
  ];

  return (
    <div className=" bg-gradient-to-br  p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            Dashboard <span className="text-indigo-600">FDN</span>
          </h1>
          <p className="text-slate-600">Panel de control empresarial</p>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {moduleGroups.map((group, index) => (
            <div key={group.title} className={`${group.bgColor} ${group.borderColor} border rounded-xl p-6 shadow-sm`}>
              <div className="flex items-center mb-4">
                <div className={`w-3 h-3 bg-gradient-to-r ${group.color} rounded-full mr-3`}></div>
                <h2 className="text-lg font-semibold text-slate-800">{group.title}</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {group.modules.map((module) => (
                  <Link
                    key={module.name}
                    to={module.path}
                    className="group bg-white/80 hover:bg-white p-4 rounded-lg border border-white/50 hover:border-slate-200 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex flex-col items-center text-center space-y-2">
                      <div className="p-2 bg-slate-100 group-hover:bg-slate-200 rounded-lg transition-colors">
                        {module.icon}
                      </div>
                      <span className="text-sm font-medium text-slate-700 leading-tight">
                        {module.name}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        

        {/* Tabla de Actividad Reciente en Tiempo Real */}
        <div className="bg-white/80 backdrop-blur-sm rounded-lg border border-white/50 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-800">Actividad del Día</h2>
              <p className="text-sm text-slate-500 mt-1">
                {new Date().toLocaleDateString('es-ES', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm text-slate-600">
                {isConnected ? 'Conectado' : 'Desconectado'}
              </span>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                    Operador
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                    Máquina
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                    Opción
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                    Acción
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                    Formulario
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                    Detalle
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {recentActivity.length > 0 ? (
                  recentActivity.map((activity, index) => (
                    <tr key={index} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">
                        {formatDate(activity.Fecha)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-800">
                        {activity.Operador || '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">
                        {activity.Maquina || '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">
                        {activity.Opcion || '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">
                        {activity.Accion || '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">
                        {activity.formulario || '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">
                        {activity.detalle || '-'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-4 py-8 text-center text-sm text-slate-500">
                      {isConnected ? 'Cargando actividad...' : 'No hay actividad reciente'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home; 
