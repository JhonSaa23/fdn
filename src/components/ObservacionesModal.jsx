import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const ObservacionesModal = ({ isOpen, onClose, observaciones, documento }) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-lg max-w-lg w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            Observaciones
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-4">
          {observaciones ? (
            <div className="space-y-4">
              {/* Fila 1: Documento y Fecha */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Documento:</label>
                  <p className="text-sm text-gray-900">{observaciones.Documento?.trim()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Fecha:</label>
                  <p className="text-sm text-gray-900">
                    {new Date(observaciones.Fecha).toLocaleDateString('es-ES')}
                  </p>
                </div>
              </div>
              
              {/* Fila 2: Estado */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Estado:</label>
                <span className={`inline-block px-2 py-1 text-xs rounded ${
                  observaciones.Anulado === 0 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-red-100 text-red-700'
                }`}>
                  {observaciones.Anulado === 0 ? 'Activo' : 'Anulado'}
                </span>
              </div>
              
              {/* Fila 3: Observaciones (ancho completo) */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Observaciones:</label>
                <div className="bg-gray-50 rounded p-3 min-h-[60px]">
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">
                    {observaciones.Observaciones?.trim() || 'Sin observaciones'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-500">No se encontraron observaciones</p>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="flex justify-end p-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors text-sm"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ObservacionesModal; 
