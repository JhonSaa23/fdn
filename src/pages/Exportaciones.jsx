import { useState } from 'react';
import Alert from '../components/Alert';
import Button from '../components/Button';
import Card from '../components/Card';
import { downloadFile, downloadDbf } from '../services/api';

function Exportaciones() {
  const [fileType, setFileType] = useState('txt');
  const [tableName, setTableName] = useState('');
  const [dbfTable, setDbfTable] = useState('');
  const [message, setMessage] = useState({ show: false, type: '', text: '' });
  const [loading, setLoading] = useState(false);

  // Manejar descarga de archivo TXT
  const handleDownloadTxt = async (e) => {
    e.preventDefault();
    
    if (!tableName) {
      setMessage({
        show: true,
        type: 'danger',
        text: 'Por favor seleccione una tabla'
      });
      return;
    }
    
    try {
      setLoading(true);
      
      // Esta función se implementará con las rutas del backend
      setMessage({
        show: true,
        type: 'info',
        text: 'Función de descarga no implementada aún'
      });
      
    } catch (error) {
      setMessage({
        show: true,
        type: 'danger',
        text: 'Error al descargar archivo: ' + (error.message || 'Error desconocido')
      });
    } finally {
      setLoading(false);
    }
  };

  // Manejar descarga de archivo DBF
  const handleDownloadDbf = async (e) => {
    e.preventDefault();
    
    if (!dbfTable) {
      setMessage({
        show: true,
        type: 'danger',
        text: 'Por favor seleccione una tabla DBF'
      });
      return;
    }
    
    try {
      setLoading(true);
      
      // Esta función se implementará con las rutas del backend
      setMessage({
        show: true,
        type: 'info',
        text: 'Función de descarga DBF no implementada aún'
      });
      
    } catch (error) {
      setMessage({
        show: true,
        type: 'danger',
        text: 'Error al descargar archivo DBF: ' + (error.message || 'Error desconocido')
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h3 className="text-xl font-semibold mb-4">Exportaciones</h3>
      
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
          <Card.Title>Exportar archivo TXT</Card.Title>
          
          <form onSubmit={handleDownloadTxt}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="form-label">Tipo de extensión:</label>
                <select 
                  className="form-select w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  value={fileType}
                  onChange={(e) => setFileType(e.target.value)}
                >
                  <option value="txt">txt</option>
                </select>
              </div>
              
              <div>
                <label className="form-label">Nombre de la tabla:</label>
                <select 
                  className="form-select w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  value={tableName}
                  onChange={(e) => setTableName(e.target.value)}
                >
                  <option value="">--- Seleccione tabla ---</option>
                  <option value="t_minsa">t_minsa</option>
                  <option value="t_Dtw24Pe">t_Dtw24Pe</option>
                  <option value="t_Dtw241Pe">t_Dtw241Pe</option>
                  <option value="PERU_FACT">PERU_FACT</option>
                  <option value="PERUFACTINV">PERUFACTINV</option>
                  <option value="PERU_PROD">PERU_PROD</option>
                  <option value="PERU_SREP">PERU_SREP</option>
                  <option value="srepstore">srepstore</option>
                  <option value="PERU_STORE">PERU_STORE</option>
                </select>
              </div>
            </div>
            
            <Button 
              type="submit" 
              variant="success"
              disabled={loading}
            >
              {loading ? 'Descargando...' : 'Descargar'}
            </Button>
          </form>
        </Card.Body>
      </Card>
      
      <Card>
        <Card.Body>
          <Card.Title>Exportar archivo DBF</Card.Title>
          
          <form onSubmit={handleDownloadDbf}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="form-label">Tipo de extensión:</label>
                <select 
                  className="form-select w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                >
                  <option value="dbf">dbf</option>
                </select>
              </div>
              
              <div>
                <label className="form-label">Nombre de la tabla:</label>
                <select 
                  className="form-select w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  value={dbfTable}
                  onChange={(e) => setDbfTable(e.target.value)}
                >
                  <option value="">--- Seleccione tabla ---</option>
                  <option value="CC000225">CC000225</option>
                  <option value="CD000225">CD000225</option>
                </select>
              </div>
            </div>
            
            <Button 
              type="submit" 
              variant="success"
              disabled={loading}
            >
              {loading ? 'Descargando...' : 'Descargar DBF'}
            </Button>
          </form>
        </Card.Body>
      </Card>
    </div>
  );
}

export default Exportaciones; 
