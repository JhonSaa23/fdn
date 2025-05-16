import { useState, useEffect } from 'react';
import Alert from '../components/Alert';
import Button from '../components/Button';
import Card from '../components/Card';

function Letras() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ show: false, type: '', text: '' });
  const [filtroLetra, setFiltroLetra] = useState('');
  const [numeroLetra, setNumeroLetra] = useState('');

  // Esta función se implementará cuando creemos las rutas del backend
  const fetchData = async () => {
    try {
      setLoading(true);
      setData([]); // Por ahora lo dejamos vacío
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

  const handleSearch = (e) => {
    e.preventDefault();
    // Esta función se implementará con las rutas del backend
    setMessage({
      show: true,
      type: 'info',
      text: 'Función de búsqueda no implementada aún'
    });
  };

  return (
    <div>
      <h3 className="text-xl font-semibold mb-4">Gestión de Letras</h3>
      
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
          <Card.Title>Buscar Letra</Card.Title>
          
          <form onSubmit={handleSearch}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="form-label">Filtro de Letra:</label>
                <select
                  className="form-select w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  value={filtroLetra}
                  onChange={(e) => setFiltroLetra(e.target.value)}
                >
                  <option value="">-- Seleccione Filtro --</option>
                  <option value="numero">Número de Letra</option>
                  <option value="cliente">Cliente</option>
                  <option value="fecha">Fecha</option>
                </select>
              </div>
              
              <div>
                <label className="form-label">Valor de búsqueda:</label>
                <input
                  type="text"
                  className="form-input w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  value={numeroLetra}
                  onChange={(e) => setNumeroLetra(e.target.value)}
                  placeholder="Ingrese valor de búsqueda"
                />
              </div>
            </div>
            
            <Button 
              type="submit" 
              variant="primary"
              disabled={loading}
            >
              {loading ? 'Buscando...' : 'Buscar'}
            </Button>
          </form>
        </Card.Body>
      </Card>
      
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
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Número</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vencimiento</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.length > 0 ? (
                data.map((item, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.numero}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.cliente}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.fecha}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.vencimiento}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.monto}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.estado}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Button size="sm" variant="primary" className="px-2 py-1 text-xs">
                          Ver
                        </Button>
                        <Button size="sm" variant="warning" className="px-2 py-1 text-xs">
                          Editar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                    No hay datos disponibles
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Letras; 