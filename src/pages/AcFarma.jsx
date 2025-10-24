import React, { useState, useEffect } from 'react';
import ResponsiveTableContainer from '../components/ResponsiveTableContainer';
import Button from '../components/Button';
import axios from '../services/axiosClient';

const AcFarma = () => {
  const [datos, setDatos] = useState([]);
  const [datosMostrados, setDatosMostrados] = useState([]);
  const [loading, setLoading] = useState(false);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/rupero/ac-farma');
      setDatos(response.data);
      // Mostrar solo los primeros 100 datos
      setDatosMostrados(response.data.slice(0, 100));
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDescargarExcel = async () => {
    try {
      const response = await axios.get('/rupero/ac-farma/excel', {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ac-farma-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error al descargar Excel:', error);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Generar columnas con campos específicos y ordenados
  const generarColumnas = () => {
    if (datosMostrados.length === 0) return [];
    
    const primeraFila = datosMostrados[0];
    const camposDisponibles = Object.keys(primeraFila);
    
    // Definir el orden específico de los campos
    const ordenCampos = [
      'TipoDoc',
      'NroPedido',
      'Fecha',
      'RUC',
      'Cliente',
      'CodPro',
      'Producto'
    ];
    
    // Crear columnas en el orden especificado
    const columnasOrdenadas = [];
    
    // Agregar campos en el orden específico si existen
    ordenCampos.forEach(campo => {
      if (camposDisponibles.includes(campo)) {
        columnasOrdenadas.push({
          key: campo,
          header: campo === 'TipoDoc' ? 'Tipo Doc.' : 
                  campo === 'NroPedido' ? 'Nro Pedido' :
                  campo === 'CodPro' ? 'Código' : campo,
          accessor: campo
        });
      }
    });
    
    // Agregar campos restantes que no están en el orden específico
    camposDisponibles.forEach(campo => {
      if (!ordenCampos.includes(campo)) {
        columnasOrdenadas.push({
          key: campo,
          header: campo,
          accessor: campo
        });
      }
    });
    
    return columnasOrdenadas;
  };

  const columnas = generarColumnas();

  return (
    <div className="">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold">{`Ac Farma (${datos.length} datos totales)`}</h1>
            <Button
              variant="success"
              onClick={handleDescargarExcel}
            >
              📊 Descargar Excel
            </Button>
          </div>
        </div>
      </div>

      {/* Tabla con headers fijos */}
      <div className="mt-4 bg-white rounded-lg shadow-sm border border-gray-200">
        <div 
          className="overflow-auto"
          style={{ maxHeight: "calc(100vh - 130px)" }}
        >
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                {columnas.map((columna, index) => (
                  <th
                    key={index}
                    className="px-3 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-200 last:border-r-0"
                  >
                    {columna.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={columnas.length} className="px-6 py-4 text-center text-gray-500">
                    Cargando datos...
                  </td>
                </tr>
              ) : datosMostrados.length === 0 ? (
                <tr>
                  <td colSpan={columnas.length} className="px-6 py-4 text-center text-gray-500">
                    No hay datos disponibles
                  </td>
                </tr>
              ) : (
                datosMostrados.map((fila, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    {columnas.map((columna, colIndex) => (
                      <td
                        key={colIndex}
                        className="px-3 py-2 whitespace-nowrap text-xs text-gray-900 text-center border-r border-gray-100 last:border-r-0"
                      >
                        {fila[columna.accessor]}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AcFarma;
