import React, { useState, useEffect } from 'react';
import { XMarkIcon, DocumentTextIcon, TableCellsIcon } from '@heroicons/react/24/outline';
import { obtenerClienteDocumento } from '../services/api';

const DocumentoDetalleModal = ({ isOpen, onClose, documentData, loading }) => {
  const [clienteData, setClienteData] = useState(null);
  const [loadingCliente, setLoadingCliente] = useState(false);

  // Cargar información del cliente cuando se abre el modal
  useEffect(() => {
    if (isOpen && documentData?.documento && !loading) {
      const cargarCliente = async () => {
        try {
          setLoadingCliente(true);
          setClienteData(null);
          const response = await obtenerClienteDocumento(documentData.documento);
          setClienteData(response);
        } catch (error) {
          console.error('Error al cargar cliente:', error);
          setClienteData(null);
        } finally {
          setLoadingCliente(false);
        }
      };
      
      cargarCliente();
    }
  }, [isOpen, documentData?.documento, loading]);

  if (!isOpen) return null;

  const formatValue = (value) => {
    if (value === null || value === undefined) return '-';
    
    // Si es una fecha, formatearla
    if (typeof value === 'string' && value.includes('T')) {
      try {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString('es-ES');
        }
      } catch (e) {
        // Si no se puede parsear como fecha, devolver el valor original
      }
    }
    
    // Si es un número, formatearlo con decimales
    if (typeof value === 'number') {
      return value.toFixed(2);
    }
    
    return value.toString();
  };

  const formatCurrency = (value) => {
    if (!value || isNaN(value)) return 'S/ 0.00';
    return `S/ ${parseFloat(value).toFixed(2)}`;
  };

  const calcularTotal = (cantidad, precio, descuento1 = 0, descuento2 = 0, descuento3 = 0) => {
    const subtotal = cantidad * precio;
    const desc1 = subtotal * (descuento1 / 100);
    const desc2 = (subtotal - desc1) * (descuento2 / 100);
    const desc3 = (subtotal - desc1 - desc2) * (descuento3 / 100);
    return subtotal - desc1 - desc2 - desc3;
  };

  // Columnas a ocultar
  const columnasOcultas = ["codprom", "descab", "codoferta", "codautoriza","editado","autoriza","paquete"];
  const normalizar = str => str.replace(/\s|_/g, '').toLowerCase();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full h-full overflow-hidden flex flex-col">
        {/* Header del Modal */}
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between p-3 border-b border-gray-200 bg-blue-50 gap-1 flex-shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Detalles del Documento
            </h2>
            {documentData && (
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-sm text-blue-700 font-bold">{documentData.documento}</span>
                <span className="text-xs text-gray-500">• {documentData.tabla || 'Tabla no identificada'}</span>
                {documentData.data && (
                  <span className="ml-2 text-xs font-semibold text-green-600">{documentData.data.length} items</span>
                )}
              </div>
            )}
          </div>
          {/* Información del cliente: derecha en desktop, debajo en móvil */}
          <div className="md:text-right pr-0 md:pr-12">
            {loadingCliente ? (
              <div className="flex items-center space-x-2 md:justify-end mt-2 md:mt-0">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-xs text-gray-500">Cargando información del cliente...</span>
              </div>
            ) : clienteData?.success && clienteData.cliente ? (
              <div className="mt-2 md:mt-0 p-2 bg-green-50 rounded-md inline-block">
                <div className="flex flex-col md:items-end">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-green-700">{clienteData.cliente.NombreCliente}</span>
                  </div>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-xs font-medium text-green-600">RUC:</span>
                    <span className="text-xs text-green-600 font-mono">{clienteData.cliente.RUC}</span>
                    <span className="text-xs text-gray-500">• Código: {clienteData.cliente.Codclie}</span>
                  </div>
                </div>
              </div>
            ) : clienteData?.success === false ? (
              <div className="mt-2 md:mt-0 p-2 bg-yellow-50 rounded-md inline-block">
                <div className="flex items-center space-x-2 md:justify-end">
                  <span className="text-xs text-yellow-700">
                    {clienteData.message || 'No se encontró información del cliente'}
                  </span>
                </div>
              </div>
            ) : null}
          </div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 text-gray-400 hover:text-gray-500 transition-colors"
            aria-label="Cerrar"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Contenido del Modal */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600">Cargando detalles del documento...</p>
            </div>
          ) : documentData?.success === false ? (
            <div className="text-center py-12">
              <TableCellsIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Documento no encontrado
              </h3>
              <p className="text-gray-600">
                {documentData.message || 'No se encontraron detalles para este documento'}
              </p>
              
              {/* Mostrar headers disponibles si existen */}
              {documentData?.headers && (
                <div className="mt-8">
                  <h4 className="text-md font-medium text-gray-800 mb-4">
                    Estructura de las tablas disponibles:
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Object.entries(documentData.headers).map(([tableName, columns]) => (
                      <div key={tableName} className="bg-gray-50 rounded-lg p-4">
                        <h5 className="font-semibold text-gray-800 mb-3 flex items-center">
                          <TableCellsIcon className="h-4 w-4 mr-2" />
                          {tableName}
                        </h5>
                        <div className="space-y-1">
                          {columns.map((column, index) => (
                            <div key={index} className="text-xs text-gray-600 font-mono">
                              {column.COLUMN_NAME} ({column.DATA_TYPE}
                              {column.CHARACTER_MAXIMUM_LENGTH && `(${column.CHARACTER_MAXIMUM_LENGTH})`})
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : documentData?.data && documentData.data.length > 0 ? (
            <div className="space-y-6">
              {/* Tabla de productos */}
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {Object.keys(documentData.data[0])
                        .filter(key => !columnasOcultas.includes(normalizar(key)))
                        .map((key) => (
                          <th 
                            key={key}
                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </th>
                        ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {documentData.data.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        {Object.entries(item)
                          .filter(([key]) => !columnasOcultas.includes(normalizar(key)))
                          .map(([key, value]) => (
                            <td key={key} className="px-4 py-3 whitespace-nowrap text-sm">
                              {key.toLowerCase().includes('precio') || 
                               key.toLowerCase().includes('total') || 
                               key.toLowerCase().includes('costo') ? (
                                <span className="font-medium text-green-600">
                                  {formatCurrency(value)}
                                </span>
                              ) : key.toLowerCase().includes('cantidad') ? (
                                <span className="font-medium text-blue-600">
                                  {formatValue(value)}
                                </span>
                              ) : key.toLowerCase().includes('codpro') ? (
                                <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                                  {value}
                                </span>
                              ) : (
                                <span className="text-gray-900">
                                  {formatValue(value)}
                                </span>
                              )}
                            </td>
                          ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              
            </div>
          ) : (
            <div className="text-center py-12">
              <DocumentTextIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No hay datos para mostrar</p>
            </div>
          )}
        </div>

        
      </div>
    </div>
  );
};

export default DocumentoDetalleModal; 
