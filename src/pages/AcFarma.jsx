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

  // Generar columnas dinámicamente basado en los datos
  const generarColumnas = () => {
    if (datosMostrados.length === 0) return [];
    
    const primeraFila = datosMostrados[0];
    return Object.keys(primeraFila).map(campo => ({
      key: campo,
      header: campo,
      accessor: campo
    }));
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
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
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
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
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
