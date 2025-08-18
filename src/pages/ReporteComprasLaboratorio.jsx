import React, { useState } from 'react';
import { useNotification } from '../App';
import { consultarComprasLaboratorio, exportarComprasLaboratorio } from '../services/api';
import Button from '../components/Button';
import Card from '../components/Card';

const ReporteComprasLaboratorio = () => {
  const { showNotification } = useNotification();
  const [codigoLaboratorio, setCodigoLaboratorio] = useState('');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleConsultar = async () => {
    if (!codigoLaboratorio.trim()) {
      showNotification('Ingrese el código de laboratorio', 'error');
      return;
    }

    try {
      setLoading(true);
      const response = await consultarComprasLaboratorio(codigoLaboratorio.trim());
      
      if (response.success) {
        setData(response.data);
        showNotification(
          `Reporte generado: ${response.totalRegistros} registros encontrados para laboratorio ${response.laboratorio}`, 
          'success'
        );
      } else {
        showNotification(response.error || 'Error al generar el reporte', 'error');
        setData([]);
      }
    } catch (error) {
      console.error('Error al consultar reporte:', error);
      showNotification('Error al consultar el reporte', 'error');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLimpiar = () => {
    setCodigoLaboratorio('');
    setData([]);
  };

  const handleExportar = async () => {
    if (!codigoLaboratorio.trim()) {
      showNotification('Ingrese el código de laboratorio', 'error');
      return;
    }

    if (data.length === 0) {
      showNotification('No hay datos para exportar. Consulte primero el reporte.', 'error');
      return;
    }

    try {
      setExporting(true);
      await exportarComprasLaboratorio(codigoLaboratorio.trim());
      showNotification('Archivo Excel descargado exitosamente', 'success');
    } catch (error) {
      console.error('Error al exportar:', error);
      showNotification('Error al exportar el archivo Excel', 'error');
    } finally {
      setExporting(false);
    }
  };

  const formatFecha = (fecha) => {
    if (!fecha) return '';
    try {
      const date = new Date(fecha);
      return date.toLocaleDateString('es-ES');
    } catch (error) {
      return fecha;
    }
  };

  const formatDecimal = (numero) => {
    if (!numero) return '0.00';
    return parseFloat(numero).toFixed(2);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          Reporte de Compras por Laboratorio
        </h1>
      </div>

      {/* Filtros */}
      <Card>
        <Card.Body>
          <Card.Title>Filtros</Card.Title>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Código de Laboratorio *
              </label>
              <input
                type="text"
                value={codigoLaboratorio}
                onChange={(e) => setCodigoLaboratorio(e.target.value)}
                placeholder="Ej: 00, 01, 71..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={2}
              />
              <p className="text-xs text-gray-500 mt-1">
                Ingrese el código de 2 dígitos del laboratorio
              </p>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button
              onClick={handleConsultar}
              disabled={loading || !codigoLaboratorio.trim()}
              variant="primary"
            >
              {loading ? 'Consultando...' : 'Consultar'}
            </Button>
            <Button onClick={handleLimpiar} variant="secondary">
              Limpiar
            </Button>
          </div>
        </Card.Body>
      </Card>

      {/* Resultados */}
      {data.length > 0 && (
        <Card>
          <Card.Body>
            <div className="flex items-center justify-between mb-4">
              <Card.Title>
                Resultados - Laboratorio {codigoLaboratorio} ({data.length} registros)
              </Card.Title>
              <Button
                onClick={handleExportar}
                disabled={exporting}
                variant="success"
                className="flex items-center gap-2"
              >
                {exporting ? 'Exportando...' : '📊 Exportar Excel'}
              </Button>
            </div>
            
            <div className="overflow-x-auto max-h-[calc(100vh-200px)]">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      CÓD_MIF (SAP)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      CÓDIGO PRODUCTO
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      DESCRIPCIÓN
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      CANTIDAD REAL
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      N° FACTURA COMPRA
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      LOTE
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      F.VCMTO.
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      FECHA FACTURACIÓN
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      CANTIDAD COMPRADA
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item['CÓD_MIF (SAP)']}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item['CÓDIGO PRODUCTO']}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                        {item.DESCRIPCION}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                        {formatDecimal(item['CANTIDAD REAL DISPONIBLE'])}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">
                        {item['N° FACTURA COMPRA']}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.LOTE}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatFecha(item['F.VCMTO.'])}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatFecha(item['FECHA DE FACTURACION'])}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDecimal(item['CANTIDAD COMPRADA'])}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Mensaje cuando no hay datos */}
      {!loading && data.length === 0 && codigoLaboratorio && (
        <Card>
          <Card.Body>
            <div className="text-center py-8">
              <p className="text-gray-500 text-lg">
                No se encontraron compras para el laboratorio {codigoLaboratorio}
              </p>
              <p className="text-gray-400 text-sm mt-2">
                Verifique que el código de laboratorio sea correcto
              </p>
            </div>
          </Card.Body>
        </Card>
      )}
    </div>
  );
};

export default ReporteComprasLaboratorio;
