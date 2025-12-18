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
  FunnelIcon,
  CloudIcon,
  InformationCircleIcon
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
    fechaHasta: '',
    tipo: 'FAC' // Default: Facturas
  });
  const [facturaSeleccionada, setFacturaSeleccionada] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [enviandoFactura, setEnviandoFactura] = useState(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);

  // Estado para la respuesta de Nubefact
  const [respuestaNubefact, setRespuestaNubefact] = useState(null);
  const [showRespuestaModal, setShowRespuestaModal] = useState(false);

  // Consulta Manual State
  const [showModalManual, setShowModalManual] = useState(false);
  const [manualData, setManualData] = useState({ tipo: '1', serie: '', numero: '' });

  // Envío Masivo State
  const [isMassProcessing, setIsMassProcessing] = useState(false);
  const [massProgress, setMassProgress] = useState({ current: 0, total: 0, successes: 0, errors: 0 });
  const [massResults, setMassResults] = useState([]);
  const [showMassModal, setShowMassModal] = useState(false);

  // Selección
  const [selectedDocs, setSelectedDocs] = useState([]);

  const toggleSelectAll = (e) => {
    if (e.target.checked) {
      // Seleccionar solo los pendientes
      const pendingDocs = facturas.filter(f => f.Procesado !== 1 && f.Procesado !== '1').map(f => f.Doc_electronico);
      setSelectedDocs(pendingDocs);
    } else {
      setSelectedDocs([]);
    }
  };

  const toggleSelectOne = (docId) => {
    if (selectedDocs.includes(docId)) {
      setSelectedDocs(selectedDocs.filter(id => id !== docId));
    } else {
      setSelectedDocs([...selectedDocs, docId]);
    }
  };

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

  // Helper para obtener el nombre del documento según el tipo seleccionado o el código
  const getNombreDocumento = (tipoCode = null) => {
    // Si se pasa un código numérico (desde backend), usar ese
    if (tipoCode) {
      if (tipoCode === 1) return 'Factura';
      if (tipoCode === 2) return 'Boleta';
      if (tipoCode === 3) return 'Nota de Crédito';
      if (tipoCode === 4) return 'Nota de Débito';
    }

    // Si no, usar el filtro seleccionado
    const tipo = filtros.tipo;
    switch (tipo) {
      case 'BOL': return 'Boleta';
      case 'NOT': return 'Nota de Crédito';
      case 'NOD': return 'Nota de Débito';
      default: return 'Factura'; // FAC
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

  const consultarNubefact = async (doc_electronico) => {
    // Limpiar el doc
    const docLimpio = doc_electronico ? doc_electronico.trim() : '';

    try {
      // Usamos el mismo estado de "enviando" para mostrar loading en el botón de consulta si queremos,
      // o creamos uno nuevo. Reusaremos setEnviandoFactura para simplicidad visual de bloqueo, 
      // o mejor creamos uno específico para evitar confusión de iconos.
      // Usaremos un estado local temporal para el botón (o el mismo enviandoFactura con otro ID si fuera necesario, pero mejor simple).
      setEnviandoFactura(`consultando-${docLimpio}`); // Hack simple para loading state distintivo

      const response = await axiosClient.post(`/facturacion/${encodeURIComponent(docLimpio)}/consultar`);
      const data = response.data;

      if (data.success) {
        showNotification('success', 'Consulta realizada exitosamente');

        // Mostrar respuesta en el modal existente
        setRespuestaNubefact({
          doc_electronico: docLimpio,
          ...data.data
        });
        setShowRespuestaModal(true);
      } else {
        // Manejar error controlado (ej: no encontrado en Nubefact)
        let mensajeError = data.error || 'Error al consultar';
        let detallesError = data.nubefactError;
        let isNotFound = false;

        // Comprobamos si el error de Nubefact indica que no existe
        // Nubefact suele devolver "El comprobante no existe" o codigo similar.
        // Soporte para código 24/21 y texto "no existe"
        if (detallesError && (
          (detallesError.errors && typeof detallesError.errors === 'string' && detallesError.errors.includes('no existe')) ||
          detallesError.codigo === 21 ||
          detallesError.codigo === 24
        )) {
          mensajeError = "Esta factura no tiene registro en la nube del facturador de Farmacos del Norte";
          isNotFound = true;
        } else if (detallesError) {
          mensajeError = typeof detallesError.errors === 'string' ? detallesError.errors : 'Error en Nubefact';
        }

        setRespuestaNubefact({
          doc_electronico: docLimpio,
          type: 'consulta',
          error: true,
          notFound: isNotFound,
          errors: mensajeError,
          details: detallesError
        });
        setShowRespuestaModal(true);
        // showNotification('warning', mensajeError);
      }
    } catch (error) {
      console.error('Error al consultar Nubefact:', error);
      showNotification('danger', 'Error de conexión al consultar Nubefact');
    } finally {
      setEnviandoFactura(null);
    }
  };

  const handleEnviarMasivo = async () => {
    // 1. Filtrar pendientes (Seleccionados O Todos los pendientes no procesados)
    const pendientes = selectedDocs.length > 0
      ? facturas.filter(f => selectedDocs.includes(f.Doc_electronico))
      : facturas.filter(f => f.Procesado !== 1 && f.Procesado !== '1');

    if (pendientes.length === 0) {
      showNotification('warning', 'No hay documentos pendientes de envío.');
      return;
    }

    const msg = selectedDocs.length > 0
      ? `¿Deseas enviar los ${pendientes.length} documentos seleccionados a Nubefact?`
      : `Se encontraron ${pendientes.length} documentos pendientes. ¿Deseas enviarlos masivamente a Nubefact?`;

    if (!window.confirm(msg)) {
      return;
    }

    // 2. Iniciar proceso
    setIsMassProcessing(true);
    setShowMassModal(true);
    setMassProgress({ current: 0, total: pendientes.length, successes: 0, errors: 0 });
    setMassResults([]);

    let successes = 0;
    let errors = 0;
    const results = [];

    // 3. Loop secuencial
    for (let i = 0; i < pendientes.length; i++) {
      const doc = pendientes[i];
      setMassProgress(prev => ({ ...prev, current: i + 1 }));

      try {
        const docLimpio = doc.Doc_electronico.trim();
        // Llamada directa POST
        const response = await axiosClient.post(`/facturacion/${encodeURIComponent(docLimpio)}/enviar`);
        const data = response.data;

        if (data.success) {
          const nubefactData = data.data || {};
          const sunatDesc = nubefactData.sunat_description || 'Enviado correctamente';

          successes++;
          results.push({
            doc: docLimpio,
            status: 'success',
            message: sunatDesc
          });

          setFacturas(prev => prev.map(f => f.Doc_electronico === doc.Doc_electronico ? { ...f, Procesado: 1 } : f));
        } else {
          errors++;
          const errorMsg = data.error || data.details || 'Error desconocido';
          results.push({
            doc: docLimpio,
            status: 'error',
            message: typeof errorMsg === 'object' ? JSON.stringify(errorMsg) : errorMsg
          });
        }

      } catch (error) {
        errors++;
        const errMsg = error.response?.data?.error || error.response?.data?.details || error.message;
        results.push({
          doc: doc.Doc_electronico,
          status: 'error',
          message: typeof errMsg === 'object' ? JSON.stringify(errMsg) : errMsg
        });
      }

      setMassProgress(prev => ({ ...prev, successes, errors }));
      setMassResults([...results]);

      await new Promise(r => setTimeout(r, 200));
    }

    setIsMassProcessing(false);
    if (selectedDocs.length > 0) setSelectedDocs([]);
    cargarFacturas();
  };

  const handleConsultaManual = async (e) => {
    e.preventDefault();
    setEnviandoFactura('manual-consult');

    try {
      const payload = {
        ...manualData,
        serie: manualData.serie.trim(),
        numero: manualData.numero.toString().trim()
      };
      const response = await axiosClient.post('/facturacion/consultar-manual', payload);
      const data = response.data.data;

      setShowModalManual(false);

      setRespuestaNubefact({
        ...data,
        doc_electronico: `${manualData.serie}-${manualData.numero}`,
        error: !!data.errors,
      });
      setShowRespuestaModal(true);

    } catch (error) {
      console.error('Error consulta manual:', error);
      showNotification('danger', 'Error al consultar manualmente');
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
      {/* Panel de filtros simplificado */}
      <Card className="mb-4">
        <div className="p-4 flex flex-col md:flex-row items-center gap-4">


          {/* Input Documento */}
          <input
            type="text"
            value={filtros.doc_electronico}
            onChange={(e) => setFiltros({ ...filtros, doc_electronico: e.target.value })}
            placeholder="Buscar por Doc. Electrónico..."
            className="w-full md:flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* Select Procesado (Opcional, mantenido por utilidad) */}
          <select
            value={filtros.procesado}
            onChange={(e) => setFiltros({ ...filtros, procesado: e.target.value })}
            className="w-full md:w-40 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos</option>
            <option value="0">Pendiente</option>
            <option value="1">Procesado</option>
          </select>
          {/* Selector de Tipo de Documento */}
          <select
            value={filtros.tipo}
            onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value })}
            className="w-full md:w-48 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-blue-900 bg-blue-50"
          >
            <option value="FAC">Facturas</option>
            <option value="BOL">Boletas</option>
            <option value="NOT">Notas de Crédito</option>
            <option value="NOD">Notas de Débito</option>
          </select>

          {/* Botones */}
          <div className="flex items-center gap-2">
            <Button
              onClick={cargarFacturas}
              disabled={loading}
              variant="primary"
              className="text-sm whitespace-nowrap"
            >
              {loading ? '...' : 'Buscar'}
            </Button>

            <Button
              onClick={limpiarFiltros}
              variant="secondary"
              className="text-sm whitespace-nowrap"
            >
              Limpiar
            </Button>

            <Button
              onClick={handleEnviarMasivo}
              className={`text-sm whitespace-nowrap ${selectedDocs.length > 0 || facturas.filter(f => f.Procesado !== 1 && f.Procesado !== '1').length > 0
                ? "bg-green-600 text-white hover:bg-green-700"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              disabled={isMassProcessing || (selectedDocs.length === 0 && facturas.filter(f => f.Procesado !== 1 && f.Procesado !== '1').length === 0)}
            >
              {isMassProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1 inline-block"></div>
                  Enviando...
                </>
              ) : selectedDocs.length > 0 ? (
                <>
                  <PaperAirplaneIcon className="w-4 h-4 mr-1 inline-block" />
                  Enviar Seleccionados ({selectedDocs.length})
                </>
              ) : (
                <>
                  <PaperAirplaneIcon className="w-4 h-4 mr-1 inline-block" />
                  Enviar Todos Pendientes ({facturas.filter(f => f.Procesado !== 1 && f.Procesado !== '1').length})
                </>
              )}
            </Button>


            <Button
              onClick={() => setShowModalManual(true)}
              className="bg-purple-600 text-white hover:bg-purple-700 text-sm whitespace-nowrap"
            >
              <CloudIcon className="w-4 h-4 mr-1 inline-block" />
              Consultar Estado
            </Button>
          </div>
        </div>
      </Card >

      {/* Tabla de facturas */}
      < Card >
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Lista de {
              filtros.tipo === 'FAC' ? 'Facturas' :
                filtros.tipo === 'BOL' ? 'Boletas' :
                  filtros.tipo === 'NOT' ? 'Notas de Crédito' :
                    filtros.tipo === 'NOD' ? 'Notas de Débito' : 'Documentos'
            } ({facturas.length})
          </h2>
        </div>

        {
          loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Cargando documentos...</p>
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
                      <th className="px-3 py-3 text-center w-8">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 cursor-pointer"
                          onChange={toggleSelectAll}
                          checked={facturas.some(f => f.Procesado !== 1 && f.Procesado !== '1') && selectedDocs.length === facturas.filter(f => f.Procesado !== 1 && f.Procesado !== '1').length}
                        />
                      </th>
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
                        <td className="px-3 py-4 w-8 text-center">
                          {(factura.Procesado !== 1 && factura.Procesado !== '1') && (
                            <input
                              type="checkbox"
                              className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 cursor-pointer"
                              checked={selectedDocs.includes(factura.Doc_electronico)}
                              onChange={() => toggleSelectOne(factura.Doc_electronico)}
                            />
                          )}
                        </td>
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
                                    Enviar
                                  </>
                                )}
                              </Button>
                            )}

                            {/* Botón Consultar (Nube) */}
                            <Button
                              onClick={() => consultarNubefact(factura.Doc_electronico)}
                              disabled={enviandoFactura !== null}
                              variant="secondary"
                              className="text-xs px-3 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200"
                              title="Consultar en Nubefact"
                            >
                              {enviandoFactura === `consultando-${factura.Doc_electronico}` ? (
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-700"></div>
                              ) : (
                                <CloudIcon className="w-3 h-3" />
                              )}
                            </Button>
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

                      {/* Botón Consultar Móvil */}
                      <Button
                        onClick={() => consultarNubefact(factura.Doc_electronico)}
                        disabled={enviandoFactura !== null}
                        variant="secondary"
                        className="text-xs px-3 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200"
                      >
                        {enviandoFactura === `consultando-${factura.Doc_electronico}` ? (
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-700 inline-block"></div>
                        ) : (
                          <CloudIcon className="w-3 h-3 mr-1 inline-block" />
                        )}
                        Nube
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )
        }
      </Card >

      {/* Modal de detalle */}
      < Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={`Detalle de ${getNombreDocumento(facturaSeleccionada?.tipoDocumento)} ${facturaSeleccionada?.cabecera?.Doc_electronico}`}
        size="6xl"
      >
        {facturaSeleccionada && (
          <div className="space-y-6">
            {/* Información de cabecera */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Información del Documento</h3>
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
      </Modal >

      {/* Modal de respuesta de Nubefact */}
      < Modal
        isOpen={showRespuestaModal}
        onClose={() => setShowRespuestaModal(false)}
        title="Respuesta de Nubefact"
        size="3xl"
      >
        {respuestaNubefact && (
          <div className="space-y-4">
            {/* =================================================================================
                CASO ESPECIAL: CONSULTA NO ENCONTRADA (UI SIMPLIFICADA)
                ================================================================================= */}
            {respuestaNubefact.notFound ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="bg-orange-100 p-4 rounded-full mb-4">
                  <InformationCircleIcon className="w-12 h-12 text-orange-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No Registrado
                </h3>
                <p className="text-gray-600 max-w-md mx-auto mb-6">
                  {/* Prioridad al mensaje hardcodeado si es el caso de notFound */}
                  Esta factura no tiene registro en la nube del facturador de Farmacos del Norte
                </p>

                <div className="bg-gray-50 px-4 py-2 rounded-lg border border-gray-200">
                  <span className="text-sm font-mono text-gray-500">
                    {respuestaNubefact.doc_electronico}
                  </span>
                </div>
              </div>
            ) : (
              /* =================================================================================
                 CASO ESTÁNDAR: RESPUESTA DE ENVÍO O CONSULTA EXITOSA / ERROR TÉCNICO
                 ================================================================================= */
              <>
                {/* Header con estado */}
                <div className={`p-4 rounded-lg ${respuestaNubefact.error ? 'bg-red-50 border border-red-200' :
                  'bg-green-50 border border-green-200'
                  }`}>
                  <div className="flex items-center gap-3">
                    {respuestaNubefact.error ? (
                      <XCircleIcon className="w-8 h-8 text-red-500" />
                    ) : (
                      <CheckCircleIcon className="w-8 h-8 text-green-500" />
                    )}
                    <div>
                      <h3 className={`text-lg font-semibold ${respuestaNubefact.error ? 'text-red-700' :
                        'text-green-700'
                        }`}>
                        {respuestaNubefact.error
                          ? 'Error al Enviar'
                          : `${getNombreDocumento(respuestaNubefact.tipo_de_comprobante)} Enviada Exitosamente`
                        }
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
              </>
            )}
          </div>
        )}
      </Modal >

      {/* Modal Consulta Manual */}
      < Modal
        isOpen={showModalManual}
        onClose={() => setShowModalManual(false)}
        title="Consultar Documento en SUNAT"
        size="md"
      >
        <form onSubmit={handleConsultaManual} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Tipo Documento</label>
            <select
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-purple-500 focus:border-purple-500"
              value={manualData.tipo}
              onChange={e => setManualData({ ...manualData, tipo: e.target.value })}
            >
              <option value="1">Factura</option>
              <option value="2">Boleta</option>
              <option value="3">Nota de Crédito</option>
              <option value="4">Nota de Débito</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Serie</label>
            <input
              type="text"
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 uppercase focus:ring-purple-500 focus:border-purple-500"
              value={manualData.serie}
              onChange={e => setManualData({ ...manualData, serie: e.target.value.toUpperCase() })}
              placeholder="Ej: F001"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Número</label>
            <input
              type="number"
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-purple-500 focus:border-purple-500"
              value={manualData.numero}
              onChange={e => setManualData({ ...manualData, numero: e.target.value })}
              placeholder="Ej: 123"
            />
          </div>
          <div className="flex justify-end pt-2">
            <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white" disabled={enviandoFactura === 'manual-consult'}>
              {enviandoFactura === 'manual-consult' ? 'Consultando...' : 'Consultar'}
            </Button>
          </div>
        </form>
      </Modal >
      {/* Modal Progreso Masivo */}
      < Modal
        isOpen={showMassModal}
        onClose={() => !isMassProcessing && setShowMassModal(false)}
        title={isMassProcessing ? "Enviando Documentos..." : "Proceso Completado"}
        size="lg"
      >
        <div className="space-y-3">
          {/* Barra de progreso - Arriba */}
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-700">
                {massProgress.current} / {massProgress.total} documentos
              </span>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1 text-green-700">
                  <CheckCircleIcon className="w-4 h-4" />
                  {massProgress.successes} exitosos
                </span>
                <span className="flex items-center gap-1 text-red-700">
                  <XCircleIcon className="w-4 h-4" />
                  {massProgress.errors} errores
                </span>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(massProgress.current / massProgress.total || 0) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Lista de Resultados - Compacta */}
          <div className="bg-white rounded-lg border border-gray-200 max-h-80 overflow-y-auto">
            {massResults.length === 0 ? (
              <div className="p-4 text-center text-gray-400 text-sm">Iniciando envío...</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {massResults.map((res, index) => (
                  <div
                    key={index}
                    className={`p-2.5 hover:bg-gray-50 transition-colors ${res.status === 'success' ? 'bg-green-50/30' : 'bg-red-50/30'
                      }`}
                  >
                    <div className="flex items-center gap-2">
                      {res.status === 'success' ? (
                        <CheckCircleIcon className="w-4 h-4 text-green-600 flex-shrink-0" />
                      ) : (
                        <XCircleIcon className="w-4 h-4 text-red-600 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className={`font-mono text-xs font-semibold ${res.status === 'success' ? 'text-green-900' : 'text-red-900'
                            }`}>
                            {res.doc}
                          </span>
                          <span className={`text-xs truncate ${res.status === 'success' ? 'text-green-700' : 'text-red-700'
                            }`}>
                            {res.message}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {!isMassProcessing && (
            <div className="flex justify-end pt-2">
              <Button onClick={() => setShowMassModal(false)} variant="primary">
                Cerrar
              </Button>
            </div>
          )}
        </div>
      </Modal >

    </div >
  );
};

export default Facturacion;

