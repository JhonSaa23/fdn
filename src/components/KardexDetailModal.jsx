import React from 'react';

const KardexDetailModal = ({ isOpen, onClose, movimiento }) => {
  if (!movimiento || !isOpen) return null;

  // Función para formatear fecha
  const formatFecha = (fecha) => {
    if (!fecha) return 'No especificada';
    try {
      const date = new Date(fecha);
      return date.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return fecha;
    }
  };

  // Función para formatear números decimales
  const formatDecimal = (numero) => {
    if (!numero) return '0.00';
    return parseFloat(numero).toFixed(2);
  };

  // Función para formatear el tipo de movimiento
  const formatMovimiento = (tipo) => {
    if (tipo === 1) return 'ENTRADA DE MERCADERÍA';
    if (tipo === 2) return 'SALIDA DE MERCADERÍA';
    return 'TIPO NO ESPECIFICADO';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 hidden md:flex">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700">
          <div className="flex items-center justify-between">
            <div className="text-white">
              <h2 className="text-2xl font-bold">Detalle del Movimiento de Inventario</h2>
              <p className="text-blue-100 text-sm mt-1">
                Kardex Completo • Producto: {movimiento.CodPro}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-10 rounded-full transition-colors text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-8 py-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* COLUMNA IZQUIERDA */}
            <div className="space-y-6">
              
              {/* SECCIÓN 1: ESTADO ACTUAL DEL INVENTARIO */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                <h3 className="text-xl font-bold text-blue-900 mb-4 flex items-center">
                  <div className="p-2 bg-blue-600 text-white rounded-lg mr-3">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  Estado del Inventario
                </h3>
                <div className="space-y-4">
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-1">Stock Actual</p>
                      <p className="text-4xl font-bold text-blue-600">
                        {formatDecimal(movimiento.Stock)}
                      </p>
                      <p className="text-sm text-gray-500">unidades disponibles</p>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-700">Código del Producto:</span>
                      <span className="font-bold text-gray-900 text-lg">{movimiento.CodPro}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-700">Almacén:</span>
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">
                        {movimiento.Almacen || 'No especificado'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECCIÓN 2: DETALLES DEL MOVIMIENTO */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <div className="p-2 bg-gray-600 text-white rounded-lg mr-3">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                  </div>
                  Movimiento Realizado
                </h3>
                <div className="bg-white rounded-lg p-4 shadow-sm space-y-4">
                  <div className="text-center">
                    <span className={`inline-block px-6 py-3 rounded-full text-lg font-bold ${
                      movimiento.Movimiento === 1 ? 'bg-green-100 text-green-800 border-2 border-green-300' : 
                      movimiento.Movimiento === 2 ? 'bg-red-100 text-red-800 border-2 border-red-300' : 
                      'bg-gray-100 text-gray-800 border-2 border-gray-300'
                    }`}>
                      {formatMovimiento(movimiento.Movimiento)}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-700">Cantidad:</span>
                      <span className="text-2xl font-bold text-gray-900">
                        {formatDecimal(movimiento.Cantidad)} unidades
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-700">Fecha:</span>
                      <span className="font-medium text-gray-900">{formatFecha(movimiento.Fecha)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECCIÓN 3: DOCUMENTACIÓN */}
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-6 border border-yellow-200">
                <h3 className="text-xl font-bold text-yellow-900 mb-4 flex items-center">
                  <div className="p-2 bg-yellow-600 text-white rounded-lg mr-3">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  Documentación
                </h3>
                <div className="bg-white rounded-lg p-4 shadow-sm space-y-3">
                  <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                    <span className="font-medium text-gray-700">Número de Documento:</span>
                    <span className="font-bold text-gray-900 text-lg">{movimiento.Documento}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                    <span className="font-medium text-gray-700">Clasificación del Movimiento:</span>
                    <span className="font-medium text-gray-900">{movimiento.Clase || 'No especificada'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* COLUMNA DERECHA */}
            <div className="space-y-6">
              
              {/* SECCIÓN 4: INFORMACIÓN DEL LOTE */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                <h3 className="text-xl font-bold text-green-900 mb-4 flex items-center">
                  <div className="p-2 bg-green-600 text-white rounded-lg mr-3">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  Información del Lote
                </h3>
                <div className="bg-white rounded-lg p-4 shadow-sm space-y-3">
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="font-medium text-gray-700">Número de Lote:</span>
                    <span className="font-bold text-gray-900 text-lg">{movimiento.Lote || 'No especificado'}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="font-medium text-gray-700">Fecha de Vencimiento:</span>
                    <span className="font-medium text-gray-900">{formatFecha(movimiento.Vencimiento)}</span>
                  </div>
                </div>
              </div>

              {/* SECCIÓN 5: VALORES MONETARIOS */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                <h3 className="text-xl font-bold text-purple-900 mb-4 flex items-center">
                  <div className="p-2 bg-purple-600 text-white rounded-lg mr-3">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  Valores Monetarios
                </h3>
                <div className="bg-white rounded-lg p-4 shadow-sm space-y-4">
                  <div className="grid grid-cols-1 gap-3">
                    <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-sm text-gray-600 mb-1">Costo Unitario</p>
                      <p className="text-3xl font-bold text-green-600">S/ {formatDecimal(movimiento.Costo)}</p>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-gray-600 mb-1">Precio de Venta</p>
                      <p className="text-3xl font-bold text-blue-600">S/ {formatDecimal(movimiento.Venta)}</p>
                    </div>
                  </div>
                  <div className="border-t-2 border-purple-200 pt-4">
                    <div className="text-center p-4 bg-purple-50 rounded-lg border-2 border-purple-300">
                      <p className="text-sm text-gray-600 mb-1">Valor Total</p>
                      <p className="text-4xl font-bold text-purple-600">
                        S/ {formatDecimal(movimiento.Cantidad * movimiento.Costo)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECCIÓN 6: ANÁLISIS RÁPIDO */}
              <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-6 border border-indigo-200">
                <h3 className="text-xl font-bold text-indigo-900 mb-4 flex items-center">
                  <div className="p-2 bg-indigo-600 text-white rounded-lg mr-3">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H9a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  Análisis Rápido
                </h3>
                <div className="bg-white rounded-lg p-4 shadow-sm space-y-3">
                  <div className="p-3 bg-indigo-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-700 mb-1">Margen de Ganancia por Unidad:</p>
                    <p className="text-xl font-bold text-indigo-600">
                      S/ {formatDecimal(movimiento.Venta - movimiento.Costo)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {((movimiento.Venta - movimiento.Costo) / movimiento.Costo * 100).toFixed(1)}% de margen
                    </p>
                  </div>
                  <div className="p-3 bg-indigo-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-700 mb-1">Impacto en el Stock:</p>
                    <p className="text-lg font-bold text-indigo-600">
                      {movimiento.Movimiento === 1 ? '+' : '-'}{formatDecimal(movimiento.Cantidad)} unidades
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-4 border-t border-gray-200 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default KardexDetailModal; 