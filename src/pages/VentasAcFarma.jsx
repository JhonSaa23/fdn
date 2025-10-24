import React, { useState, useEffect } from 'react';
import { 
  DocumentTextIcon, 
  MagnifyingGlassIcon, 
  ArrowDownTrayIcon,
  XMarkIcon,
  FunnelIcon 
} from '@heroicons/react/24/outline';
import { consultarVentasAcFarma, exportarVentasAcFarmaExcel, obtenerLaboratoriosAcFarma } from '../services/api';

const VentasAcFarma = () => {
  // Obtener fecha de hoy en formato YYYY-MM-DD
  const obtenerFechaHoy = () => {
    const hoy = new Date();
    const year = hoy.getFullYear();
    const month = String(hoy.getMonth() + 1).padStart(2, '0');
    const day = String(hoy.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [filtros, setFiltros] = useState({
    fecha: obtenerFechaHoy(),
    codigoLaboratorio: '69'
  });
  
  const [datos, setDatos] = useState([]);
  const [laboratorios, setLaboratorios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  useEffect(() => {
    cargarLaboratorios();
  }, []);

  const cargarLaboratorios = async () => {
    try {
      const response = await obtenerLaboratoriosAcFarma();
      if (response.success) {
        setLaboratorios(response.data);
      }
    } catch (error) {
      console.error('Error cargando laboratorios:', error);
    }
  };

  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    setFiltros(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleConsultar = async () => {
    if (!filtros.fecha) {
      setMensaje({ tipo: 'error', texto: 'La fecha es requerida' });
      return;
    }

    setLoading(true);
    setMensaje({ tipo: '', texto: '' });

    try {
      const response = await consultarVentasAcFarma(filtros.fecha, filtros.codigoLaboratorio);
      
      if (response.success) {
        setDatos(response.data);
      } else {
        setMensaje({ tipo: 'error', texto: response.message || 'Error al consultar' });
      }
    } catch (error) {
      console.error('Error consultando Ventas AC Farma:', error);
      setMensaje({ tipo: 'error', texto: 'Error al consultar los datos' });
    } finally {
      setLoading(false);
    }
  };

  const handleLimpiar = () => {
    setFiltros({
      fecha: obtenerFechaHoy(),
      codigoLaboratorio: '69'
    });
    setDatos([]);
    setMensaje({ tipo: '', texto: '' });
  };

  const handleExportar = async () => {
    if (!filtros.fecha) {
      setMensaje({ tipo: 'error', texto: 'La fecha es requerida para exportar' });
      return;
    }

    if (datos.length === 0) {
      setMensaje({ tipo: 'error', texto: 'No hay datos para exportar. Consulte primero.' });
      return;
    }

    setExportando(true);
    setMensaje({ tipo: '', texto: '' });

    try {
      await exportarVentasAcFarmaExcel(filtros.fecha, filtros.codigoLaboratorio);
    } catch (error) {
      console.error('Error exportando:', error);
      setMensaje({ tipo: 'error', texto: 'Error al exportar a Excel' });
    } finally {
      setExportando(false);
    }
  };

  const formatFecha = (fecha) => {
    if (!fecha) return '';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    });
  };

  const formatDecimal = (numero) => {
    if (!numero && numero !== 0) return '0.00';
    return parseFloat(numero).toFixed(2);
  };

  const formatCurrency = (numero) => {
    if (!numero && numero !== 0) return 'S/ 0.00';
    return `S/ ${parseFloat(numero).toFixed(2)}`;
  };

  const calcularTotalGeneral = () => {
    return datos.reduce((total, item) => total + (item.Total || 0), 0);
  };

  return (
    <div className="">

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6">

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          {/* Fecha */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="fecha"
              value={filtros.fecha}
              onChange={handleFiltroChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {/* Código Laboratorio */}
          <div className="md:col-span-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Laboratorio (Opcional)
            </label>
            <select
              name="codigoLaboratorio"
              value={filtros.codigoLaboratorio}
              onChange={handleFiltroChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos los laboratorios</option>
              {laboratorios.map((lab) => (
                <option key={lab.CodLab} value={lab.CodLab}>
                  {lab.CodLab} - {lab.Descripcion || 'Sin descripción'}
                </option>
              ))}
            </select>
          </div>

          {/* Botones */}
          <div className="md:col-span-6 flex gap-2">
            <button
              onClick={handleConsultar}
              disabled={loading || !filtros.fecha}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm font-medium transition-colors"
            >
              {loading ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Consultando...
                </>
              ) : (
                <>
                  <MagnifyingGlassIcon className="h-4 w-4" />
                  Consultar
                </>
              )}
            </button>

            <button
              onClick={handleLimpiar}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 flex items-center gap-2 text-sm font-medium transition-colors"
            >
              <XMarkIcon className="h-4 w-4" />
              Limpiar
            </button>

            <button
              onClick={handleExportar}
              disabled={exportando || datos.length === 0}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium transition-colors"
            >
              {exportando ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Exportando...
                </>
              ) : (
                <>
                  <ArrowDownTrayIcon className="h-4 w-4" />
                  Excel
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mensaje */}
      {mensaje.texto && (
        <div className={`mb-4 p-4 rounded-lg ${
          mensaje.tipo === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
          mensaje.tipo === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
          'bg-blue-50 text-blue-800 border border-blue-200'
        }`}>
          {mensaje.texto}
        </div>
      )}

      {/* Tabla de resultados */}
      {datos.length > 0 && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Tabla Desktop */}
          <div className="hidden md:block overflow-x-auto">
            <div className="max-h-[calc(100vh-180px)] overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase">Fecha</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase">RUC</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase">Razón Social</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase">Dirección</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase">Zona</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase">Cód. Ven</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase">Vendedor</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase">Dpto</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase">Provincia</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase">Distrito</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase">Número</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase">Cód. Prod</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase">Producto</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-700 uppercase">Cantidad</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-700 uppercase">Precio</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-700 uppercase">Desc. 1</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-700 uppercase">Desc. 2</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-700 uppercase">Desc. 3</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-700 uppercase">Total</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase">Línea</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-700 uppercase">Tipo</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase">Nro Pedido</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {datos.map((item, index) => (
                    <tr key={index} className="hover:bg-blue-50 transition-colors">
                      <td className="px-3 py-2 text-xs text-gray-900">{formatFecha(item.Fecha)}</td>
                      <td className="px-3 py-2 text-xs text-gray-900">{item.RUC}</td>
                      <td className="px-3 py-2 text-xs text-gray-900">{item.Razon}</td>
                      <td className="px-3 py-2 text-xs text-gray-600">{item.Direccion}</td>
                      <td className="px-3 py-2 text-xs text-gray-600">{item.Zona}</td>
                      <td className="px-3 py-2 text-xs text-gray-900">{item.CodVen}</td>
                      <td className="px-3 py-2 text-xs text-gray-900">{item.Vendedor}</td>
                      <td className="px-3 py-2 text-xs text-gray-600">{item.Dpto}</td>
                      <td className="px-3 py-2 text-xs text-gray-600">{item.Provincia}</td>
                      <td className="px-3 py-2 text-xs text-gray-600">{item.Distrito}</td>
                      <td className="px-3 py-2 text-xs text-gray-900 font-medium">{item.Numero}</td>
                      <td className="px-3 py-2 text-xs text-gray-900">{item.codpro}</td>
                      <td className="px-3 py-2 text-xs text-gray-900">{item.NombreProducto}</td>
                      <td className="px-3 py-2 text-xs text-right text-gray-900">{formatDecimal(item.Cantidad)}</td>
                      <td className="px-3 py-2 text-xs text-right text-gray-900">{formatCurrency(item.Precio)}</td>
                      <td className="px-3 py-2 text-xs text-right text-gray-600">{formatDecimal(item.Descuento1)}</td>
                      <td className="px-3 py-2 text-xs text-right text-gray-600">{formatDecimal(item.Descuento2)}</td>
                      <td className="px-3 py-2 text-xs text-right text-gray-600">{formatDecimal(item.Descuento3)}</td>
                      <td className="px-3 py-2 text-xs text-right font-semibold text-blue-700">{formatCurrency(item.Total)}</td>
                      <td className="px-3 py-2 text-xs text-gray-600">{item.Linea}</td>
                      <td className="px-3 py-2 text-xs text-center">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          item.TipoDoc === 'Fa' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-green-100 text-green-800'
                        }`}>
                          {item.TipoDoc}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-900">{item.NroPedido || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Vista Mobile */}
          <div className="block md:hidden">
            <div className="max-h-[calc(100vh-400px)] overflow-y-auto p-4">
              {datos.map((item, index) => (
                <div key={index} className="mb-4 pb-4 border-b border-gray-200 last:border-b-0">
                  <div className="space-y-2">
                    {/* Header Card */}
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 text-sm">{item.Razon}</div>
                        <div className="text-xs text-gray-600">RUC: {item.RUC}</div>
                      </div>
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                        item.TipoDoc === 'Fa' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {item.TipoDoc}
                      </span>
                    </div>

                    {/* Información del documento */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-600">Fecha:</span>
                        <span className="ml-1 text-gray-900 font-medium">{formatFecha(item.Fecha)}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Número:</span>
                        <span className="ml-1 text-gray-900 font-medium">{item.Numero}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Nro Pedido:</span>
                        <span className="ml-1 text-gray-900 font-medium">{item.NroPedido || '-'}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Tipo Doc.:</span>
                        <span className="ml-1 text-gray-900 font-medium">{item.TipoDoc || '-'}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-600">Vendedor:</span>
                        <span className="ml-1 text-gray-900">{item.Vendedor} ({item.CodVen})</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-600">Zona:</span>
                        <span className="ml-1 text-gray-900">{item.Zona}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-600">Ubicación:</span>
                        <span className="ml-1 text-gray-900">{item.Dpto}, {item.Provincia}, {item.Distrito}</span>
                      </div>
                    </div>

                    {/* Información del producto */}
                    <div className="bg-blue-50 rounded-md p-2 mt-2">
                      <div className="font-medium text-gray-900 text-sm mb-1">{item.NombreProducto}</div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-gray-600">Código:</span>
                          <span className="ml-1 text-gray-900">{item.codpro}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Línea:</span>
                          <span className="ml-1 text-gray-900">{item.Linea}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Cantidad:</span>
                          <span className="ml-1 text-gray-900 font-medium">{formatDecimal(item.Cantidad)}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Precio:</span>
                          <span className="ml-1 text-gray-900">{formatCurrency(item.Precio)}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Desc:</span>
                          <span className="ml-1 text-gray-900">
                            {formatDecimal(item.Descuento1)}% / {formatDecimal(item.Descuento2)}% / {formatDecimal(item.Descuento3)}%
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Total:</span>
                          <span className="ml-1 text-blue-700 font-bold">{formatCurrency(item.Total)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Total Mobile */}
              <div className="sticky bottom-0 bg-blue-50 border-t-2 border-blue-600 p-3 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-gray-900">Total General:</span>
                  <span className="text-lg font-bold text-blue-700">{formatCurrency(calcularTotalGeneral())}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Estado vacío */}
      {!loading && datos.length === 0 && filtros.fecha && (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <DocumentTextIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">No se encontraron resultados con los filtros seleccionados</p>
        </div>
      )}

      {/* Estado inicial */}
      {!loading && datos.length === 0 && !filtros.fecha && (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <DocumentTextIcon className="h-16 w-16 text-blue-300 mx-auto mb-4" />
          <p className="text-gray-600">Seleccione una fecha para consultar las ventas</p>
        </div>
      )}
    </div>
  );
};

export default VentasAcFarma;

