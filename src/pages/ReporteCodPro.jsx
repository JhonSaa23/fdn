import { useState } from 'react';
import { useNotification } from '../App';
import Button from '../components/Button';
import Card from '../components/Card';
import { consultarReporteCodPro } from '../services/api';

function ReporteCodPro() {
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(false);
  const [resultados, setResultados] = useState([]);
  const [filtros, setFiltros] = useState({
    codProducto: '', // Valor por defecto
    fechaInicio: '',
    fechaFin: ''
  });
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFiltros(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleConsultar = async (e) => {
    e.preventDefault();
    
    // Validar que se ha ingresado el código de producto
    if (!filtros.codProducto) {
      showNotification('warning', 'El código de producto es obligatorio');
      return;
    }
    
    try {
      setLoading(true);
      
      const resultado = await consultarReporteCodPro(filtros);
      
      if (!resultado.success) {
        throw new Error(resultado.error || 'Error al consultar reporte');
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
  
  const handleLimpiar = () => {
    setFiltros({
      codProducto: '01053',
      fechaInicio: '',
      fechaFin: ''
    });
    setResultados([]);
  };

  return (
    <div className="space-y-6 w-full">      
      <Card>
        <Card.Body>
          <form onSubmit={handleConsultar} className="space-y-4">
            <div className="flex flex-wrap items-end gap-4">
              <div className="w-full sm:w-64">
                <label htmlFor="codProducto" className="block text-sm font-medium text-gray-700 mb-2">
                  Código de Producto
                </label>
                <input
                  type="text"
                  id="codProducto"
                  name="codProducto"
                  value={filtros.codProducto}
                  onChange={handleChange}
                  className="block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  placeholder="Ej: 01053"
                />
              </div>
              
              <div className="w-full sm:w-auto">
                <label htmlFor="fechaInicio" className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha Inicio
                </label>
                <input
                  type="date"
                  id="fechaInicio"
                  name="fechaInicio"
                  value={filtros.fechaInicio}
                  onChange={handleChange}
                  className="block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>
              
              <div className="w-full sm:w-auto">
                <label htmlFor="fechaFin" className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha Fin
                </label>
                <input
                  type="date"
                  id="fechaFin"
                  name="fechaFin"
                  value={filtros.fechaFin}
                  onChange={handleChange}
                  className="block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>
              
              <div className="flex space-x-2 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleLimpiar}
                >
                  Limpiar
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
                  ) : 'Consultar'}
                </Button>
              </div>
            </div>
          </form>
        </Card.Body>
      </Card>
      
      {/* Tabla de resultados - estructura exactamente igual a BCP.jsx */}
      <Card>
                  <div className="overflow-x-auto max-h-[calc(100vh-180px)]" style={{ width: '100%', maxWidth: '100%' }}>
          <table className="min-w-full divide-y divide-gray-200 table-fixed">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[120px]">Pedido</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[120px]">Fecha</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[120px]">RUC</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[300px]">Razón Social</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[80px]">Cantidad</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[100px]">Precio</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[80px]">Dscto1</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[80px]">Dscto2</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[80px]">Dscto3</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {resultados.length > 0 ? (
                resultados.map((item, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.Pedido}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.Fecha}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.RUC}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 overflow-hidden text-ellipsis">{item.RazonSocial}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.Cantidad}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.Precio}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.Dscto1}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.Dscto2}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.Dscto3}</td>
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

export default ReporteCodPro; 