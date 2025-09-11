import React, { useState, useEffect } from 'react';
import { useNotification } from '../App';
import { 
  FunnelIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import Card from '../components/Card';
import Button from '../components/Button';
import axiosClient from '../services/axiosClient';

const Bonificaciones = () => {
  const { showNotification } = useNotification();
  const [todasLasBonificaciones, setTodasLasBonificaciones] = useState([]); // Datos originales
  const [bonificacionesFiltradas, setBonificacionesFiltradas] = useState([]); // Datos filtrados
  const [loading, setLoading] = useState(false);
  const [codLaboratorio, setCodLaboratorio] = useState(''); // Nuevo estado para el código de laboratorio
  
  // Estados para filtros
  const [filtros, setFiltros] = useState({
    Codproducto: '',
    Factor: '',
    CodBoni: '',
    Cantidad: ''
  });

  const [columnasVisibles, setColumnasVisibles] = useState({
    nombreProducto: true,
    nombreBonificacion: true
  });

  // Cargar TODAS las bonificaciones una sola vez
  const cargarTodasLasBonificaciones = async () => {
    try {
      setLoading(true);
      const response = await axiosClient.get('/bonificaciones/listar');
      
      if (response.data.success) {
        const datos = response.data.data || [];
        setTodasLasBonificaciones(datos);
        setBonificacionesFiltradas(datos); // Inicialmente mostrar todos
      } else {
        showNotification('error', 'Error al cargar las bonificaciones');
        setTodasLasBonificaciones([]);
        setBonificacionesFiltradas([]);
      }
    } catch (error) {
      console.error('Error al cargar bonificaciones:', error);
      let mensaje = 'Error al cargar las bonificaciones';
      if (error.response) {
        mensaje = error.response.data?.error || mensaje;
      }
      showNotification('error', mensaje);
      setTodasLasBonificaciones([]);
      setBonificacionesFiltradas([]);
    } finally {
      setLoading(false);
    }
  };

  // Nueva función para filtrar por laboratorio
  const filtrarPorLaboratorio = async () => {
    if (!codLaboratorio.trim()) {
      showNotification('warning', 'Ingrese un código de laboratorio');
      return;
    }
    try {
      setLoading(true);
      const response = await axiosClient.get(`/bonificaciones/por-laboratorio/${codLaboratorio}`);
      
      if (response.data.success) {
        const datos = response.data.data || [];
        setTodasLasBonificaciones(datos);
        setBonificacionesFiltradas(datos);
        // Limpiar los otros filtros
        setFiltros({
          Codproducto: '',
          Factor: '',
          CodBoni: '',
          Cantidad: ''
        });
      } else {
        showNotification('error', 'Error al filtrar por laboratorio');
      }
    } catch (error) {
      console.error('Error al filtrar por laboratorio:', error);
      showNotification('error', 'Error al filtrar por laboratorio');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar en el cliente (frontend)
  const filtrarBonificaciones = () => {
    let resultado = [...todasLasBonificaciones];

    // Filtrar por código de producto
    if (filtros.Codproducto.trim()) {
      resultado = resultado.filter(item => 
        item.Codproducto && item.Codproducto.toLowerCase().includes(filtros.Codproducto.toLowerCase())
      );
    }

    // Filtrar por factor
    if (filtros.Factor.trim()) {
      resultado = resultado.filter(item => 
        item.Factor && item.Factor.toString() === filtros.Factor
      );
    }

    // Filtrar por código de bonificación
    if (filtros.CodBoni.trim()) {
      resultado = resultado.filter(item => 
        item.CodBoni && item.CodBoni.toLowerCase().includes(filtros.CodBoni.toLowerCase())
      );
    }

    // Filtrar por cantidad
    if (filtros.Cantidad.trim()) {
      resultado = resultado.filter(item => 
        item.Cantidad && item.Cantidad.toString() === filtros.Cantidad
      );
    }

    setBonificacionesFiltradas(resultado);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFiltros(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLimpiar = () => {
    setFiltros({
      Codproducto: '',
      Factor: '',
      CodBoni: '',
      Cantidad: ''
    });
    setBonificacionesFiltradas(todasLasBonificaciones); // Mostrar todos los datos
  };

  // Efecto para filtros en tiempo real (solo filtrado local)
  useEffect(() => {
    filtrarBonificaciones();
  }, [filtros, todasLasBonificaciones]);

  // Cargar datos iniciales UNA SOLA VEZ
  useEffect(() => {
    cargarTodasLasBonificaciones();
  }, []);

  // Función para manejar la tecla Enter
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      filtrarPorLaboratorio();
    }
  };

  const toggleVisibilidadColumna = (columna) => {
    setColumnasVisibles(prev => ({
      ...prev,
      [columna]: !prev[columna]
    }));
  };

  return (
    <div className=" bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}

      <div className="">
        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          {/* Filtros en dos filas */}
          <div className="space-y-3">
            {/* Primera fila: Filtro por laboratorio */}
            <div className="flex gap-2">
              <input
                type="text"
                value={codLaboratorio}
                onChange={(e) => setCodLaboratorio(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Cód. Lab"
                maxLength="2"
                className="w-40 px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              <button
                onClick={filtrarPorLaboratorio}
                className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-sm whitespace-nowrap"
              >
                Buscar
              </button>
              <button
                onClick={cargarTodasLasBonificaciones}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 text-sm"
              >
                Todos
              </button>
            </div>

            {/* Segunda fila: Filtros existentes */}
            <div className="grid grid-cols-4 gap-3">
              <input
                  type="number"
                name="Codproducto"
                value={filtros.Codproducto}
                onChange={handleFilterChange}
                className="w-full px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="CódPro..."
              />
              
              <input
                type="number"
                name="Factor"
                value={filtros.Factor}
                onChange={handleFilterChange}
                className="w-full px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="Factor..."
              />
              
              <input
                  type="number"
                name="CodBoni"
                value={filtros.CodBoni}
                onChange={handleFilterChange}
                className="w-full px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="CódBonif..."
              />
              
              <input
                type="number"
                name="Cantidad"
                value={filtros.Cantidad}
                onChange={handleFilterChange}
                className="w-full px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="Cantidad..."
              />
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-4">
              <button
                onClick={handleLimpiar}
                className="flex items-center gap-1 text-gray-600 hover:text-gray-800 text-sm transition-colors"
              >
                <XMarkIcon className="h-4 w-4" />
                Limpiar
              </button>

              <div className="flex items-center gap-3 text-sm">
                <button 
                  onClick={() => toggleVisibilidadColumna('nombreProducto')}
                  className={`flex items-center gap-1 ${columnasVisibles.nombreProducto ? 'text-blue-600' : 'text-gray-400'} hover:text-blue-700`}
                >
                  {columnasVisibles.nombreProducto ? 
                    <EyeIcon className="h-4 w-4" /> : 
                    <EyeSlashIcon className="h-4 w-4" />
                  }
                  NProd
                </button>

                <button 
                  onClick={() => toggleVisibilidadColumna('nombreBonificacion')}
                  className={`flex items-center gap-1 ${columnasVisibles.nombreBonificacion ? 'text-blue-600' : 'text-gray-400'} hover:text-blue-700`}
                >
                  {columnasVisibles.nombreBonificacion ? 
                    <EyeIcon className="h-4 w-4" /> : 
                    <EyeSlashIcon className="h-4 w-4" />
                  }
                  NBonif
                </button>
              </div>
            </div>
            
            <div className="text-xs text-gray-500"> {todasLasBonificaciones.length} resultados
            </div>
          </div>
        </div>

        {/* Resultados */}
        <div className="">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600 font-medium">Cargando bonificaciones...</span>
            </div>
          ) : bonificacionesFiltradas.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron bonificaciones</h3>
              <p className="text-gray-500">
                {todasLasBonificaciones.length > 0 
                  ? 'Intenta ajustar los filtros de búsqueda para obtener resultados.'
                  : 'No hay bonificaciones disponibles.'
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <div style={{ height: 'calc(100vh - 170px)', overflow: 'auto' }}>
                <table className="min-w-full divide-y divide-gray-200 text-xs">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-2 py-2 text-left text-xs text-gray-600 uppercase tracking-wider">Cod</th>
                      {columnasVisibles.nombreProducto && (
                        <th className="px-2 py-2 text-left text-xs text-gray-600 uppercase tracking-wider w-24">Nom</th>
                      )}
                      <th className="px-2 py-2 text-left text-xs text-gray-600 uppercase tracking-wider">Fact</th>
                      <th className="px-2 py-2 text-left text-xs text-gray-600 uppercase tracking-wider">Stock</th>
                      <th className="px-2 py-2 text-left text-xs text-gray-600 uppercase tracking-wider">CódB</th>
                      {columnasVisibles.nombreBonificacion && (
                        <th className="px-2 py-2 text-left text-xs text-gray-600 uppercase tracking-wider w-24">Nom.B</th>
                      )}
                      <th className="px-2 py-2 text-left text-xs text-gray-600 uppercase tracking-wider">Cant</th>
                      <th className="px-2 py-2 text-left text-xs text-gray-600 uppercase tracking-wider">Stock</th>
                      <th className="px-2 py-2 text-left text-xs text-gray-600 uppercase tracking-wider">Paq</th>
                      <th className="px-2 py-2 text-left text-xs text-gray-600 uppercase tracking-wider">Bonos</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {bonificacionesFiltradas.map((bonificacion, index) => (
                      <tr key={index} className="hover:bg-blue-50 transition-colors duration-150">
                        <td className="px-2 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                          {bonificacion.Codproducto}
                        </td>
                        {columnasVisibles.nombreProducto && (
                          <td className="px-2 py-2 text-xs text-gray-700 w-24">
                            <div className="truncate" title={bonificacion.NombreProducto}>
                              {bonificacion.NombreProducto ? 
                                bonificacion.NombreProducto.length > 15 ? 
                                  `${bonificacion.NombreProducto.substring(0, 15)}...` : 
                                  bonificacion.NombreProducto 
                                : 'Sin nombre'}
                            </div>
                          </td>
                        )}
                        <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-700">
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {bonificacion.Factor}
                          </span>
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-700">
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {bonificacion.StockProducto !== null ? bonificacion.StockProducto.toFixed(0) : 'N/A'}
                          </span>
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                          {bonificacion.CodBoni}
                        </td>
                        {columnasVisibles.nombreBonificacion && (
                          <td className="px-2 py-2 text-xs text-gray-700 w-24">
                            <div className="truncate" title={bonificacion.NombreBonificacion}>
                              {bonificacion.NombreBonificacion ? 
                                bonificacion.NombreBonificacion.length > 15 ? 
                                  `${bonificacion.NombreBonificacion.substring(0, 15)}...` : 
                                  bonificacion.NombreBonificacion 
                                : 'Sin nombre'}
                            </div>
                          </td>
                        )}
                        <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-700">
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {bonificacion.Cantidad}
                          </span>
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-700">
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {bonificacion.StockBonificacion !== null ? bonificacion.StockBonificacion.toFixed(0) : 'N/A'}
                          </span>
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-700">
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            {bonificacion.Paquetes || '0'}
                          </span>
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-700">
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                            parseInt(bonificacion.BonosAComprar) > 0 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {bonificacion.BonosAComprar || '0'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Bonificaciones; 
