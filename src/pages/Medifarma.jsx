import { useState, useEffect } from 'react';
import Button from '../components/Button';
import Card from '../components/Card';
import { 
  getMedifarmaData, 
  importMedifarmaFile,
  clearMedifarma, 
  uploadMedifarmaToProd 
} from '../services/api';
import { useNotification } from '../App';

function Medifarma() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingUpload, setLoadingUpload] = useState(false);
  const [file, setFile] = useState(null);
  const { showNotification } = useNotification();

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
      showNotification('danger', 'Error al cargar datos: ' + (error.message || 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  // Función para seleccionar archivo
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  // Función para importar archivo directamente a la base de datos
  const handleImportClick = async () => {
    if (!file) {
      showNotification('danger', 'Por favor seleccione un archivo');
      return;
    }
    
    try {
      setLoading(true);
      const result = await importMedifarmaFile(file);
      
      if (result.success) {
        const totalRows = result.totalRows || 0;
        showNotification('success', `Importado correctamente. Total de : ${totalRows} (se muestran los primeros 100)`);
        
        // Resetear el selector de archivo
        setFile(null);
        document.getElementById('formFile').value = '';
        
        // Recargar datos para mostrar la tabla actualizada
        fetchData();
      } else {
        showNotification('danger', result.error || 'Error al importar archivo');
      }
    } catch (error) {
      showNotification('danger', 'Error al importar archivo: ' + (error.message || 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  // Función para vaciar tabla en base de datos
  const handleClear = async () => {
    if (!window.confirm('¿Está seguro que desea vaciar la tabla Medifarma?')) {
      return;
    }
    
    try {
      setLoading(true);
      const result = await clearMedifarma();
      
      showNotification(
        result.success ? 'success' : 'danger',
        result.message || result.error
      );
      
      if (result.success) {
        fetchData(); // Recargar datos
      }
    } catch (error) {
      showNotification('danger', 'Error al vaciar tabla: ' + (error.message || 'Error desconocido'));
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
      setLoadingUpload(true);
      const result = await uploadMedifarmaToProd();
      
      showNotification(
        result.success ? 'success' : 'danger',
        result.message || result.error
      );
    } catch (error) {
      showNotification('danger', 'Error al subir a producción: ' + (error.message || 'Error desconocido'));
    } finally {
      setLoadingUpload(false);
    }
  };

  return (
    <div className="space-y-6">
      
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
                accept=".xlsx,.xls,.dbf"
              />
            </div>

            <div className="flex gap-2 justify-between ml-4">
              <div className="flex gap-2">
                {/* Botón Vaciar - vacía la tabla en la base de datos */}
                <Button
                  variant="danger"
                  onClick={handleClear}
                  disabled={loading}
                >
                  Vaciar
                </Button>

                {/* Botón Importar Registros - carga directamente a la base de datos */}
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
              
              {/* Botón Subir a MedifarmaProd */}
              <div className="ml-2">
                <Button
                  variant="warning"
                  onClick={handleUploadToProd}
                  disabled={loadingUpload || data.length === 0}
                >
                  {loadingUpload ? (
                    <>
                      <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                      Procesando...
                    </>
                  ) : 'Subir'}
                </Button>
              </div>
            </div>
          </div>
        </Card.Body>
      </Card>
      
      {/* Tabla de datos */}
      <Card>
        <div className="overflow-x-auto max-h-[calc(100vh-180px)]">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">COD_PROM</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DESC_CAB</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CANAL</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">FECDES</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">FECHAS</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CODOFERTA</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DESC_DET</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CIUDADES</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PAQUETE</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SOL_COM</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DESCTO</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TOPE_VAL</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">FLG_TIP</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">VAL_BASI</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">COD_PRO</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DESCRIP</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DESDE_LA</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DESDE_UND</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">HASTA_UND</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PORCEN</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DSCT_MIF</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DSCT_PRV</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IND_UNI</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">COD_BON</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CAN_BON</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DESCRI</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IND_UNI1</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">COD_BO1</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CAN_BO1</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IND_UNI2</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">COD_BO2</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CAN_BO2</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IND_UNI3</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">COD_BO3</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CAN_BO3</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IND_UNI4</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">COD_BO4</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CAN_BO4</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IND_UNI5</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">COD_BO5</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CAN_BO5</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">MULTIPLO</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PASA</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DES_BO1</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DES_BO2</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DES_BO3</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DES_BO4</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DES_BO5</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CAMPANA</th>
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.ciudades}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.paquete}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.sol_com}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.descto}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.tope_val}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.flg_tip}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.val_basi}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.codprod}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.descrip}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.desde_la}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.desde_und}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.hasta_und}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.porcen}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.dsct_mif}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.dsct_prv}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.ind_uni}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.cod_bon}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.can_bon}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.descri}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.ind_uni1}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.cod_bo1}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.can_bo1}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.ind_uni2}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.cod_bo2}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.can_bo2}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.ind_uni3}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.cod_bo3}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.can_bo3}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.ind_uni4}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.cod_bo4}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.can_bo4}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.ind_uni5}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.cod_bo5}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.can_bo5}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.multiplo}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.pasa}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.des_bo1}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.des_bo2}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.des_bo3}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.des_bo4}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.des_bo5}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.campana}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="48" className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
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
}

export default Medifarma; 