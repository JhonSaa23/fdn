import { useState, useEffect } from 'react';
import { useNotification } from '../App';
import Button from '../components/Button';
import Card from '../components/Card';
import { 
  consultarReportePickingProcter, 
  descargarExcelPickingProcter,
  actualizarVistaPickingProcter 
} from '../services/api';

function ReportePickingProcter() {
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(false);
  const [actualizandoVista, setActualizandoVista] = useState(false);
  const [resultados, setResultados] = useState([]);
  const [filtros, setFiltros] = useState({
    anio: new Date().getFullYear(),
    mes: new Date().getMonth() + 1
  });
  
  // Cargar datos al montar el componente
  useEffect(() => {
    handleConsultar();
  }, []);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFiltros(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleActualizarVista = async () => {
    try {
      setActualizandoVista(true);
      
      const resultado = await actualizarVistaPickingProcter(filtros.anio, filtros.mes);
      
      if (!resultado.success) {
        throw new Error(resultado.error || 'Error al actualizar vista');
      }
      
      // Recargar datos después de actualizar la vista
      await handleConsultar();
      
    } catch (error) {
      console.error('Error al actualizar vista:', error);
      showNotification('danger', error.message || 'Error desconocido al actualizar vista');
    } finally {
      setActualizandoVista(false);
    }
  };
  
  const handleConsultar = async (e) => {
    if (e) e.preventDefault();
    
    try {
      setLoading(true);
      
      const resultado = await consultarReportePickingProcter(filtros.anio, filtros.mes);
      
      if (!resultado.success) {
        throw new Error(resultado.error || 'Error al consultar reporte');
      }
      
      setResultados(resultado.data || []);
      
      if (resultado.data?.length === 0) {
        showNotification('info', 'No se encontraron resultados para los filtros aplicados');
      }
    } catch (error) {
      console.error('Error en la consulta:', error);
      showNotification('danger', error.message || 'Error desconocido al consultar');
      setResultados([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDescargarExcel = async () => {
    try {
      setLoading(true);
      const resultado = await descargarExcelPickingProcter(filtros.anio, filtros.mes);
      
      if (!resultado.success) {
        throw new Error(resultado.error || 'Error al descargar Excel');
      }
      
    } catch (error) {
      console.error('Error al descargar Excel:', error);
      showNotification('danger', error.message || 'Error desconocido al descargar Excel');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 w-full">      
      <Card>
        <Card.Body>
          <form onSubmit={handleConsultar} className="space-y-4">
            <div className="flex flex-wrap items-end gap-4">
              <div className="w-full sm:w-auto">
                <label htmlFor="anio" className="block text-sm font-medium text-gray-700 mb-2">
                  Año
                </label>
                <input
                  type="number"
                  id="anio"
                  name="anio"
                  value={filtros.anio}
                  onChange={handleChange}
                  className="block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  min="2000"
                  max="2100"
                />
              </div>
              
              <div className="w-full sm:w-auto">
                <label htmlFor="mes" className="block text-sm font-medium text-gray-700 mb-2">
                  Mes
                </label>
                <select
                  id="mes"
                  name="mes"
                  value={filtros.mes}
                  onChange={handleChange}
                  className="block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                >
                  <option value="1">Enero</option>
                  <option value="2">Febrero</option>
                  <option value="3">Marzo</option>
                  <option value="4">Abril</option>
                  <option value="5">Mayo</option>
                  <option value="6">Junio</option>
                  <option value="7">Julio</option>
                  <option value="8">Agosto</option>
                  <option value="9">Septiembre</option>
                  <option value="10">Octubre</option>
                  <option value="11">Noviembre</option>
                  <option value="12">Diciembre</option>
                </select>
              </div>
              
              <div className="flex space-x-2 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="warning"
                  onClick={handleActualizarVista}
                  disabled={actualizandoVista}
                >
                  {actualizandoVista ? (
                    <>
                      <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                      Actualizando Vista...
                    </>
                  ) : 'Actualizar Vista'}
                </Button>

                <Button
                  type="submit"
                  variant="primary"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                      Consultando...
                    </>
                  ) : 'Actualizar'}
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleDescargarExcel}
                  disabled={loading || resultados.length === 0}
                >
                  Descargar Excel
                </Button>
              </div>
            </div>
          </form>
        </Card.Body>
      </Card>
      
      <Card>
                  <div className="overflow-x-auto max-h-[calc(100vh-180px)]">
          <table className="min-w-full divide-y divide-gray-200 table-fixed">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[120px]">Número</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[120px]">Documento</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[300px]">Vendedor</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[120px]">Código Producto</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {resultados.length > 0 ? (
                resultados.map((item, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.Numero}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.Documento}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 overflow-hidden text-ellipsis">{item.Vendedor}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.Codpro}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
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

export default ReportePickingProcter; 
