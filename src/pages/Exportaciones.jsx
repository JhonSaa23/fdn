import { useState } from 'react';
import Button from '../components/Button';
import Card from '../components/Card';
import { downloadFile, downloadDbf, ejecutarSpMinsa } from '../services/api';

function Exportaciones() {
  const [tableName, setTableName] = useState('');
  const [dbfTable, setDbfTable] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Estados para t_minsa
  const [showMinsaFields, setShowMinsaFields] = useState(false);
  const [fec1, setFec1] = useState('');
  const [fec2, setFec2] = useState('');
  const [ejecutandoSp, setEjecutandoSp] = useState(false);
  const [spEjecutado, setSpEjecutado] = useState(false);

  // Manejar cambio de tabla
  const handleTableChange = (value) => {
    setTableName(value);
    setShowMinsaFields(value === 't_minsa');
    if (value !== 't_minsa') {
      setFec1('');
      setFec2('');
      setSpEjecutado(false);
    }
  };

  // Ejecutar stored procedure para t_minsa
  const handleEjecutarSpMinsa = async () => {
    if (!fec1 || !fec2) {
      return;
    }

    try {
      setEjecutandoSp(true);
      
      // Formatear fechas: fecha inicio desde 00:00:00 y fecha fin hasta 23:59:59
      const fecha1 = fec1 + ' 00:00:00';
      const fecha2 = fec2 + ' 23:59:59';
      
      await ejecutarSpMinsa(fecha1, fecha2);
      setSpEjecutado(true);
    } catch (error) {
      console.error('Error ejecutando stored procedure:', error);
      setSpEjecutado(false);
    } finally {
      setEjecutandoSp(false);
    }
  };

  // Manejar descarga de archivo TXT
  const handleDownloadTxt = async (e) => {
    e.preventDefault();
    
    if (!tableName) {
      return;
    }
    
    try {
      setLoading(true);
      
      const blob = await downloadFile({
        extension: 'txt',
        tabla_name: tableName
      });
      
      // Crear URL del blob y descargar
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Determinar nombre del archivo según la tabla
      let fileName = 'export';
      if (tableName === 't_minsa') {
        fileName = 'Minsa.txt';
      } else if (tableName === 't_Dtw24Pe') {
        fileName = 'dt24.txt';
      } else if (tableName === 't_Dtw241Pe') {
        fileName = 'dt24_1.txt';
      } else {
        fileName = `${tableName}.txt`;
      }
      
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error al descargar archivo:', error);
    } finally {
      setLoading(false);
    }
  };

  // Manejar descarga de archivo DBF
  const handleDownloadDbf = async (e) => {
    e.preventDefault();
    
    if (!dbfTable) {
      return;
    }
    
    try {
      setLoading(true);
      
      const blob = await downloadDbf({
        extension_dbf: 'dbf',
        tabla_dbf: dbfTable
      });
      
      // Crear URL del blob y descargar
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${dbfTable}.dbf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error al descargar archivo DBF:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h3 className="text-xl font-semibold mb-6 text-gray-800">Exportaciones</h3>
      
      <div className="space-y-6">
        {/* Exportar archivo TXT */}
        <Card className="shadow-lg">
          <Card.Body>
            <Card.Title className="mb-4 text-lg font-semibold text-gray-700">
              Exportar archivo TXT
            </Card.Title>
            
            {/* Campos para t_minsa */}
            {showMinsaFields && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="text-sm font-semibold text-blue-800 mb-3">
                  Parámetros para ejecutar sp_Ventas_MINSA
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha Inicio (fec1)
                    </label>
                    <input
                      type="date"
                      value={fec1}
                      onChange={(e) => {
                        setFec1(e.target.value);
                        setSpEjecutado(false);
                      }}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">Se aplicará desde las 00:00:00</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha Fin (fec2)
                    </label>
                    <input
                      type="date"
                      value={fec2}
                      onChange={(e) => {
                        setFec2(e.target.value);
                        setSpEjecutado(false);
                      }}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">Se aplicará hasta las 23:59:59</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleEjecutarSpMinsa}
                    disabled={!fec1 || !fec2 || ejecutandoSp}
                    className="w-auto"
                  >
                    {ejecutandoSp ? 'Ejecutando...' : 'Ejecutar SP'}
                  </Button>
                  {spEjecutado && (
                    <span className="text-sm text-green-600 font-medium">
                      ✓ SP ejecutado exitosamente
                    </span>
                  )}
                </div>
                <p className="mt-3 text-xs text-gray-600">
                  Opcional: Ejecuta el stored procedure para generar nuevos datos. Puedes descargar los datos actuales en cualquier momento.
                </p>
              </div>
            )}
            
            <form onSubmit={handleDownloadTxt}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de la tabla
                </label>
                <select 
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={tableName}
                  onChange={(e) => handleTableChange(e.target.value)}
                  required
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
              
              <Button 
                type="submit" 
                variant="success"
                disabled={loading || !tableName}
                className="w-full md:w-auto"
              >
                {loading ? 'Descargando...' : 'Descargar'}
              </Button>
            </form>
          </Card.Body>
        </Card>
        
        {/* Exportar archivo DBF */}
        <Card className="shadow-lg">
          <Card.Body>
            <Card.Title className="mb-4 text-lg font-semibold text-gray-700">
              Exportar archivo DBF
            </Card.Title>
            
            <form onSubmit={handleDownloadDbf}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de la tabla
                </label>
                <select 
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={dbfTable}
                  onChange={(e) => setDbfTable(e.target.value)}
                  required
                >
                  <option value="">--- Seleccione tabla ---</option>
                  <option value="CC000225">CC000225</option>
                  <option value="CD000225">CD000225</option>
                </select>
              </div>
              
              <Button 
                type="submit" 
                variant="success"
                disabled={loading}
                className="w-full md:w-auto"
              >
                {loading ? 'Descargando...' : 'Descargar DBF'}
              </Button>
            </form>
          </Card.Body>
        </Card>
      </div>
    </div>
  );
}

export default Exportaciones;
