import { useState } from 'react';
import { useNotification } from '../App';
import Button from '../components/Button';
import Card from '../components/Card';
import { consultarMovimientos, eliminarMovimientos } from '../services/api';

function ConsultaMovimientos({ onBack, showBackButton = false }) {
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [resultados, setResultados] = useState([]);
  const [filtros, setFiltros] = useState({
    banco: '',
    fecha: '',
    sucursal: '',
    operacion: '',
    hora: '',
    vendedor: '',
    procesado: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFiltros(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleConsultar = async (e) => {
    if (e) {
      e.preventDefault();
    }

    // Verificar si hay al menos un filtro
    const hayFiltros = Object.values(filtros).some(valor => valor !== '');

    if (!hayFiltros) {
      if (!confirm('¿Está seguro de consultar sin filtros? Esto podría traer muchos registros.')) {
        return;
      }
    }

    try {
      setLoading(true);

      // Filtrar campos vacíos para no incluirlos en la consulta
      const filtrosValidos = Object.entries(filtros)
        .filter(([_, value]) => value !== '')
        .reduce((obj, [key, value]) => {
          obj[key] = value;
          return obj;
        }, {});

      const resultado = await consultarMovimientos(filtrosValidos);

      if (!resultado.success) {
        throw new Error(resultado.error || 'Error al consultar movimientos');
      }

      setResultados(resultado.data || []);

      if (resultado.data?.length === 0) {
        showNotification('info', 'No se encontraron resultados para los filtros aplicados');
      } else {
        showNotification('success', `Se encontraron ${resultado.data.length} registros`);
      }
    } catch (error) {
      console.error('Error en la consulta:', error);
      showNotification('danger', error.message || 'Error desconocido al consultar');
      setResultados([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = async () => {
    // Verificar si hay resultados para eliminar
    if (resultados.length === 0) {
      showNotification('warning', 'No hay registros para eliminar. Realice una consulta primero.');
      return;
    }

    // Pedir confirmación al usuario
    if (!confirm(`¿Está seguro de eliminar ${resultados.length} registro(s)? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      setEliminando(true);

      // Filtrar campos vacíos para no incluirlos en la consulta
      const filtrosValidos = Object.entries(filtros)
        .filter(([_, value]) => value !== '')
        .reduce((obj, [key, value]) => {
          obj[key] = value;
          return obj;
        }, {});

      const resultado = await eliminarMovimientos(filtrosValidos);

      if (!resultado.success) {
        throw new Error(resultado.error || 'Error al eliminar movimientos');
      }

      showNotification('success', `Se eliminaron ${resultado.afectados || 0} registro(s) correctamente`);
      
      // Actualizar la lista después de eliminar
      setResultados([]);
      
    } catch (error) {
      console.error('Error al eliminar:', error);
      showNotification('danger', error.message || 'Error desconocido al eliminar');
    } finally {
      setEliminando(false);
    }
  };

  const handleLimpiar = () => {
    setFiltros({
      banco: '',
      fecha: '',
      sucursal: '',
      operacion: '',
      hora: '',
      vendedor: '',
      procesado: ''
    });
    setResultados([]);
  };

  return (
    <div className="space-y-6">

      <Card>
        <Card.Body>
          {showBackButton && (
            <div className='flex justify-between items-center '>
              <div className="flex items-center mb-4">
                <Button
                  variant="secondary"
                  onClick={onBack}
                  className="flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                  </svg>
                  Atrás
                </Button>
                <h1 className="text-xl font-bold ml-4">Consulta de Movimientos</h1>
              </div>
              <div className="flex justify-end space-x-3 mb-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleLimpiar}
                >
                  Limpiar
                </Button>

                <Button
                  type="button"
                  variant="primary"
                  onClick={handleConsultar}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                      Consultando...
                    </>
                  ) : 'Consultar'}
                </Button>

                <Button
                  type="button"
                  variant="danger"
                  onClick={handleEliminar}
                  disabled={eliminando || resultados.length === 0}
                >
                  {eliminando ? (
                    <>
                      <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                      Eliminando...
                    </>
                  ) : 'Eliminar'}
                </Button>
              </div>
            </div>
          )}

          {!showBackButton && (
            <div className='flex justify-between items-center mb-4'>
              <h1 className="text-xl font-bold">Consulta de Movimientos</h1>
              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleLimpiar}
                >
                  Limpiar
                </Button>

                <Button
                  type="button"
                  variant="primary"
                  onClick={handleConsultar}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                      Consultando...
                    </>
                  ) : 'Consultar'}
                </Button>

                <Button
                  type="button"
                  variant="danger"
                  onClick={handleEliminar}
                  disabled={eliminando || resultados.length === 0}
                >
                  {eliminando ? (
                    <>
                      <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                      Eliminando...
                    </>
                  ) : 'Eliminar'}
                </Button>
              </div>
            </div>
          )}

          <form className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-x-4 gap-y-4">
              
              <div>
                <label htmlFor="fecha" className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha
                </label>
                <input
                  type="date"
                  id="fecha"
                  name="fecha"
                  value={filtros.fecha}
                  onChange={handleChange}
                  className="block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>
              <div>
                <label htmlFor="sucursal" className="block text-sm font-medium text-gray-700 mb-2">
                  Sucursal
                </label>
                <input
                  type="text"
                  id="sucursal"
                  name="sucursal"
                  value={filtros.sucursal}
                  onChange={handleChange}
                  className="block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  placeholder="Ej: 000-000"
                />
              </div>
              <div>
                <label htmlFor="operacion" className="block text-sm font-medium text-gray-700 mb-2">
                  Operación
                </label>
                <input
                  type="text"
                  id="operacion"
                  name="operacion"
                  value={filtros.operacion}
                  onChange={handleChange}
                  className="block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>
              <div>
                <label htmlFor="hora" className="block text-sm font-medium text-gray-700 mb-2">
                  Hora
                </label>
                <input
                  type="time"
                  id="hora"
                  name="hora"
                  value={filtros.hora}
                  onChange={handleChange}
                  className="block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>
              <div>
                <label htmlFor="vendedor" className="block text-sm font-medium text-gray-700 mb-2">
                  Vendedor
                </label>
                <input
                  type="text"
                  id="vendedor"
                  name="vendedor"
                  value={filtros.vendedor}
                  onChange={handleChange}
                  className="block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>
              <div>
                <label htmlFor="procesado" className="block text-sm font-medium text-gray-700 mb-2">
                  Procesado
                </label>
                <select
                  id="procesado"
                  name="procesado"
                  value={filtros.procesado}
                  onChange={handleChange}
                  className="block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                >
                  <option value="">Todos</option>
                  <option value="1">Sí</option>
                  <option value="0">No</option>
                </select>
              </div>
            </div>
          </form>
        </Card.Body>
      </Card>

      <Card>
        <div className="overflow-x-auto max-h-[calc(100vh-300px)]">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Banco</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sucursal</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Operación</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hora</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendedor</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Procesado</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {resultados.length > 0 ? (
                resultados.map((item, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.Banco}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.Fecha}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.Descripcion}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.Monto}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.Sucursal}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.Operacion}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.Hora}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.Vendedor}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.Procesado === 1 ? 'Sí' : item.Procesado === 0 ? 'No' : '—'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                    {loading ? 'Cargando resultados...' : 'No hay datos disponibles'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

export default ConsultaMovimientos; 