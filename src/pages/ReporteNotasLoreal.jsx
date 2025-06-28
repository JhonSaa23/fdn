import { useState, useEffect } from 'react';
import { useNotification } from '../App';
import Button from '../components/Button';
import Card from '../components/Card';
import { 
  consultarReporteNotasLoreal, 
  descargarExcelNotasLoreal,
  actualizarVistaNotasLoreal 
} from '../services/api';
import axios from 'axios';

function ReporteNotasLoreal() {
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(false);
  const [actualizandoVista, setActualizandoVista] = useState(false);
  const [resultados, setResultados] = useState([]);
  const [filtros, setFiltros] = useState({ anio: 2025, mes: '' });
  
  // Al montar, cargar automáticamente los datos de la vista actual (sin filtros)
  useEffect(() => {
    handleConsultarVistaSinFiltros();
  }, []);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFiltros(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Consulta la vista sin filtros
  const handleConsultarVistaSinFiltros = async () => {
    try {
      setLoading(true);
      // Llamada sin pasar año ni mes
      const resultado = await consultarReporteNotasLoreal();
      if (!resultado.success) {
        throw new Error(resultado.error || 'Error al consultar reporte');
      }
      setResultados(resultado.data || []);
      if (resultado.data?.length === 0) {
        showNotification('info', 'No se encontraron resultados para la vista actual');
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

  // Ejecuta el procedimiento y luego recarga los datos de la vista (sin filtros)
  const handleActualizarVista = async () => {
    try {
      setActualizandoVista(true);
      if (!filtros.mes) throw new Error('Selecciona un mes');
      const resultado = await actualizarVistaNotasLoreal(filtros.anio, filtros.mes);
      if (!resultado.success) {
        throw new Error(resultado.error || 'Error al actualizar vista');
      }
      showNotification('success', resultado.message || 'Vista actualizada correctamente');
      // Recargar datos de la vista completa
      await handleConsultarVistaSinFiltros();
    } catch (error) {
      console.error('Error al actualizar vista:', error);
      showNotification('danger', error.message || 'Error desconocido al actualizar vista');
    } finally {
      setActualizandoVista(false);
    }
  };

  const handleDescargarExcel = async () => {
    try {
      setLoading(true);
      const resultado = await descargarExcelNotasLoreal(filtros.anio, filtros.mes);
      if (!resultado.success) {
        throw new Error(resultado.error || 'Error al descargar Excel');
      }
      showNotification('success', 'Excel descargado correctamente');
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
          <form className="space-y-4">
            <div className="flex flex-wrap items-end gap-4">
              <div className="w-full sm:w-auto">
                <input
                  type="number"
                  id="anio"
                  name="anio"
                  value={filtros.anio}
                  onChange={handleChange}
                  className="block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  min="2000"
                  max="2100"
                  placeholder="Año"
                />
              </div>
              
              <div className="w-full sm:w-auto">
                <select
                  id="mes"
                  name="mes"
                  value={filtros.mes}
                  onChange={handleChange}
                  className="block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                >
                  <option value="">Seleccione mes</option>
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
                  disabled={actualizandoVista || !filtros.mes}
                >
                  {actualizandoVista ? (
                    <>
                      <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                      Actualizando Vista...
                    </>
                  ) : 'Actualizar Vista'}
                </Button>

                <Button
                  type="button"
                  variant="success"
                  onClick={handleDescargarExcel}
                  disabled={loading || resultados.length === 0}
                >
                  {loading ? (
                    <>
                      <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                      Descargando...
                    </>
                  ) : 'Descargar Excel'}
                </Button>
              </div>
            </div>
          </form>
        </Card.Body>
      </Card>
      
      <Card>
                  <div className="overflow-x-auto max-h-[calc(100vh-150px)]">
          <table className="min-w-full divide-y divide-gray-200 table-fixed">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase">Número</th>
                <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase">Observación</th>
                <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase">Código Cliente</th>
                <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase">Documento</th>
                <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase">Razón Social</th>
                <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase">Vendedor</th>
                <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase">Código Producto</th>
                <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase">Producto</th>
                <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase">Lote</th>
                <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase">Vencimiento</th>
                <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase">Precio</th>
                <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase">Descuento 1</th>
                <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase">Descuento 2</th>
                <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase">Descuento 3</th>
                <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase">Subtotal</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {resultados.length > 0 ? (
                resultados.map((item, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-2 text-sm text-gray-900">{item.Numero}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">{item.Observacion}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">{item.Codclie}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">{item.Documento}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">{item.Razon}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">{item.Vendedor}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">{item.Codpro}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">{item.Nombre}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">{item.Lote}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">{item.Vencimiento}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">{item.Cantidad}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">{item.Precio}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">{item.Descuento1}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">{item.Descuento2}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">{item.Descuento3}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">{item.Subtotal}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="16" className="px-4 py-2 text-sm text-gray-500 text-center">
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

export default ReporteNotasLoreal; 