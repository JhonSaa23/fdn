import { useState, useEffect } from 'react';
import { useNotification } from '../App';
import {
  MagnifyingGlassIcon,
  EyeIcon,
  PaperAirplaneIcon,
  CheckCircleIcon,
  XCircleIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import Modal from '../components/Modal';
import axiosClient from '../services/axiosClient';
import Card from '../components/Card';
import Button from '../components/Button';

const Facturacion = () => {
  const { showNotification } = useNotification();
  const [facturas, setFacturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    doc_electronico: '',
    procesado: '',
    serie: '',
    numero: '',
    fechaDesde: '',
    fechaHasta: ''
  });
  const [facturaSeleccionada, setFacturaSeleccionada] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [enviandoFactura, setEnviandoFactura] = useState(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  
  // Estado para la respuesta de Nubefact
  const [respuestaNubefact, setRespuestaNubefact] = useState(null);
  const [showRespuestaModal, setShowRespuestaModal] = useState(false);

  // Cargar facturas por defecto al montar el componente
  useEffect(() => {
    cargarFacturas();
  }, []);

  const cargarFacturas = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      Object.entries(filtros).forEach(([key, value]) => {
        if (value && value.trim() !== '') {
          params.append(key, value.trim());
        }
      });

      const response = await axiosClient.get(`/facturacion?${params.toString()}`);
      const data = response.data;

      if (data.success) {
        setFacturas(data.data);
      } else {
        showNotification('danger', data.error || 'Error al cargar las facturas');
      }
    } catch (error) {
      console.error('Error al cargar facturas:', error);
      showNotification('danger', 'Error de conexión al cargar las facturas');
    } finally {
      setLoading(false);
    }
  };

  const verDetalleFactura = async (doc_electronico) => {
    try {
      setCargandoDetalle(true);
      const response = await axiosClient.get(`/facturacion/${doc_electronico}`);
      const data = response.data;

      if (data.success) {
        setFacturaSeleccionada(data.data);
        setShowModal(true);
      } else {
        showNotification('danger', data.error || 'Error al cargar el detalle de la factura');
      }
    } catch (error) {
      console.error('Error al cargar detalle:', error);
      showNotification('danger', 'Error de conexión al cargar el detalle');
    } finally {
      setCargandoDetalle(false);
    }
  };

  const enviarFactura = async (doc_electronico) => {
    // Limpiar el doc_electronico (eliminar espacios al inicio y final)
    const docLimpio = doc_electronico ? doc_electronico.trim() : '';
    
    if (!window.confirm(`¿Estás seguro de que deseas enviar la factura ${docLimpio} a Nubefact?`)) {
      return;
    }

    try {
      setEnviandoFactura(doc_electronico);
      // Usar encodeURIComponent para manejar caracteres especiales y espacios
      const response = await axiosClient.post(`/facturacion/${encodeURIComponent(docLimpio)}/enviar`);
      const data = response.data;

      if (data.success) {
        showNotification('success', data.message || 'Factura enviada exitosamente a Nubefact');
        
        // Guardar la respuesta de Nubefact y mostrar el modal
        setRespuestaNubefact({
          doc_electronico: docLimpio,
          ...data.data?.nubefact_response
        });
        setShowRespuestaModal(true);
        
        // Actualizar el estado de la factura en la lista
        setFacturas(prevFacturas =>
          prevFacturas.map(factura =>
            factura.Doc_electronico === doc_electronico
              ? { ...factura, Procesado: 1 }
              : factura
          )
        );
      } else {
        // Si hay error, también mostrar detalles
        setRespuestaNubefact({
          doc_electronico: docLimpio,
          error: true,
          errors: data.error,
          details: data.details
        });
        setShowRespuestaModal(true);
        showNotification('danger', data.error || 'Error al enviar la factura');
      }
    } catch (error) {
      console.error('Error al enviar factura:', error);
      const errorDetails = error.response?.data;
      
      // Mostrar modal con error de Nubefact
      setRespuestaNubefact({
        doc_electronico: docLimpio,
        error: true,
        errors: errorDetails?.details?.errors || errorDetails?.error || 'Error de conexión',
        codigo: errorDetails?.details?.codigo,
        details: typeof errorDetails?.details === 'object' ? JSON.stringify(errorDetails.details, null, 2) : errorDetails?.details
      });
      setShowRespuestaModal(true);
      
      const errorMessage = error.response?.data?.error || error.response?.data?.details || 'Error de conexión al enviar la factura';
      showNotification('danger', typeof errorMessage === 'object' ? JSON.stringify(errorMessage) : errorMessage);
    } finally {
      setEnviandoFactura(null);
    }
  };

  const limpiarFiltros = () => {
    setFiltros({
      doc_electronico: '',
      procesado: '',
      serie: '',
      numero: '',
      fechaDesde: '',
      fechaHasta: ''
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

  const getEstadoBadge = (procesado) => {
    // Normalizar el valor de procesado (puede venir como número, string o boolean)
    const procesadoNum = parseInt(procesado) || 0;
    if (procesadoNum === 1) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
          <CheckCircleIcon className="w-3 h-3 mr-1" />
          Procesado
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
        <XCircleIcon className="w-3 h-3 mr-1" />
        Pendiente
      </span>
    );
  };

  const esFacturaPendiente = (procesado) => {
    // Verificar si la factura está pendiente (puede venir como 0, '0', false, null, undefined)
    const procesadoNum = parseInt(procesado);
    return procesadoNum === 0 || procesado === false || procesado === null || procesado === undefined;
  };

  return (
    <div className="container mx-auto">
      {/* Panel de filtros */}
      <Card className="mb-4">
        <div className="border-b border-gray-200 px-4 pt-3 flex flex-col md:flex-row justify-between items-center gap-2">
          <div className="flex items-center gap-2 text-gray-700 font-medium">
            <FunnelIcon className="w-5 h-5" />
            Búsqueda
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={cargarFacturas}
              disabled={loading}
              variant="primary"
              className="text-sm"
            >
              {loading ? 'Buscando...' : 'Buscar'}
            </Button>

            <Button
              onClick={limpiarFiltros}
              variant="secondary"
              className="text-sm"
            >
              Limpiar
            </Button>
          </div>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <input
              type="text"
              value={filtros.doc_electronico}
              onChange={(e) => setFiltros({ ...filtros, doc_electronico: e.target.value })}
              placeholder="Doc. Electrónico"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <select
              value={filtros.procesado}
              onChange={(e) => setFiltros({ ...filtros, procesado: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos</option>
              <option value="0">Pendiente</option>
              <option value="1">Procesado</option>
            </select>

            <input
              type="text"
              value={filtros.serie}
              onChange={(e) => setFiltros({ ...filtros, serie: e.target.value })}
              placeholder="Serie"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <input
              type="text"
              value={filtros.numero}
              onChange={(e) => setFiltros({ ...filtros, numero: e.target.value })}
              placeholder="Número"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <input
              type="date"
              value={filtros.fechaDesde}
              onChange={(e) => setFiltros({ ...filtros, fechaDesde: e.target.value })}
              placeholder="Fecha Desde"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <input
              type="date"
              value={filtros.fechaHasta}
              onChange={(e) => setFiltros({ ...filtros, fechaHasta: e.target.value })}
              placeholder="Fecha Hasta"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </Card>

      {/* Tabla de facturas */}
      <Card>
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Lista de Facturas ({facturas.length})
          </h2>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Cargando facturas...</p>
          </div>
        ) : facturas.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No se encontraron facturas con los filtros aplicados
          </div>
        ) : (
          <>
            {/* Vista desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Doc. Electrónico / Estado
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
                  {facturas.map((factura) => (
                    <tr
                      key={factura.Doc_electronico}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-mono text-gray-900 font-medium">
                            {factura.Doc_electronico}
                          </div>
                          <div className="mt-1">
                            {getEstadoBadge(factura.Procesado)}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {factura.serie}-{factura.Numero}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {factura.NombreLegal || '-'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {factura.Nrodocumento || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div className="font-medium">{formatearFecha(factura.FechaEmision).fecha}</div>
                          <div className="text-gray-500 text-xs">{formatearFecha(factura.FechaEmision).hora}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        S/ {formatearMonto(factura.TotalVenta)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            onClick={() => verDetalleFactura(factura.Doc_electronico)}
                            disabled={cargandoDetalle}
                            variant="primary"
                            className="text-xs px-3 py-1"
                          >
                            <EyeIcon className="w-3 h-3 mr-1" />
                            Ver
                          </Button>

                          {esFacturaPendiente(factura.Procesado) && (
                            <Button
                              onClick={() => enviarFactura(factura.Doc_electronico)}
                              disabled={enviandoFactura === factura.Doc_electronico}
                              variant="success"
                              className="text-xs px-3 py-1"
                            >
                              {enviandoFactura === factura.Doc_electronico ? (
                                <>
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1 inline-block"></div>
                                  Enviando...
                                </>
                              ) : (
                                <>
                                  <PaperAirplaneIcon className="w-3 h-3 mr-1" />
                                  Enviar
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Vista móvil */}
            <div className="md:hidden">
              {facturas.map((factura) => (
                <div key={factura.Doc_electronico} className="border-b border-gray-200 p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-sm font-mono font-medium text-gray-900">
                        {factura.Doc_electronico}
                      </span>
                      <div className="mt-1">
                        {getEstadoBadge(factura.Procesado)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {factura.serie}-{factura.Numero}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        S/ {formatearMonto(factura.TotalVenta)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatearFecha(factura.FechaEmision).fecha}
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="text-sm text-gray-900">{factura.NombreLegal || '-'}</div>
                    <div className="text-xs text-gray-500">{factura.Nrodocumento || '-'}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => verDetalleFactura(factura.Doc_electronico)}
                      disabled={cargandoDetalle}
                      variant="primary"
                      className="text-xs px-3 py-1"
                    >
                      <EyeIcon className="w-3 h-3 mr-1" />
                      Ver
                    </Button>

                    {esFacturaPendiente(factura.Procesado) && (
                      <Button
                        onClick={() => enviarFactura(factura.Doc_electronico)}
                        disabled={enviandoFactura === factura.Doc_electronico}
                        variant="success"
                        className="text-xs px-3 py-1"
                      >
                        {enviandoFactura === factura.Doc_electronico ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1 inline-block"></div>
                            Enviando...
                          </>
                        ) : (
                          <>
                            <PaperAirplaneIcon className="w-3 h-3 mr-1" />
                            Enviar
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      {/* Modal de detalle */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={`Detalle de Factura ${facturaSeleccionada?.cabecera?.Doc_electronico}`}
        size="6xl"
      >
        {facturaSeleccionada && (
          <div className="space-y-6">
            {/* Información de cabecera */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Información de la Factura</h3>
                <div className="space-y-2 text-sm">
                  <div><strong>Doc. Electrónico:</strong> {facturaSeleccionada.cabecera.Doc_electronico}</div>
                  <div><strong>Serie:</strong> {facturaSeleccionada.cabecera.serie}</div>
                  <div><strong>Número:</strong> {facturaSeleccionada.cabecera.Numero}</div>
                  <div><strong>Fecha Emisión:</strong> {formatearFecha(facturaSeleccionada.cabecera.FechaEmision).fecha} {formatearFecha(facturaSeleccionada.cabecera.FechaEmision).hora}</div>
                  <div><strong>Moneda:</strong> {facturaSeleccionada.cabecera.Moneda}</div>
                  <div><strong>Monto en Letras:</strong> {facturaSeleccionada.cabecera.MontoLetras}</div>
                  <div><strong>Procesado:</strong> {facturaSeleccionada.cabecera.Procesado === 1 ? 'Sí' : 'No'}</div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Información del Cliente</h3>
                <div className="space-y-2 text-sm">
                  {facturaSeleccionada.receptor && (
                    <>
                      <div><strong>Nro. Documento:</strong> {facturaSeleccionada.receptor.Nrodocumento}</div>
                      <div><strong>Tipo Documento:</strong> {facturaSeleccionada.receptor.TipoDocumento}</div>
                      <div><strong>Nombre Legal:</strong> {facturaSeleccionada.receptor.NombreLegal}</div>
                      <div><strong>Dirección:</strong> {facturaSeleccionada.receptor.direccion || '-'}</div>
                      <div><strong>Email:</strong> {facturaSeleccionada.receptor.Email || '-'}</div>
                      <div><strong>Ubigeo:</strong> {facturaSeleccionada.receptor.Ubigeo || '-'}</div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Totales */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Totales</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="font-medium text-gray-700">Gravadas</div>
                  <div>S/ {formatearMonto(facturaSeleccionada.cabecera.Gravadas)}</div>
                </div>
                <div>
                  <div className="font-medium text-gray-700">Exoneradas</div>
                  <div>S/ {formatearMonto(facturaSeleccionada.cabecera.Exoneradas)}</div>
                </div>
                <div>
                  <div className="font-medium text-gray-700">IGV</div>
                  <div>S/ {formatearMonto(facturaSeleccionada.cabecera.TotalIgv)}</div>
                </div>
                <div>
                  <div className="font-medium text-gray-700">Total Venta</div>
                  <div className="font-bold text-lg">S/ {formatearMonto(facturaSeleccionada.cabecera.TotalVenta)}</div>
                </div>
              </div>
            </div>

            {/* Detalles de productos */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Detalle de Productos</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cant.</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">P. Unit.</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Descuento</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">IGV</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {facturaSeleccionada.detalles.map((detalle, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-3 py-2 whitespace-nowrap text-sm font-mono text-gray-900">{detalle.codigoItem}</td>
                        <td className="px-3 py-2 text-sm text-gray-900">{detalle.descripcion}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{detalle.cantidad}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">S/ {formatearMonto(detalle.PrecioUnitario)}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">S/ {formatearMonto(detalle.Descuento)}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">S/ {formatearMonto(detalle.IGV)}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">S/ {formatearMonto(detalle.TotalVenta)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Formas de pago */}
            {facturaSeleccionada.formasPago && facturaSeleccionada.formasPago.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Formas de Pago</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Forma de Pago</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Monto</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Vencimiento</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {facturaSeleccionada.formasPago.map((forma, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{forma.FormaPago}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">S/ {formatearMonto(forma.Monto)}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                            {forma.Vencimiento ? formatearFecha(forma.Vencimiento).fecha : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Modal de respuesta de Nubefact */}
      <Modal
        isOpen={showRespuestaModal}
        onClose={() => setShowRespuestaModal(false)}
        title="Respuesta de Nubefact"
        size="3xl"
      >
        {respuestaNubefact && (
          <div className="space-y-4">
            {/* Header con estado */}
            <div className={`p-4 rounded-lg ${respuestaNubefact.error ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
              <div className="flex items-center gap-3">
                {respuestaNubefact.error ? (
                  <XCircleIcon className="w-8 h-8 text-red-500" />
                ) : (
                  <CheckCircleIcon className="w-8 h-8 text-green-500" />
                )}
                <div>
                  <h3 className={`text-lg font-semibold ${respuestaNubefact.error ? 'text-red-700' : 'text-green-700'}`}>
                    {respuestaNubefact.error ? 'Error al Enviar' : 'Factura Enviada Exitosamente'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Documento: {respuestaNubefact.doc_electronico}
                  </p>
                </div>
              </div>
            </div>

            {/* Detalles de la respuesta exitosa */}
            {!respuestaNubefact.error && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-700 mb-2">Información del Comprobante</h4>
                  <div className="space-y-1 text-sm">
                    <div><strong>Tipo:</strong> {respuestaNubefact.tipo_de_comprobante === 1 ? 'Factura' : respuestaNubefact.tipo_de_comprobante === 2 ? 'Boleta' : respuestaNubefact.tipo_de_comprobante}</div>
                    <div><strong>Serie:</strong> {respuestaNubefact.serie}</div>
                    <div><strong>Número:</strong> {respuestaNubefact.numero}</div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-700 mb-2">Estado SUNAT</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <strong>Aceptada:</strong> 
                      {respuestaNubefact.aceptada_por_sunat ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircleIcon className="w-4 h-4 mr-1" />
                          Sí
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                          Pendiente
                        </span>
                      )}
                    </div>
                    <div><strong>Código Respuesta:</strong> {respuestaNubefact.sunat_responsecode || '-'}</div>
                  </div>
                </div>

                {respuestaNubefact.sunat_description && (
                  <div className="md:col-span-2 bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-700 mb-2">Mensaje SUNAT</h4>
                    <p className="text-sm text-blue-600">{respuestaNubefact.sunat_description}</p>
                  </div>
                )}

                {respuestaNubefact.sunat_note && (
                  <div className="md:col-span-2 bg-yellow-50 p-4 rounded-lg">
                    <h4 className="font-medium text-yellow-700 mb-2">Nota SUNAT</h4>
                    <p className="text-sm text-yellow-600">{respuestaNubefact.sunat_note}</p>
                  </div>
                )}

                {respuestaNubefact.codigo_hash && (
                  <div className="md:col-span-2 bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-700 mb-2">Código Hash</h4>
                    <p className="text-sm font-mono text-gray-600 break-all">{respuestaNubefact.codigo_hash}</p>
                  </div>
                )}

                {/* Enlaces */}
                <div className="md:col-span-2 bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-700 mb-3">Enlaces del Comprobante</h4>
                  <div className="flex flex-wrap gap-2">
                    {respuestaNubefact.enlace && (
                      <a
                        href={respuestaNubefact.enlace}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                      >
                        <DocumentTextIcon className="w-4 h-4 mr-2" />
                        Ver Comprobante
                      </a>
                    )}
                    {respuestaNubefact.enlace_del_pdf && (
                      <a
                        href={respuestaNubefact.enlace_del_pdf}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                      >
                        PDF
                      </a>
                    )}
                    {respuestaNubefact.enlace_del_xml && (
                      <a
                        href={respuestaNubefact.enlace_del_xml}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                      >
                        XML
                      </a>
                    )}
                    {respuestaNubefact.enlace_del_cdr && (
                      <a
                        href={respuestaNubefact.enlace_del_cdr}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-2 bg-purple-600 text-white text-sm rounded hover:bg-purple-700"
                      >
                        CDR
                      </a>
                    )}
                  </div>
                </div>

                {respuestaNubefact.cadena_para_codigo_qr && (
                  <div className="md:col-span-2 bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-700 mb-2">Cadena QR</h4>
                    <p className="text-xs font-mono text-gray-600 break-all">{respuestaNubefact.cadena_para_codigo_qr}</p>
                  </div>
                )}
              </div>
            )}

            {/* Detalles del error */}
            {respuestaNubefact.error && (
              <div className="space-y-3">
                {respuestaNubefact.codigo && (
                  <div className="bg-red-50 p-3 rounded-lg">
                    <strong className="text-red-700">Código de Error:</strong>
                    <span className="ml-2 text-red-600">{respuestaNubefact.codigo}</span>
                  </div>
                )}
                
                {respuestaNubefact.errors && (
                  <div className="bg-red-50 p-4 rounded-lg">
                    <h4 className="font-medium text-red-700 mb-2">Mensaje de Error</h4>
                    <p className="text-sm text-red-600 whitespace-pre-wrap">
                      {typeof respuestaNubefact.errors === 'object' 
                        ? JSON.stringify(respuestaNubefact.errors, null, 2) 
                        : respuestaNubefact.errors}
                    </p>
                  </div>
                )}

                {respuestaNubefact.details && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-700 mb-2">Detalles Técnicos</h4>
                    <pre className="text-xs text-gray-600 overflow-x-auto whitespace-pre-wrap">
                      {typeof respuestaNubefact.details === 'object' 
                        ? JSON.stringify(respuestaNubefact.details, null, 2) 
                        : respuestaNubefact.details}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {/* Botón cerrar */}
            <div className="flex justify-end pt-4 border-t">
              <Button
                onClick={() => setShowRespuestaModal(false)}
                variant="secondary"
              >
                Cerrar
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Facturacion;

