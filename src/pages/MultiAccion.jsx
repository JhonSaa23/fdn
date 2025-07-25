import { useState } from 'react';
import { useNotification } from '../App';
import Card from '../components/Card';
import Modal from '../components/Modal';
import { 
  buscarPedido, 
  invalidarPedido, 
  buscarGuia, 
  reusarGuia, 
  autorizarCodigos,
  buscarGuiasPorSerie
} from '../services/api';

function MultiAccion() {
  const { showNotification } = useNotification();
  
  // Estados para los inputs
  const [numeroPedido, setNumeroPedido] = useState('');
  const [numeroGuia, setNumeroGuia] = useState('');
  const [codigosAutorizar, setCodigosAutorizar] = useState('');
  const [serieGuia, setSerieGuia] = useState('');
  
  // Estados para los resultados
  const [resultadoPedido, setResultadoPedido] = useState(null);
  const [resultadoGuia, setResultadoGuia] = useState(null);
  const [guiasSerie, setGuiasSerie] = useState([]);
  const [showPedidoModal, setShowPedidoModal] = useState(false);
  const [showGuiaModal, setShowGuiaModal] = useState(false);
  const [showSerieModal, setShowSerieModal] = useState(false);
  
  // Estados de carga
  const [loadingPedido, setLoadingPedido] = useState(false);
  const [loadingGuia, setLoadingGuia] = useState(false);
  const [loadingAutorizar, setLoadingAutorizar] = useState(false);
  const [loadingSerie, setLoadingSerie] = useState(false);

  // Función para buscar pedido
  const handleBuscarPedido = async () => {
    if (!numeroPedido.trim()) {
      showNotification('warning', 'Por favor ingresa un número de pedido');
      return;
    }

    setLoadingPedido(true);
    try {
      const data = await buscarPedido(numeroPedido);
      setResultadoPedido(data);
      setShowPedidoModal(true);
    } catch (error) {
      if (error.status === 404) {
        showNotification('warning', error.message);
      } else {
        showNotification('danger', error.message);
      }
    } finally {
      setLoadingPedido(false);
    }
  };

  // Función para invalidar pedido
  const handleInvalidarPedido = async () => {
    try {
      await invalidarPedido(numeroPedido);
      setShowPedidoModal(false);
      setResultadoPedido(null);
      setNumeroPedido('');
    } catch (error) {
      showNotification('danger', error.message);
    }
  };

  // Función para buscar guía
  const handleBuscarGuia = async () => {
    if (!numeroGuia.trim()) {
      showNotification('warning', 'Por favor ingresa un número de guía');
      return;
    }

    setLoadingGuia(true);
    try {
      const data = await buscarGuia(numeroGuia);
      setResultadoGuia(data);
      setShowGuiaModal(true);
    } catch (error) {
      if (error.status === 404) {
        showNotification('warning', error.message);
      } else {
        showNotification('danger', error.message);
      }
    } finally {
      setLoadingGuia(false);
    }
  };

  // Función para reusar guía
  const handleReusarGuia = async () => {
    try {
      await reusarGuia(numeroGuia);
      setShowGuiaModal(false);
      setResultadoGuia(null);
      setNumeroGuia('');
    } catch (error) {
      showNotification('danger', error.message);
    }
  };

  // Función para autorizar códigos
  const handleAutorizarCodigos = async () => {
    if (!codigosAutorizar.trim()) {
      showNotification('warning', 'Por favor ingresa al menos un código');
      return;
    }

    setLoadingAutorizar(true);
    try {
      const result = await autorizarCodigos(codigosAutorizar);
      
      if (result.autorizados === result.total) {
        // Éxito silencioso
      } else if (result.autorizados > 0) {
        showNotification('warning', result.message);
      } else {
        showNotification('danger', result.message);
      }
      
      setCodigosAutorizar('');
    } catch (error) {
      showNotification('danger', error.message);
    } finally {
      setLoadingAutorizar(false);
    }
  };

  // Función para buscar guías por serie
  const handleBuscarGuiasPorSerie = async () => {
    if (!serieGuia.trim()) {
      showNotification('warning', 'Por favor ingresa una serie');
      return;
    }

    setLoadingSerie(true);
    try {
      const result = await buscarGuiasPorSerie(serieGuia);
      setGuiasSerie(result.data);
      setShowSerieModal(true);
    } catch (error) {
      if (error.status === 400) {
        showNotification('warning', error.message);
      } else {
        showNotification('danger', error.message);
      }
    } finally {
      setLoadingSerie(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold mb-6">Multi Acción</h2>

      {/* Módulo de Pedidos */}
      <Card>
        <Card.Header>
          <Card.Title>Gestión de Pedidos</Card.Title>
        </Card.Header>
        <Card.Body>
          <div className="flex gap-4">
            <input
              type="text"
              value={numeroPedido}
              onChange={(e) => setNumeroPedido(e.target.value)}
              placeholder="Número de pedido"
              className="block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              onKeyPress={(e) => e.key === 'Enter' && handleBuscarPedido()}
            />
            <button
              onClick={handleBuscarPedido}
              disabled={loadingPedido}
              className="btn btn-primary min-w-[100px]"
            >
              {loadingPedido ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Buscando...
                </div>
              ) : (
                'Buscar'
              )}
            </button>
          </div>
        </Card.Body>
      </Card>

      {/* Módulo de Guías */}
      <Card>
        <Card.Header>
          <Card.Title>Gestión de Guías</Card.Title>
        </Card.Header>
        <Card.Body>
          <div className="space-y-4">
            {/* Búsqueda de guía individual */}
            <div className="flex gap-4">
              <input
                type="text"
                value={numeroGuia}
                onChange={(e) => setNumeroGuia(e.target.value)}
                placeholder="Número de guía (T001-XXXXX)"
                className="block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                onKeyPress={(e) => e.key === 'Enter' && handleBuscarGuia()}
              />
              <button
                onClick={handleBuscarGuia}
                disabled={loadingGuia}
                className="btn btn-primary min-w-[100px]"
              >
                {loadingGuia ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Buscando...
                  </div>
                ) : (
                  'Buscar'
                )}
              </button>
            </div>
            
            {/* Búsqueda de guías por serie */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Buscar por Serie</h4>
              <div className="flex gap-4">
                <input
                  type="text"
                  value={serieGuia}
                  onChange={(e) => setSerieGuia(e.target.value.toUpperCase())}
                  placeholder="Serie (ej: T001, T002)"
                  className="block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  onKeyPress={(e) => e.key === 'Enter' && handleBuscarGuiasPorSerie()}
                />
                <button
                  onClick={handleBuscarGuiasPorSerie}
                  disabled={loadingSerie}
                  className="btn btn-secondary min-w-[120px]"
                >
                  {loadingSerie ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Buscando...
                    </div>
                  ) : (
                    'Buscar Serie'
                  )}
                </button>
              </div>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Módulo de Autorización de Códigos */}
      <Card>
        <Card.Header>
          <Card.Title>Autorización de Códigos</Card.Title>
        </Card.Header>
        <Card.Body>
          <div className="space-y-3">
            <textarea
              value={codigosAutorizar}
              onChange={(e) => setCodigosAutorizar(e.target.value)}
              placeholder="Ingresa uno o más códigos separados por comas&#10;Ejemplo: COD001, COD002, COD003"
              rows={3}
              className="block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-primary-500 focus:ring-primary-500 resize-none"
            />
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600">
                {codigosAutorizar.trim() ? 
                  `${codigosAutorizar.split(',').filter(c => c.trim()).length} código(s) detectado(s)` : 
                  'Separa múltiples códigos con comas'
                }
              </p>
              <button
                onClick={handleAutorizarCodigos}
                disabled={loadingAutorizar}
                className="btn btn-primary min-w-[120px]"
              >
                {loadingAutorizar ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Autorizando...
                  </div>
                ) : (
                  'Autorizar'
                )}
              </button>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Modal para Pedidos */}
      <Modal
        isOpen={showPedidoModal}
        onClose={() => setShowPedidoModal(false)}
        title="Información del Pedido"
        size="lg"
      >
        <Modal.Body>
          {resultadoPedido && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">Número:</span>
                    <span className="text-gray-900">{resultadoPedido.Numero}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">Laboratorio:</span>
                    <span className="text-gray-900">{resultadoPedido.Laboratorio}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">Proveedor:</span>
                    <span className="text-gray-900">{resultadoPedido.Proveedor || 'No especificado'}</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">Fecha Pedido:</span>
                    <span className="text-gray-900">
                      {resultadoPedido.FechaPed ? new Date(resultadoPedido.FechaPed).toLocaleDateString() : 'No especificada'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">Fecha Recepción:</span>
                    <span className="text-gray-900">
                      {resultadoPedido.FechaRec ? new Date(resultadoPedido.FechaRec).toLocaleDateString() : 'No especificada'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">Fecha Anterior:</span>
                    <span className="text-gray-900">
                      {resultadoPedido.FechaAnt ? new Date(resultadoPedido.FechaAnt).toLocaleDateString() : 'No especificada'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-700">Estado:</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      Number(resultadoPedido.Validado) === 1 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {Number(resultadoPedido.Validado) === 1 ? 'Validado' : 'Por validar'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-700">Eliminado:</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      Number(resultadoPedido.Eliminado) === 1 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {Number(resultadoPedido.Eliminado) === 1 ? 'Sí' : 'No'}
                    </span>
                  </div>
                </div>
              </div>
              
              {resultadoPedido.Observaciones && (
                <div className="border-t pt-4">
                  <span className="font-medium text-gray-700">Observaciones:</span>
                  <p className="mt-1 text-gray-900 bg-gray-50 p-3 rounded-lg">{resultadoPedido.Observaciones}</p>
                </div>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          {resultadoPedido && Number(resultadoPedido.Validado) === 1 && (
            <button
              onClick={handleInvalidarPedido}
              className="btn btn-danger"
            >
              Invalidar Pedido
            </button>
          )}
          <button
            onClick={() => setShowPedidoModal(false)}
            className="btn btn-secondary"
          >
            Cerrar
          </button>
        </Modal.Footer>
      </Modal>

      {/* Modal para Guías */}
      <Modal
        isOpen={showGuiaModal}
        onClose={() => setShowGuiaModal(false)}
        title="Información de la Guía"
        size="md"
      >
        <Modal.Body>
          {resultadoGuia && (
            <div className="text-center py-4">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Guía encontrada</h3>
              <p className="text-sm text-gray-600 mb-4">Número: <span className="font-mono text-gray-900">{resultadoGuia.Numero}</span></p>
              <p className="text-sm text-gray-500">¿Deseas reusar esta guía?</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <button
            onClick={handleReusarGuia}
            className="btn btn-warning"
          >
            Reusar Guía
          </button>
          <button
            onClick={() => setShowGuiaModal(false)}
            className="btn btn-secondary"
          >
            Cancelar
          </button>
        </Modal.Footer>
      </Modal>

      {/* Modal para Guías por Serie */}
      <Modal
        isOpen={showSerieModal}
        onClose={() => setShowSerieModal(false)}
        title={`Guías de la Serie ${serieGuia}`}
        size="xl"
      >
        <Modal.Body>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600">
                Mostrando los últimos 50 registros de la serie <span className="font-mono font-medium">{serieGuia}</span>
              </p>
              <span className="text-sm text-gray-500">
                Total: {guiasSerie.length} guías
              </span>
            </div>
            
            {guiasSerie.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Número</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doc. Venta</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Empresa</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">RUC</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Placa</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Peso</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {guiasSerie.map((guia, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-3 py-2 whitespace-nowrap text-sm font-mono text-gray-900">
                          {guia.Numero}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                          {guia.Docventa}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                          {guia.Fecha}
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-900 max-w-xs truncate" title={guia.Empresa}>
                          {guia.Empresa}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                          {guia.Ruc}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                          {guia.Placa}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                          {guia.Peso}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="flex space-x-1">
                            {guia.Eliminado === 1 && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                Eliminado
                              </span>
                            )}
                            {guia.Impreso === 1 && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Impreso
                              </span>
                            )}
                            {guia.Eliminado === 0 && guia.Impreso === 0 && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                Pendiente
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-4">
                  <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron guías</h3>
                <p className="text-sm text-gray-500">No hay registros para la serie especificada</p>
              </div>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button
            onClick={() => setShowSerieModal(false)}
            className="btn btn-secondary"
          >
            Cerrar
          </button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default MultiAccion; 