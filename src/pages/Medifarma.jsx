import { useState, useEffect } from 'react';
import ImportForm from '../components/ImportForm';
import Alert from '../components/Alert';
import Button from '../components/Button';
import { 
  getMedifarmaData, 
  importMedifarmaFile, 
  clearMedifarma, 
  uploadMedifarmaToProd 
} from '../services/api';

function Medifarma() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ show: false, type: '', text: '' });

  // Cargar datos al montar el componente
  useEffect(() => {
    fetchData();
  }, []);

  // Función para obtener datos
  const fetchData = async () => {
    try {
      setLoading(true);
      const result = await getMedifarmaData();
      setData(result);
    } catch (error) {
      setMessage({
        show: true,
        type: 'danger',
        text: 'Error al cargar datos: ' + (error.message || 'Error desconocido')
      });
    } finally {
      setLoading(false);
    }
  };

  // Función para importar archivo
  const handleImport = async (formData) => {
    try {
      const result = await importMedifarmaFile(formData);
      
      if (result.success) {
        fetchData(); // Recargar datos después de la importación
      }
      
      return result;
    } catch (error) {
      throw error;
    }
  };

  // Función para vaciar tabla
  const handleClear = async () => {
    if (!window.confirm('¿Está seguro que desea vaciar la tabla?')) {
      return;
    }
    
    try {
      setLoading(true);
      const result = await clearMedifarma();
      
      setMessage({
        show: true,
        type: result.success ? 'success' : 'danger',
        text: result.message || result.error
      });
      
      if (result.success) {
        fetchData(); // Recargar datos
      }
    } catch (error) {
      setMessage({
        show: true,
        type: 'danger',
        text: 'Error al vaciar tabla: ' + (error.message || 'Error desconocido')
      });
    } finally {
      setLoading(false);
    }
  };

  // Función para subir a producción
  const handleUploadToProd = async () => {
    if (!window.confirm('¿Está seguro que desea subir los datos a producción?')) {
      return;
    }
    
    try {
      setLoading(true);
      const result = await uploadMedifarmaToProd();
      
      setMessage({
        show: true,
        type: result.success ? 'success' : 'danger',
        text: result.message || result.error
      });
    } catch (error) {
      setMessage({
        show: true,
        type: 'danger',
        text: 'Error al subir a producción: ' + (error.message || 'Error desconocido')
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h3 className="text-xl font-semibold mb-4">Importar archivo XLSX - MEDIFARMA</h3>
      
      {message.show && (
        <Alert 
          variant={message.type} 
          onClose={() => setMessage({ ...message, show: false })} 
          dismissible
        >
          {message.text}
        </Alert>
      )}
      
      <div className="flex space-x-4 mb-6">
        <Button variant="danger" onClick={handleClear}>Vaciar</Button>
        <Button variant="warning" onClick={handleUploadToProd}>Subir a MedifarmaProd</Button>
      </div>
      
      <div className="grid grid-cols-1">
        <div className="col-span-1">
          <ImportForm 
            onImportClick={handleImport} 
            title="Importar archivo XLSX - MEDIFARMA" 
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
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">COD_PROM</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DESC_CAB</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CANAL</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">FECDES</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">FECHAS</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CODOFERTA</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DESC_DET</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">COD_PRO</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DESCRIP</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PORCEN</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.length > 0 ? (
                    data.map((item, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.codprom}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.desc_cab}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.canal}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.fecdes}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.fechas}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.codoferta}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.desc_det}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.codprod}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.descrip}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.porcen}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="10" className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
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

export default Medifarma; 