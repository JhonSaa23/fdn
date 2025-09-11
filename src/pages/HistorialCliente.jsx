import React, { useState, useEffect, useCallback } from 'react';
import { 
  MagnifyingGlassIcon, 
  CalendarIcon,
  DocumentTextIcon,
  UserIcon,
  CurrencyDollarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { useNotification } from '../App';
import SearchableSelect from '../components/SearchableSelect';
import { obtenerListaClientes, consultarHistorialCliente } from '../services/api';

const HistorialCliente = () => {
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(false);
  const [historial, setHistorial] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loadingClientes, setLoadingClientes] = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [filtros, setFiltros] = useState({
    fechaDesde: '',
    fechaHasta: '',
    mes: '',
    año: ''
  });

  // Generar opciones de meses y años
  const meses = [
    { value: '01', label: 'Enero' },
    { value: '02', label: 'Febrero' },
    { value: '03', label: 'Marzo' },
    { value: '04', label: 'Abril' },
    { value: '05', label: 'Mayo' },
    { value: '06', label: 'Junio' },
    { value: '07', label: 'Julio' },
    { value: '08', label: 'Agosto' },
    { value: '09', label: 'Septiembre' },
    { value: '10', label: 'Octubre' },
    { value: '11', label: 'Noviembre' },
    { value: '12', label: 'Diciembre' }
  ];

  const años = Array.from({ length: 10 }, (_, i) => {
    const año = new Date().getFullYear() - i;
    return { value: año.toString(), label: año.toString() };
  });

  const cargarClientes = useCallback(async () => {
    setLoadingClientes(true);
    try {
      const response = await obtenerListaClientes();
      if (response.success) {
        setClientes(response.data);
      }
    } catch (error) {
      console.error('Error cargando clientes:', error);
      showNotification('error', 'Error al cargar lista de clientes');
    } finally {
      setLoadingClientes(false);
    }
  }, [showNotification]);

  // Cargar clientes iniciales una sola vez
  useEffect(() => {
    cargarClientes();
  }, [cargarClientes]);

  const handleClienteChange = useCallback((cliente) => {
    setClienteSeleccionado(cliente);
  }, []);

  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    setFiltros(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const consultarHistorial = async () => {
    if (!clienteSeleccionado) {
      showNotification('warning', 'Debe seleccionar un cliente');
      return;
    }

    setLoading(true);
    try {
      const requestBody = {
        codigoCliente: clienteSeleccionado.Documento
      };

      // Determinar qué filtros enviar
      if (filtros.mes && filtros.año) {
        // Enviar mes y año específicos
        requestBody.mes = filtros.mes;
        requestBody.año = filtros.año;
      } else if (filtros.fechaHasta) {
        // Enviar fecha hasta
        requestBody.fecha = filtros.fechaHasta;
      }
      // Si no hay filtros de fecha, se consulta hasta la fecha actual

      const response = await consultarHistorialCliente(requestBody);
      
      if (response.success) {
        setHistorial(response.data || []);
        showNotification('success', response.message || `Se encontraron ${response.data?.length || 0} registros`);
      } else {
        showNotification('error', response.message || 'Error al consultar historial');
      }
    } catch (error) {
      console.error('Error consultando historial:', error);
      showNotification('error', 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const limpiarFiltros = () => {
    setFiltros({
      fechaDesde: '',
      fechaHasta: '',
      mes: '',
      año: ''
    });
    setClienteSeleccionado(null);
    setHistorial([]);
  };

  const calcularTotales = () => {
    if (!historial.length) return { totalImporte: 0, totalSaldo: 0, totalUtilidades: 0 };
    
    return historial.reduce((totales, item) => ({
      totalImporte: totales.totalImporte + (parseFloat(item.Importe) || 0),
      totalSaldo: totales.totalSaldo + (parseFloat(item.Saldo) || 0),
      totalUtilidades: totales.totalUtilidades + (parseFloat(item.Utilidades) || 0)
    }), { totalImporte: 0, totalSaldo: 0, totalUtilidades: 0 });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(amount || 0);
  };

  const totales = calcularTotales();

  return (
    <div className="space-y-6">
      
      {/* Panel de filtros - Minimalista */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Selector de Cliente - Más ancho */}
          <div className="lg:col-span-2">
            <SearchableSelect
              options={clientes}
              value={clienteSeleccionado}
              onChange={handleClienteChange}
              placeholder="Seleccionar cliente..."
              searchPlaceholder="Buscar por RUC o nombre..."
              loading={loadingClientes}
              className="w-full"
            />
          </div>

          {/* Mes - Más estrecho */}
          <div>
            <select
              name="mes"
              value={filtros.mes}
              onChange={handleFiltroChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Mes</option>
              {meses.map(mes => (
                <option key={mes.value} value={mes.value}>{mes.label}</option>
              ))}
            </select>
          </div>

          {/* Año - Más estrecho */}
          <div>
            <select
              name="año"
              value={filtros.año}
              onChange={handleFiltroChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Año</option>
              {años.map(año => (
                <option key={año.value} value={año.value}>{año.label}</option>
              ))}
            </select>
          </div>

          {/* Fecha Hasta */}
          <div>
            <input
              type="date"
              name="fechaHasta"
              value={filtros.fechaHasta}
              onChange={handleFiltroChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Botones */}
          <div className="flex gap-2">
            <button
              onClick={limpiarFiltros}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Limpiar
            </button>
            <button
              onClick={consultarHistorial}
              disabled={loading}
              className="flex-1 px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? '...' : 'Buscar'}
            </button>
          </div>
        </div>
      </div>

      {/* Resumen de totales */}
      {historial.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Resumen de Totales</h3>
            <div className="text-sm text-gray-600 mt-2 sm:mt-0">
              {filtros.mes && filtros.año ? (
                <span>Filtro: {meses.find(m => m.value === filtros.mes)?.label} {filtros.año}</span>
              ) : filtros.fechaHasta ? (
                <span>Filtro: Hasta {formatDate(filtros.fechaHasta)}</span>
              ) : (
                <span>Filtro: Hasta fecha actual</span>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center">
                <CurrencyDollarIcon className="h-8 w-8 text-blue-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-blue-600">Total Importe</p>
                  <p className="text-2xl font-bold text-blue-900">{formatCurrency(totales.totalImporte)}</p>
                </div>
              </div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="flex items-center">
                <DocumentTextIcon className="h-8 w-8 text-red-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-600">Total Saldo</p>
                  <p className="text-2xl font-bold text-red-900">{formatCurrency(totales.totalSaldo)}</p>
                </div>
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center">
                <CheckCircleIcon className="h-8 w-8 text-green-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-600">Total Utilidades</p>
                  <p className="text-2xl font-bold text-green-900">{formatCurrency(totales.totalUtilidades)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabla de resultados */}
      {historial.length > 0 && (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <h3 className="text-sm font-medium text-gray-900">
              Historial del Cliente ({historial.length} registros)
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nro Deuda
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Documento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Importe
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Saldo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha F
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha V
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Utilidades
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha P
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {historial.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.NroDeuda}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.Documento}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.Tipo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(item.Importe)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(item.Saldo)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(item.FechaF)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(item.FechaV)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(item.Utilidades)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(item.FechaP)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Estado vacío */}
      {!loading && historial.length === 0 && clienteSeleccionado && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron registros</h3>
          <p className="text-gray-500">No hay historial disponible para el cliente seleccionado</p>
        </div>
      )}
    </div>
  );
};

export default HistorialCliente;
