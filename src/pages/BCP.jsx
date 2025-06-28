import { useState, useEffect } from 'react';
import { useNotification } from '../App';
import Button from '../components/Button';
import Card from '../components/Card';
import ConsultaMovimientos from './ConsultaMovimientos';
import { importBCPFile, uploadBCPToProd, getBCPData, clearBCP } from '../services/api';

// Función para asegurar que las fechas se muestran en formato YYYYMMDD
const normalizarFecha = (fecha) => {
  if (!fecha) return '';
  
  // Si ya está en formato YYYYMMDD, devolverlo tal cual
  if (/^\d{8}$/.test(fecha)) {
    return fecha;
  }
  
  // Si es un formato ISO o con T (2025-05-17T00:00:00.000Z)
  if (typeof fecha === 'string' && fecha.includes('T')) {
    // Extraer directamente del string para evitar problemas de zona horaria
    const match = fecha.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      return `${match[1]}${match[2]}${match[3]}`;
    }
  }
  
  // Si es un formato largo como "Fri May 16 2025 19:00:00"
  if (typeof fecha === 'string' && fecha.includes('GMT')) {
    try {
      // Extraer componentes directamente del string
      const match = fecha.match(/\w+\s+\w+\s+(\d+)\s+(\d{4})/);
      if (match) {
        const día = match[1].padStart(2, '0');
        const año = match[2];
        
        // Mapeamos el mes a su número
        const mesesMap = {
          'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04', 'May': '05', 'Jun': '06',
          'Jul': '07', 'Aug': '08', 'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
        };
        
        // Obtener el mes del string
        let mes = '01';
        Object.keys(mesesMap).forEach(nombreMes => {
          if (fecha.includes(nombreMes)) {
            mes = mesesMap[nombreMes];
          }
        });
        
        return `${año}${mes}${día}`;
      }
      
      // Como último recurso, usar Date con métodos UTC
      const date = new Date(fecha);
      const año = date.getUTCFullYear();
      const mes = String(date.getUTCMonth() + 1).padStart(2, '0');
      const dia = String(date.getUTCDate()).padStart(2, '0');
      return `${año}${mes}${dia}`;
    } catch (error) {
      console.error('Error parseando fecha:', error);
    }
  }
  
  return fecha;
};

function BCP() {
  const { showNotification } = useNotification();
  const [data, setData] = useState([]);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingUpload, setLoadingUpload] = useState(false);
  const [vistaActual, setVistaActual] = useState('importar'); // 'importar' o 'consultar'

  // Cargar datos al montar el componente
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const result = await getBCPData();
        if (Array.isArray(result)) {
          setData(result);
        }
      } catch (error) {
        console.error('Error al cargar datos iniciales:', error);
        showNotification('danger', 'Error al cargar datos iniciales');
      }
    };

    fetchInitialData();
  }, [showNotification]);

  // Función para manejar la selección de archivo
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    setFile(selectedFile);
  };

  // Función para importar el archivo Excel
  const handleImportClick = async () => {
    if (!file) {
      showNotification('warning', 'Por favor seleccione un archivo');
      return;
    }

    try {
      setLoading(true);

      // Crear FormData para enviar el archivo
      const formData = new FormData();
      formData.append('file', file);

      // Enviar al backend
      const result = await importBCPFile(formData);

      if (!result.success) {
        throw new Error(result.error || 'Error al importar archivo');
      }

      // Actualizar datos en la tabla
      setData(result.data || []);

      showNotification('success', result.message || 'Excel importado correctamente');
    } catch (error) {
      console.error('Error al importar:', error);
      showNotification('danger', error.message || 'Error desconocido al importar archivo');
    } finally {
      setLoading(false);
    }
  };

  // Función para vaciar la tabla (frontend Y backend)
  const handleClearDisplay = async () => {
    if (!confirm('¿Está seguro que desea vaciar la tabla?')) {
      return;
    }

    try {
      const result = await clearBCP();

      if (!result.success) {
        throw new Error(result.error || 'Error al vaciar tabla');
      }

      setData([]);
      showNotification('success', result.message || 'Tabla vaciada correctamente');
    } catch (error) {
      console.error('Error al vaciar tabla:', error);
      showNotification('danger', error.message || 'Error desconocido al vaciar tabla');
    }
  };

  // Función para subir a MovimientoBanco (ejecutar stored procedure)
  const handleUploadToProd = async () => {
    if (!confirm('¿Está seguro que desea subir los datos a producción?')) {
      return;
    }

    try {
      setLoadingUpload(true);

      // EXACTAMENTE COMO import_BCP.php, solo ejecuta el stored procedure
      const result = await uploadBCPToProd();

      if (!result.success) {
        throw new Error(result.error || 'Error al subir a producción');
      }

      showNotification('success', result.message || 'Datos subidos a MovimientoBanco correctamente');

      // Refrescar los datos después de subir a producción
      await refreshData();

    } catch (error) {
      console.error('Error al subir a producción:', error);
      showNotification('danger', error.message || 'Error desconocido al subir a producción');
    } finally {
      setLoadingUpload(false);
    }
  };

  // Función para cambiar a la vista de consulta
  const handleConsultarClick = () => {
    setVistaActual('consultar');
  };

  // Función para volver a la vista de importar
  const handleVolverClick = () => {
    setVistaActual('importar');
  };

  // Función para refrescar los datos
  const refreshData = async () => {
    try {
      const result = await getBCPData();
      if (Array.isArray(result)) {
        setData(result);
      }
    } catch (error) {
      console.error('Error al refrescar datos:', error);
    }
  };

  // Renderizar la vista de importación
  const renderImportarView = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
        {/* Selector de archivo e importación */}
        <Card>
          <Card.Body>
            <div className="flex">
              <div className="w-full">
                <input
                  type="file"
                  id="formFile"
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
                  onChange={handleFileChange}
                  accept=".xls,.xlsx"
                />
              </div>

              <div className="flex gap-2 justify-between">
                <div className="flex gap-2">
                  <Button
                    variant="danger"
                    onClick={handleClearDisplay}
                    disabled={loading}
                  >
                    Vaciar
                  </Button>

                  <Button
                    variant="primary"
                    onClick={handleImportClick}
                    disabled={loading || !file}
                  >
                    {loading ? (
                      <>
                        Importando...
                      </>
                    ) : 'Importar'}
                  </Button>
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="warning"
                    onClick={handleUploadToProd}
                    disabled={loadingUpload || data.length === 0}
                    className="w-full"
                  >
                    {loadingUpload ? (
                      <>
                        <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                        Procesando...
                      </>
                    ) : 'Subir'}
                  </Button>

                  <Button
                    variant="info"
                    onClick={handleConsultarClick}
                    className="w-full"
                  >
                    Consultar
                  </Button>
                </div>
              </div>
            </div>
          </Card.Body>
        </Card>


      </div>

      {/* Tabla de datos */}
      <Card>
        <div className="overflow-x-auto max-h-[calc(100vh-150px)]">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Valuta</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sucursal</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">N° Operación</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ope Hora</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">UTC</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Referencia</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.length > 0 ? (
                data.map((item, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{normalizarFecha(item.Fecha)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{normalizarFecha(item.Fecha_valuta)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.Descripcion}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.Monto}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.Sucursal}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.Ope_num}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.Ope_hor}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.Usuario}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.UTC}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.Referencia}</td>
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
      </Card>
    </div>
  );

  return (
    <div>
      {vistaActual === 'importar' ?
        renderImportarView() :
        <ConsultaMovimientos onBack={handleVolverClick} showBackButton={true} />
      }
    </div>
  );
}

export default BCP; 