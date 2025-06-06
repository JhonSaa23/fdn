import { useState } from 'react';
import { useNotification } from '../App';
import Card from '../components/Card';

function MultiAccion() {
  const { showNotification } = useNotification();
  
  // Estados para los inputs
  const [numeroPedido, setNumeroPedido] = useState('');
  const [numeroGuia, setNumeroGuia] = useState('');
  const [codigoAutorizar, setCodigoAutorizar] = useState('');
  
  // Estados para los resultados
  const [resultadoPedido, setResultadoPedido] = useState(null);
  const [resultadoGuia, setResultadoGuia] = useState(null);
  const [showPedidoModal, setShowPedidoModal] = useState(false);
  const [showGuiaModal, setShowGuiaModal] = useState(false);

  // Función para buscar pedido
  const buscarPedido = async () => {
    try {
      const response = await fetch(`/api/multi-accion/pedido/${numeroPedido}`);
      const data = await response.json();
      
      if (data) {
        setResultadoPedido(data);
        setShowPedidoModal(true);
      } else {
        showNotification('warning', 'No se encontró el pedido');
      }
    } catch (error) {
      showNotification('danger', 'Error al buscar el pedido');
    }
  };

  // Función para invalidar pedido
  const invalidarPedido = async () => {
    try {
      const response = await fetch(`/api/multi-accion/pedido/${numeroPedido}/invalidar`, {
        method: 'POST'
      });
      
      if (response.ok) {
        showNotification('success', 'Pedido invalidado correctamente');
        setShowPedidoModal(false);
        setResultadoPedido(null);
        setNumeroPedido('');
      }
    } catch (error) {
      showNotification('danger', 'Error al invalidar el pedido');
    }
  };

  // Función para buscar guía
  const buscarGuia = async () => {
    try {
      const response = await fetch(`/api/multi-accion/guia/${numeroGuia}`);
      const data = await response.json();
      
      if (data) {
        setResultadoGuia(data);
        setShowGuiaModal(true);
      } else {
        showNotification('warning', 'No se encontró la guía');
      }
    } catch (error) {
      showNotification('danger', 'Error al buscar la guía');
    }
  };

  // Función para reusar guía
  const reusarGuia = async () => {
    try {
      const response = await fetch(`/api/multi-accion/guia/${numeroGuia}/reusar`, {
        method: 'POST'
      });
      
      if (response.ok) {
        showNotification('success', 'Guía reusada correctamente');
        setShowGuiaModal(false);
        setResultadoGuia(null);
        setNumeroGuia('');
      }
    } catch (error) {
      showNotification('danger', 'Error al reusar la guía');
    }
  };

  // Función para autorizar código
  const autorizarCodigo = async () => {
    try {
      const response = await fetch('/api/multi-accion/autorizar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ codigo: codigoAutorizar })
      });
      
      if (response.ok) {
        showNotification('success', 'Código autorizado correctamente');
        setCodigoAutorizar('');
      }
    } catch (error) {
      showNotification('danger', 'Error al autorizar el código');
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
            />
            <button
              onClick={buscarPedido}
              className="btn btn-primary"
            >
              Buscar
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
          <div className="flex gap-4">
            <input
              type="text"
              value={numeroGuia}
              onChange={(e) => setNumeroGuia(e.target.value)}
              placeholder="Número de guía (T001-XXXXX)"
              className="block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            />
            <button
              onClick={buscarGuia}
              className="btn btn-primary"
            >
              Buscar
            </button>
          </div>
        </Card.Body>
      </Card>

      {/* Módulo de Autorización de Códigos */}
      <Card>
        <Card.Header>
          <Card.Title>Autorización de Códigos</Card.Title>
        </Card.Header>
        <Card.Body>
          <div className="flex gap-4">
            <input
              type="text"
              value={codigoAutorizar}
              onChange={(e) => setCodigoAutorizar(e.target.value)}
              placeholder="Código a autorizar"
              className="block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            />
            <button
              onClick={autorizarCodigo}
              className="btn btn-primary"
            >
              Autorizar
            </button>
          </div>
        </Card.Body>
      </Card>

      {/* Modal para Pedidos */}
      {showPedidoModal && resultadoPedido && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Resultado del Pedido</h3>
            <div className="mb-4 space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <p><strong>Número:</strong> {resultadoPedido.Numero}</p>
                <p><strong>Laboratorio:</strong> {resultadoPedido.Laboratorio}</p>
                <p><strong>Fecha Pedido:</strong> {resultadoPedido.FechaPed ? new Date(resultadoPedido.FechaPed).toLocaleDateString() : 'No especificada'}</p>
                <p><strong>Fecha Recepción:</strong> {resultadoPedido.FechaRec ? new Date(resultadoPedido.FechaRec).toLocaleDateString() : 'No especificada'}</p>
                <p><strong>Fecha Anterior:</strong> {resultadoPedido.FechaAnt ? new Date(resultadoPedido.FechaAnt).toLocaleDateString() : 'No especificada'}</p>
                <p>
                  <strong>Validado:</strong>{' '}
                  <span className={Number(resultadoPedido.Validado) === 1 ? 'text-green-600' : 'text-yellow-600'}>
                    {Number(resultadoPedido.Validado) === 1 ? 'Si' : 'Por validar'}
                  </span>
                </p>
                <p>
                  <strong>Eliminado:</strong>{' '}
                  <span className={Number(resultadoPedido.Eliminado) === 1 ? 'text-red-600' : 'text-green-600'}>
                    {Number(resultadoPedido.Eliminado) === 1 ? 'Si' : 'No'}
                  </span>
                </p>
                <p><strong>Proveedor:</strong> {resultadoPedido.Proveedor || 'No especificado'}</p>
              </div>
              {resultadoPedido.Observaciones && (
                <p className="col-span-2"><strong>Observaciones:</strong> {resultadoPedido.Observaciones}</p>
              )}
            </div>
            <div className="flex justify-end gap-4">
              {Number(resultadoPedido.Validado) === 1 && (
                <button
                  onClick={invalidarPedido}
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
            </div>
          </div>
        </div>
      )}

      {/* Modal para Guías */}
      {showGuiaModal && resultadoGuia && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Resultado de la Guía</h3>
            <div className="mb-4">
              <p><strong>Número:</strong> {resultadoGuia.Numero}</p>
            </div>
            <div className="flex justify-end gap-4">
              <button
                onClick={reusarGuia}
                className="btn btn-warning"
              >
                Reusar Guía
              </button>
              <button
                onClick={() => setShowGuiaModal(false)}
                className="btn btn-secondary"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MultiAccion; 