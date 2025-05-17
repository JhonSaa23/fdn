import { useState, useEffect } from 'react';
import ImportForm from '../components/ImportForm';
import Button from '../components/Button';
import { useNotification } from '../App';

function BBVA() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const { showNotification } = useNotification();

  // Esta función se implementará cuando creemos las rutas del backend
  const fetchData = async () => {
    try {
      setLoading(true);
      setData([]); // Por ahora lo dejamos vacío
    } catch (error) {
      showNotification('danger', 'Error al cargar datos: ' + (error.message || 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  // Manejador de importación temporal
  const handleImport = async (formData) => {
    return { success: true, message: 'Función no implementada aún' };
  };

  return (
    <div>
      <h3 className="text-xl font-semibold mb-4">Importar archivo XLSX - BBVA</h3>
      
      <div className="flex space-x-4 mb-6">
        <Button variant="danger">Vaciar</Button>
        <Button variant="warning">Subir a BBVAProd</Button>
      </div>
      
      <div className="grid grid-cols-1">
        <div className="col-span-1">
          <ImportForm 
            onImportClick={handleImport} 
            title="Importar archivo XLSX - BBVA" 
          />
          
          {loading ? (
            <div className="flex justify-center my-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <span className="sr-only">Cargando...</span>
            </div>
          ) : (
            <div className="overflow-x-auto mt-4">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.length > 0 ? (
                    data.map((item, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.codigo}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.descripcion}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.fecha}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.valor}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                        No hay datos disponibles
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default BBVA; 