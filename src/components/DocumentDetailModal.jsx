import React from 'react';
import { XMarkIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

const DocumentDetailModal = ({ isOpen, onClose, documentData, loading }) => {
  if (!isOpen) return null;

  const formatDecimal = (numero) => {
    if (!numero) return '0.00';
    return parseFloat(numero).toFixed(2);
  };

  const formatCurrency = (numero) => {
    return `S/ ${formatDecimal(numero)}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <DocumentTextIcon className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Detalles del Documento
              </h2>
              {documentData?.data && (
                <p className="text-sm text-gray-600">
                  {documentData.data.documento} - {documentData.data.tipoDocumento}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Cargando detalles...</span>
            </div>
          ) : !documentData?.success ? (
            <div className="text-center py-12">
              <DocumentTextIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-2">
                {documentData?.message || 'No se encontraron detalles para este documento'}
              </p>
              {documentData?.documento && (
                <p className="text-sm text-gray-400">
                  Documento: {documentData.documento}
                </p>
              )}
            </div>
          ) : (
            <>
              {/* Información del documento */}
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Documento</label>
                    <p className="text-lg font-semibold text-blue-900">
                      {documentData.data.documento}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Tipo</label>
                    <p className="text-lg font-semibold text-blue-900">
                      {documentData.data.tipoDocumento}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Tabla</label>
                    <p className="text-lg font-semibold text-blue-900">
                      {documentData.data.tabla}
                    </p>
                  </div>
                </div>
              </div>

              {/* Resumen */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <p className="text-sm font-medium text-gray-700">Total Items</p>
                  <p className="text-2xl font-bold text-green-600">
                    {documentData.data.resumen.totalItems}
                  </p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <p className="text-sm font-medium text-gray-700">Total Cantidad</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatDecimal(documentData.data.resumen.totalCantidad)}
                  </p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 text-center">
                  <p className="text-sm font-medium text-gray-700">Total Monto</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {formatCurrency(documentData.data.resumen.totalMonto)}
                  </p>
                </div>
              </div>

              {/* Tabla de items */}
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">
                    Productos del Documento
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Código
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Producto
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cantidad
                        </th>
                        {documentData.data.tipoDocumento !== 'Guía' && (
                          <>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Precio Unit.
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Descuento
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Total
                            </th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {documentData.data.items.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="text-sm font-medium text-gray-900">
                              {item.codpro}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-gray-900">
                              {item.nombreProducto || 'Producto no encontrado'}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right">
                            <span className="text-sm font-medium text-gray-900">
                              {formatDecimal(item.cantidad)}
                            </span>
                          </td>
                          {documentData.data.tipoDocumento !== 'Guía' && (
                            <>
                              <td className="px-4 py-3 whitespace-nowrap text-right">
                                <span className="text-sm text-gray-900">
                                  {formatCurrency(item.precio)}
                                </span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-right">
                                <span className="text-sm text-gray-900">
                                  {formatCurrency(item.descuento)}
                                </span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-right">
                                <span className="text-sm font-medium text-gray-900">
                                  {formatCurrency(item.total)}
                                </span>
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentDetailModal; 
