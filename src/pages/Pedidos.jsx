import { useState, useEffect } from 'react';
import { useNotification } from '../App';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  CheckIcon,
  XMarkIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  TrashIcon,
  CubeIcon
} from '@heroicons/react/24/outline';
import Modal from '../components/Modal';
import axiosClient from '../services/axiosClient';

const Pedidos = () => {
  const { showNotification } = useNotification();
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    numero: '',
    dia: '',
    mes: '',
    anio: '',
    estado: '',
    eliminado: '0'
  });

  const [estadosDisponibles, setEstadosDisponibles] = useState([]);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [autorizandoPedido, setAutorizandoPedido] = useState(null);
  const [eliminandoPedido, setEliminandoPedido] = useState(null);
  const [productosPedido, setProductosPedido] = useState(null);
  const [showModalProductos, setShowModalProductos] = useState(false);
  const [cargandoProductos, setCargandoProductos] = useState(false);

  // Cargar pedidos por defecto al montar el componente
  useEffect(() => {
    cargarPedidosDefault();
    cargarEstados();
  }, []);

  const cargarPedidosDefault = async () => {
    try {
      setLoading(true);
      const response = await axiosClient.get('/pedidos/default');
      const data = response.data;

      if (data.success) {
        setPedidos(data.data);
        // Actualizar filtros con los valores por defecto
        setFiltros(prev => ({
          ...prev,
          mes: data.filtros.mes.toString(),
          anio: data.filtros.anio.toString(),
          estado: data.filtros.estado.toString(),
          eliminado: data.filtros.eliminado.toString()
        }));
      } else {
        showNotification('danger', data.error || 'Error al cargar los pedidos');
      }
    } catch (error) {
      console.error('Error al cargar pedidos:', error);
      showNotification('danger', 'Error de conexión al cargar los pedidos');
    } finally {
      setLoading(false);
    }
  };

  const cargarEstados = async () => {
    try {
      const response = await axiosClient.get('/pedidos/utils/estados');
      const data = response.data;

      if (data.success) {
        setEstadosDisponibles(data.data);
      }
    } catch (error) {
      console.error('Error al cargar estados:', error);
    }
  };

  const buscarPedidos = async () => {
    try {
      setLoading(true);

      // Construir query string con filtros
      const params = new URLSearchParams();
      Object.entries(filtros).forEach(([key, value]) => {
        if (value && value.trim() !== '') {
          params.append(key, value.trim());
        }
      });

      const response = await axiosClient.get(`/pedidos?${params.toString()}`);
      const data = response.data;

      if (data.success) {
        setPedidos(data.data);
        showNotification('success', `Se encontraron ${data.data.length} pedidos`);
      } else {
        showNotification('danger', data.error || 'Error al buscar los pedidos');
      }
    } catch (error) {
      console.error('Error al buscar pedidos:', error);
      showNotification('danger', 'Error de conexión al buscar los pedidos');
    } finally {
      setLoading(false);
    }
  };

  const verDetallePedido = async (numero) => {
    try {
      // Limpiar el número del pedido (eliminar espacios al inicio y final)
      const numeroLimpio = numero.trim();
      const response = await axiosClient.get(`/pedidos/${numeroLimpio}`);
      const data = response.data;

      if (data.success) {
        setPedidoSeleccionado(data.data);
        setShowModal(true);
      } else {
        showNotification('danger', data.error || 'Error al cargar el detalle del pedido');
      }
    } catch (error) {
      console.error('Error al cargar detalle:', error);
      showNotification('danger', 'Error de conexión al cargar el detalle');
    }
  };

  const autorizarPedido = async (numero) => {
    try {
      setAutorizandoPedido(numero);
      // Limpiar el número del pedido (eliminar espacios al inicio y final)
      const numeroLimpio = numero.trim();

      const response = await axiosClient.post(`/pedidos/autorizar/${numeroLimpio}`);

      const data = response.data;

      if (data.success) {
        showNotification('success', data.message);
        // Recargar la lista de pedidos
        buscarPedidos();
      } else {
        showNotification('danger', data.error || 'Error al autorizar el pedido');
      }
    } catch (error) {
      console.error('Error al autorizar pedido:', error);
      showNotification('danger', 'Error de conexión al autorizar el pedido');
    } finally {
      setAutorizandoPedido(null);
    }
  };

  const eliminarPedido = async (numero) => {
    try {
      setEliminandoPedido(numero);
      // Limpiar el número del pedido (eliminar espacios al inicio y final)
      const numeroLimpio = numero.trim();

      const response = await axiosClient.delete(`/pedidos/${numeroLimpio}`);

      const data = response.data;

      if (data.success) {
        showNotification('success', data.message);
        // Recargar la lista de pedidos
        buscarPedidos();
      } else {
        showNotification('danger', data.error || 'Error al eliminar el pedido');
      }
    } catch (error) {
      console.error('Error al eliminar pedido:', error);
      showNotification('danger', 'Error de conexión al eliminar el pedido');
    } finally {
      setEliminandoPedido(null);
    }
  };

  const verProductosPedido = async (numero) => {
    try {
      setCargandoProductos(true);
      // Limpiar el número del pedido (eliminar espacios al inicio y final)
      const numeroLimpio = numero.trim();
      const response = await axiosClient.get(`/pedidos/${numeroLimpio}/productos`);
      const data = response.data;

      if (data.success) {
        setProductosPedido(data.data);
        setShowModalProductos(true);
      } else {
        showNotification('danger', data.error || 'Error al cargar los productos del pedido');
      }
    } catch (error) {
      console.error('Error al cargar productos:', error);
      showNotification('danger', 'Error de conexión al cargar los productos');
    } finally {
      setCargandoProductos(false);
    }
  };



  const limpiarFiltros = () => {
    setFiltros({
      numero: '',
      dia: '',
      mes: '',
      anio: '',
      estado: '',
      eliminado: '0'
    });
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return { fecha: '-', hora: '-' };
    const date = new Date(fecha);
    return {
      fecha: date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }),
      hora: date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
      })
    };
  };

  const formatearMonto = (monto) => {
    if (!monto) return '0.00';
    return parseFloat(monto).toLocaleString('es-PE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const getEstadoColor = (estado) => {
    const colores = {
      1: 'bg-red-100 text-red-800 border-red-200',      // Crédito
      2: 'bg-blue-100 text-blue-800 border-blue-200',   // Comercial
      3: 'bg-yellow-100 text-yellow-800 border-yellow-200', // Por Facturar
      4: 'bg-green-100 text-green-800 border-green-200', // Facturado
      5: 'bg-purple-100 text-purple-800 border-purple-200', // Por Despachar
      6: 'bg-indigo-100 text-indigo-800 border-indigo-200', // Embalado
      7: 'bg-orange-100 text-orange-800 border-orange-200', // Reparto
      8: 'bg-emerald-100 text-emerald-800 border-emerald-200', // Entregado
      9: 'bg-gray-100 text-gray-800 border-gray-200'    // No Atendido
    };
    return colores[estado] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <div className="container mx-auto ">
      {/* Header */}

      {/* Panel de filtros */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-2">
        <div className=" border-gray-200 px-4 pt-3 flex  md:flex-row  justify-between items-center gap-2">
          <div className="flex items-center gap-2 text-gray-700 font-medium">
            
            Búsqueda
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={buscarPedidos}
              disabled={loading}
              className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
            >
              {loading ? 'Buscando...' : 'Buscar'}
            </button>

            <button
              onClick={limpiarFiltros}
              className="flex items-center gap-2 bg-gray-600 text-white px-3 py-1.5 rounded-md hover:bg-gray-700 text-sm"
            >
              Limpiar
            </button>

            <button
              onClick={cargarPedidosDefault}
              className="flex items-center gap-2 bg-green-600 text-white px-3 py-1.5 rounded-md hover:bg-green-700 text-sm"
            >
              Defecto
            </button>
          </div>
        </div>

        <div className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-6 gap-4">
              <input
                type="text"
                value={filtros.numero}
                onChange={(e) => setFiltros({ ...filtros, numero: e.target.value })}
                placeholder="Número de Pedido"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <input
                type="number"
                min="1"
                max="31"
                value={filtros.dia}
                onChange={(e) => setFiltros({ ...filtros, dia: e.target.value })}
                placeholder="Día"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <input
                type="number"
                min="1"
                max="12"
                value={filtros.mes}
                onChange={(e) => setFiltros({ ...filtros, mes: e.target.value })}
                placeholder="Mes"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <input
                type="number"
                min="2020"
                max="2030"
                value={filtros.anio}
                onChange={(e) => setFiltros({ ...filtros, anio: e.target.value })}
                placeholder="Año"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <select
                value={filtros.estado}
                onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos los estados</option>
                {estadosDisponibles.map(estado => (
                  <option key={estado.codigo} value={estado.codigo}>
                    {estado.descripcion}
                  </option>
                ))}
              </select>

              <select
                value={filtros.eliminado}
                onChange={(e) => setFiltros({ ...filtros, eliminado: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="0">No Eliminados</option>
                <option value="1">Eliminados</option>
                <option value="">Todos</option>
              </select>
            </div>
          </div>
      </div>

      {/* Tabla de pedidos */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Lista de Pedidos ({pedidos.length})
          </h2>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Cargando pedidos...</p>
          </div>
        ) : pedidos.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No se encontraron pedidos con los filtros aplicados
          </div>
        ) : (
          <>
            {/* Vista desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Número / Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pedidos.map((pedido) => (
                    <tr
                      key={pedido.Numero}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => verDetallePedido(pedido.Numero)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-mono text-gray-900 font-medium">
                            {pedido.Numero}
                          </div>
                          <div className="mt-1">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getEstadoColor(pedido.Estado)}`}>
                              {pedido.EstadoDescripcion}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {pedido.NombreCliente}
                        </div>
                        <div className="text-sm text-gray-500">
                          Código: {pedido.CodClie}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div className="font-medium">{formatearFecha(pedido.Fecha).fecha}</div>
                          <div className="text-gray-500 text-xs">{formatearFecha(pedido.Fecha).hora}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        S/ {formatearMonto(pedido.Total)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              verProductosPedido(pedido.Numero);
                            }}
                            disabled={cargandoProductos}
                            className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
                            title="Ver productos del pedido"
                          >
                            {cargandoProductos ? (
                              <>
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                Cargando...
                              </>
                            ) : (
                              <>
                                <CubeIcon className="w-3 h-3" />
                                Productos
                              </>
                            )}
                          </button>

                          {pedido.Estado === 1 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                autorizarPedido(pedido.Numero);
                              }}
                              disabled={autorizandoPedido === pedido.Numero}
                              className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 disabled:opacity-50 flex items-center gap-1"
                              title="Autorizar pedido"
                            >
                              {autorizandoPedido === pedido.Numero ? (
                                <>
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                  Autorizando...
                                </>
                              ) : (
                                <>
                                  <CheckIcon className="w-3 h-3" />
                                  Autorizar
                                </>
                              )}
                            </button>
                          )}
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm(`¿Estás seguro de que deseas eliminar el pedido ${pedido.Numero}?`)) {
                                eliminarPedido(pedido.Numero);
                              }
                            }}
                            disabled={eliminandoPedido === pedido.Numero}
                            className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700 disabled:opacity-50 flex items-center gap-1"
                            title="Eliminar pedido"
                          >
                            {eliminandoPedido === pedido.Numero ? (
                              <>
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                Eliminando...
                              </>
                            ) : (
                              <>
                                <TrashIcon className="w-3 h-3" />
                                Eliminar
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Vista móvil */}
            <div className="md:hidden">
              {pedidos.map((pedido) => (
                <div key={pedido.Numero} className="border-b border-gray-200 p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-sm font-mono font-medium text-gray-900">
                        {pedido.Numero}
                      </span>
                      <div className="mt-1">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getEstadoColor(pedido.Estado)}`}>
                          {pedido.EstadoDescripcion}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        S/ {formatearMonto(pedido.Total)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatearFecha(pedido.Fecha).fecha}
                      </div>
                      <div className="text-xs text-gray-400">
                        {formatearFecha(pedido.Fecha).hora}
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="text-sm text-gray-900">{pedido.NombreCliente}</div>
                    <div className="text-xs text-gray-500">Código: {pedido.CodClie}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        verDetallePedido(pedido.Numero);
                      }}
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-900 text-sm"
                    >
                      <EyeIcon className="w-4 h-4" />
                      Ver detalle
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        verProductosPedido(pedido.Numero);
                      }}
                      disabled={cargandoProductos}
                      className="flex items-center gap-1 text-indigo-600 hover:text-indigo-900 text-sm"
                    >
                      <CubeIcon className="w-4 h-4" />
                      Productos
                    </button>

                    <div className="flex items-center gap-1 ml-auto">
                      {pedido.Estado === 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            autorizarPedido(pedido.Numero);
                          }}
                          disabled={autorizandoPedido === pedido.Numero}
                          className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 disabled:opacity-50 flex items-center gap-1"
                        >
                          {autorizandoPedido === pedido.Numero ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                              Autorizando...
                            </>
                          ) : (
                            <>
                              <CheckIcon className="w-3 h-3" />
                              Autorizar
                            </>
                          )}
                        </button>
                      )}
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`¿Estás seguro de que deseas eliminar el pedido ${pedido.Numero}?`)) {
                            eliminarPedido(pedido.Numero);
                          }
                        }}
                        disabled={eliminandoPedido === pedido.Numero}
                        className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700 disabled:opacity-50 flex items-center gap-1"
                        title="Eliminar pedido"
                      >
                        {eliminandoPedido === pedido.Numero ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                            Eliminando...
                          </>
                        ) : (
                          <>
                            <TrashIcon className="w-3 h-3" />
                            Eliminar
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modal de detalle */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={`Detalle del Pedido ${pedidoSeleccionado?.Numero}`}
        size="xl"
      >
        {pedidoSeleccionado && (
          <div className="space-y-6">
            {/* Información principal */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Información del Pedido</h3>
                <div className="space-y-2 text-sm">
                  <div><strong>Número:</strong> {pedidoSeleccionado.Numero}</div>
                  <div><strong>Tipo:</strong> {pedidoSeleccionado.Tipo}</div>
                  <div><strong>Estado:</strong>
                    <span className={`ml-2 inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getEstadoColor(pedidoSeleccionado.Estado)}`}>
                      {pedidoSeleccionado.EstadoDescripcion}
                    </span>
                  </div>
                  <div>
                    <strong>Fecha:</strong> {formatearFecha(pedidoSeleccionado.Fecha).fecha}
                    <br />
                    <span className="text-xs text-gray-500">{formatearFecha(pedidoSeleccionado.Fecha).hora}</span>
                  </div>
                  <div><strong>Vendedor:</strong> {pedidoSeleccionado.Vendedor}</div>
                  <div><strong>Días:</strong> {pedidoSeleccionado.Dias}</div>
                  <div><strong>Condición:</strong> {pedidoSeleccionado.Condicion}</div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Información del Cliente</h3>
                <div className="space-y-2 text-sm">
                  <div><strong>Código:</strong> {pedidoSeleccionado.CodClie}</div>
                  <div><strong>Nombre:</strong> {pedidoSeleccionado.NombreCliente}</div>
                  <div><strong>Teléfono:</strong> {pedidoSeleccionado.TelefonoCliente || 'No especificado'}</div>
                  <div><strong>Dirección Pedido:</strong> {pedidoSeleccionado.Direccion}</div>
                  <div><strong>Dirección Cliente:</strong> {pedidoSeleccionado.DireccionCliente || 'No especificado'}</div>
                </div>
              </div>
            </div>

            {/* Información monetaria */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Información Monetaria</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="font-medium text-gray-700">Subtotal</div>
                  <div>S/ {formatearMonto(pedidoSeleccionado.Subtotal)}</div>
                </div>
                <div>
                  <div className="font-medium text-gray-700">IGV</div>
                  <div>S/ {formatearMonto(pedidoSeleccionado.Igv)}</div>
                </div>
                <div>
                  <div className="font-medium text-gray-700">Total</div>
                  <div className="font-bold text-lg">S/ {formatearMonto(pedidoSeleccionado.Total)}</div>
                </div>
                <div>
                  <div className="font-medium text-gray-700">Tipo de Cambio</div>
                  <div>{pedidoSeleccionado.Cambio}</div>
                </div>
              </div>
            </div>

            {/* Fechas adicionales */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Fechas Adicionales</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="font-medium text-gray-700">Creación</div>
                  <div>
                    {formatearFecha(pedidoSeleccionado.FecCre).fecha}
                    <span className="text-xs text-gray-500 ml-2">{formatearFecha(pedidoSeleccionado.FecCre).hora}</span>
                  </div>
                </div>
                <div>
                  <div className="font-medium text-gray-700">Presentación</div>
                  <div>
                    {formatearFecha(pedidoSeleccionado.FecPre).fecha}
                    <span className="text-xs text-gray-500 ml-2">{formatearFecha(pedidoSeleccionado.FecPre).hora}</span>
                  </div>
                </div>
                <div>
                  <div className="font-medium text-gray-700">Facturación</div>
                  <div>
                    {formatearFecha(pedidoSeleccionado.FecFac).fecha}
                    <span className="text-xs text-gray-500 ml-2">{formatearFecha(pedidoSeleccionado.FecFac).hora}</span>
                  </div>
                </div>
                <div>
                  <div className="font-medium text-gray-700">Orden</div>
                  <div>
                    {formatearFecha(pedidoSeleccionado.FecOrd).fecha}
                    <span className="text-xs text-gray-500 ml-2">{formatearFecha(pedidoSeleccionado.FecOrd).hora}</span>
                  </div>
                </div>
                <div>
                  <div className="font-medium text-gray-700">Despacho</div>
                  <div>
                    {formatearFecha(pedidoSeleccionado.FecDes).fecha}
                    <span className="text-xs text-gray-500 ml-2">{formatearFecha(pedidoSeleccionado.FecDes).hora}</span>
                  </div>
                </div>
                <div>
                  <div className="font-medium text-gray-700">Atención</div>
                  <div>
                    {formatearFecha(pedidoSeleccionado.FecAte).fecha}
                    <span className="text-xs text-gray-500 ml-2">{formatearFecha(pedidoSeleccionado.FecAte).hora}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Observaciones */}
            {pedidoSeleccionado.Observacion && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Observaciones</h3>
                <div className="bg-gray-50 p-3 rounded-md text-sm">
                  {pedidoSeleccionado.Observacion}
                </div>
              </div>
            )}

            {/* Estados adicionales */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Estados Adicionales</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="font-medium text-gray-700">Eliminado</div>
                  <div>{pedidoSeleccionado.Eliminado ? 'Sí' : 'No'}</div>
                </div>
                <div>
                  <div className="font-medium text-gray-700">Impreso</div>
                  <div>{pedidoSeleccionado.Impreso ? 'Sí' : 'No'}</div>
                </div>
                <div>
                  <div className="font-medium text-gray-700">Urgente</div>
                  <div>{pedidoSeleccionado.Urgente ? 'Sí' : 'No'}</div>
                </div>
                <div>
                  <div className="font-medium text-gray-700">Representante</div>
                  <div>{pedidoSeleccionado.Representante || 'No asignado'}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de productos del pedido */}
      <Modal
        isOpen={showModalProductos}
        onClose={() => setShowModalProductos(false)}
        title={`Productos del Pedido ${productosPedido?.numero}`}
        size="6xl"
      >
        {productosPedido && (
          <div className="space-y-6">
            {/* Resumen del pedido */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Resumen del Pedido</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="font-medium text-gray-700">Total Productos</div>
                  <div className="text-lg font-bold">{productosPedido.resumen.totalProductos}</div>
                </div>
                <div>
                  <div className="font-medium text-gray-700">Total Cantidad</div>
                  <div className="text-lg font-bold">{productosPedido.resumen.totalCantidad}</div>
                </div>
                <div>
                  <div className="font-medium text-gray-700">Subtotal</div>
                  <div className="text-lg font-bold">S/ {formatearMonto(productosPedido.resumen.subtotal)}</div>
                </div>
                <div>
                  <div className="font-medium text-gray-700">Subtotal con Descuento</div>
                  <div className="text-lg font-bold">S/ {formatearMonto(productosPedido.resumen.subtotalConDescuento)}</div>
                </div>
              </div>
              
              {/* Información de autorización */}
              <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="font-medium text-gray-700">Requieren Autorización</div>
                  <div className="text-lg font-bold text-orange-600">{productosPedido.resumen.productosRequierenAutorizacion}</div>
                </div>
                <div>
                  <div className="font-medium text-gray-700">No Requieren Autorización</div>
                  <div className="text-lg font-bold text-green-600">{productosPedido.resumen.productosNoRequierenAutorizacion}</div>
                </div>
                <div>
                  <div className="font-medium text-gray-700">Porcentaje Requiere Autorización</div>
                  <div className="text-lg font-bold text-blue-600">{productosPedido.resumen.porcentajeRequiereAutorizacion}%</div>
                </div>
              </div>
            </div>

            {/* Tabla de productos */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Lista de Productos</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                                         <tr>
                       <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                       <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                       <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
                       <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descuento 1</th>
                       <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descuento 2</th>
                       <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descuento 3</th>
                       <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subtotal</th>
                       <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Autorización</th>
                     </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                                         {productosPedido.productos.map((producto, index) => (
                       <tr key={index} className="hover:bg-gray-50">
                         <td className="px-3 py-2 whitespace-nowrap text-sm font-mono text-gray-900">{producto.CodPro}</td>
                         <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{producto.Cantidad}</td>
                         <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">S/ {formatearMonto(producto.Precio)}</td>
                         <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                           {producto.Descuento1 ? `${producto.Descuento1}%` : '0%'}
                         </td>
                         <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                           {producto.Descuento2 ? `${producto.Descuento2}%` : '0%'}
                         </td>
                         <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                           {producto.Descuento3 ? `${producto.Descuento3}%` : '0%'}
                         </td>
                         <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">S/ {formatearMonto(producto.Subtotal)}</td>
                         <td className="px-3 py-2 whitespace-nowrap">
                           <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                             producto.RequiereAutorizacion
                               ? 'bg-orange-100 text-orange-800 border border-orange-200'
                               : 'bg-green-100 text-green-800 border border-green-200'
                           }`}>
                             {producto.EstadoAutorizacion}
                           </span>
                         </td>
                       </tr>
                     ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Información adicional de productos */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Información Adicional</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                 <div>
                   <h4 className="font-medium text-gray-700 mb-2">Campos de DocdetPed</h4>
                   <div className="bg-gray-50 p-3 rounded text-xs font-mono">
                     Numero, CodPro, Unimed, Cantidad, Precio, Descuento1, Descuento2, Descuento3, 
                     Adicional, Unidades, Subtotal, Paquete, Editado, Autoriza, Nbonif
                   </div>
                 </div>
                 <div>
                   <h4 className="font-medium text-gray-700 mb-2">Campos Calculados</h4>
                   <div className="bg-gray-50 p-3 rounded text-xs font-mono">
                     SubtotalCalculado, TotalConDescuento, DescuentoTotal, RequiereAutorizacion, EstadoAutorizacion
                   </div>
                 </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
};

export default Pedidos; 