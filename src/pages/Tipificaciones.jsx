import { useState, useEffect } from 'react';
import Card from '../components/Card';
import Alert from '../components/Alert';
import Button from '../components/Button';
import { 
  getTipificacionesData, 
  getDescuentosLaboratorio, 
  importTipificacionesClientes, 
  importDescuentosLaboratorio, 
  procesarTipificacion, 
  resetTipificaciones 
} from '../services/api';

function Tipificaciones() {
  const [clientes, setClientes] = useState([]);
  const [descuentos, setDescuentos] = useState([]);
  const [laboratorio, setLaboratorio] = useState('');
  const [loading, setLoading] = useState(false);
  const [clientesLoading, setClientesLoading] = useState(false);
  const [descuentosLoading, setDescuentosLoading] = useState(false);
  const [message, setMessage] = useState({ show: false, type: '', text: '' });
  const [clienteFile, setClienteFile] = useState(null);
  const [descuentoFile, setDescuentoFile] = useState(null);

  // Cargar datos al montar el componente
  useEffect(() => {
    fetchData();
  }, []);

  // Función para obtener datos 
  const fetchData = async () => {
    setLoading(true);
    try {
      // Cargar tipificaciones de clientes
      const clientesData = await getTipificacionesData();
      setClientes(clientesData);
      
      // Cargar descuentos por laboratorio
      const descuentosData = await getDescuentosLaboratorio();
      setDescuentos(descuentosData);
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

  // Importar archivo de clientes
  const handleImportClientes = async (e) => {
    e.preventDefault();
    if (!clienteFile) {
      setMessage({
        show: true,
        type: 'warning',
        text: 'Debe seleccionar un archivo'
      });
      return;
    }

    setClientesLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', clienteFile);
      
      const result = await importTipificacionesClientes(formData);
      
      setMessage({
        show: true,
        type: 'success',
        text: result.message
      });
      
      // Recargar datos
      const clientesData = await getTipificacionesData();
      setClientes(clientesData);
      
      // Limpiar archivo seleccionado
      setClienteFile(null);
      document.getElementById('clienteFile').value = '';
    } catch (error) {
      setMessage({
        show: true,
        type: 'danger',
        text: 'Error al importar archivo de clientes: ' + (error.message || 'Error desconocido')
      });
    } finally {
      setClientesLoading(false);
    }
  };

  // Importar archivo de descuentos
  const handleImportDescuentos = async (e) => {
    e.preventDefault();
    if (!descuentoFile) {
      setMessage({
        show: true,
        type: 'warning',
        text: 'Debe seleccionar un archivo'
      });
      return;
    }

    setDescuentosLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', descuentoFile);
      
      const result = await importDescuentosLaboratorio(formData);
      
      setMessage({
        show: true,
        type: 'success',
        text: result.message
      });
      
      // Recargar datos
      const descuentosData = await getDescuentosLaboratorio();
      setDescuentos(descuentosData);
      
      // Limpiar archivo seleccionado
      setDescuentoFile(null);
      document.getElementById('descuentoFile').value = '';
    } catch (error) {
      setMessage({
        show: true,
        type: 'danger',
        text: 'Error al importar archivo de descuentos: ' + (error.message || 'Error desconocido')
      });
    } finally {
      setDescuentosLoading(false);
    }
  };

  // Procesar tipificación
  const handleProcesarTipificacion = async () => {
    if (!laboratorio) {
      setMessage({
        show: true,
        type: 'warning',
        text: 'Debe seleccionar un laboratorio'
      });
      return;
    }

    setLoading(true);
    try {
      const result = await procesarTipificacion(laboratorio);
      
      setMessage({
        show: true,
        type: 'success',
        text: result.message
      });
    } catch (error) {
      setMessage({
        show: true,
        type: 'danger',
        text: 'Error al procesar tipificación: ' + (error.message || 'Error desconocido')
      });
    } finally {
      setLoading(false);
    }
  };

  // Resetear datos
  const handleReset = async () => {
    if (!confirm('¿Está seguro de resetear todos los datos de tipificaciones?')) {
      return;
    }

    setLoading(true);
    try {
      const result = await resetTipificaciones();
      
      setMessage({
        show: true,
        type: 'success',
        text: result.message
      });
      
      // Recargar datos
      fetchData();
    } catch (error) {
      setMessage({
        show: true,
        type: 'danger',
        text: 'Error al resetear datos: ' + (error.message || 'Error desconocido')
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h3 className="text-xl font-semibold mb-4">Tipificaciones</h3>
      
      {message.show && (
        <Alert 
          variant={message.type} 
          onClose={() => setMessage({ ...message, show: false })} 
          dismissible
        >
          {message.text}
        </Alert>
      )}
      
      <Card className="mb-6">
        <Card.Body>
          <Card.Title>Seleccionar Laboratorio</Card.Title>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="col-span-2">
              <select
                className="form-select w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                value={laboratorio}
                onChange={(e) => setLaboratorio(e.target.value)}
              >
                <option value="">-- Seleccione Laboratorio --</option>
                <option value="Procter">Procter</option>
                <option value="Haleon">Haleon</option>
              </select>
            </div>
            
            <div className="flex space-x-2">
              <Button 
                variant="danger"
                onClick={handleReset}
                disabled={loading}
              >
                {loading ? 'Reseteando...' : 'Resetear'}
              </Button>
              
              <Button 
                variant="warning"
                onClick={handleProcesarTipificacion}
                disabled={loading || !laboratorio}
              >
                {loading ? 'Procesando...' : 'Procesar Tipificado'}
              </Button>
            </div>
          </div>
        </Card.Body>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Importar Clientes */}
        <Card>
          <Card.Body>
            <Card.Title>Importar Clientes</Card.Title>
            
            <form onSubmit={handleImportClientes}>
              <div className="mb-4">
                <label className="block mb-2">Elija Archivo de Clientes</label>
                <input
                  id="clienteFile"
                  type="file"
                  accept=".xls,.xlsx"
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
                  onChange={(e) => setClienteFile(e.target.files[0])}
                />
              </div>
              
              <Button 
                type="submit" 
                variant="primary"
                disabled={clientesLoading || !clienteFile}
              >
                {clientesLoading ? 'Importando...' : 'Importar'}
              </Button>
            </form>
            
            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipificación</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {clientes.length > 0 ? (
                    clientes.map((item, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.cliente}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.tipificacion}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="2" className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                        No hay datos disponibles
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card.Body>
        </Card>
        
        {/* Importar Descuentos */}
        <Card>
          <Card.Body>
            <Card.Title>Importar Descuentos</Card.Title>
            
            <form onSubmit={handleImportDescuentos}>
              <div className="mb-4">
                <label className="block mb-2">Elija Archivo de Descuentos</label>
                <input
                  id="descuentoFile"
                  type="file"
                  accept=".xls,.xlsx"
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
                  onChange={(e) => setDescuentoFile(e.target.files[0])}
                />
              </div>
              
              <Button 
                type="submit" 
                variant="primary"
                disabled={descuentosLoading || !descuentoFile}
              >
                {descuentosLoading ? 'Importando...' : 'Importar'}
              </Button>
            </form>
            
            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipificación</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Porcentaje</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {descuentos.length > 0 ? (
                    descuentos.map((item, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.tipificacion}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.codpro}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.desde}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.porcentaje}%</td>
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
          </Card.Body>
        </Card>
      </div>
    </div>
  );
}

export default Tipificaciones; 