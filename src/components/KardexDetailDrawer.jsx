import React, { useState, useEffect, useRef } from 'react';

const KardexDetailDrawer = ({ isOpen, onClose, movimiento }) => {
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const drawerRef = useRef(null);

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
    if (tipo === 1) return 'ENTRADA';
    if (tipo === 2) return 'SALIDA';
    return 'TIPO NO ESPECIFICADO';
  };

  // Reset del estado cuando se abre/cierra
  useEffect(() => {
    if (isOpen) {
      setDragOffset(0);
      setIsDragging(false);
    }
  }, [isOpen]);

  // Funciones para manejar el arrastre
  const handleTouchStart = (e) => {
    setIsDragging(true);
    setStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    
    const currentY = e.touches[0].clientY;
    const deltaY = Math.max(0, currentY - startY); // Solo permitir arrastrar hacia abajo
    setDragOffset(deltaY);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    
    // Si se arrastró más de 150px hacia abajo, cerrar el drawer
    if (dragOffset > 150) {
      // Vibración sutil al cerrar (si está disponible)
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
      onClose();
    } else {
      // Si no, volver a la posición original
      setDragOffset(0);
    }
  };

  // Funciones para mouse (desktop)
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartY(e.clientY);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    const currentY = e.clientY;
    const deltaY = Math.max(0, currentY - startY);
    setDragOffset(deltaY);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    
    if (dragOffset > 150) {
      // Vibración sutil al cerrar (si está disponible)
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
      onClose();
    } else {
      setDragOffset(0);
    }
  };

  // Agregar/remover event listeners para mouse
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, startY, dragOffset]);

  // Función para cerrar con animación
  const handleClose = () => {
    setDragOffset(0);
    setTimeout(onClose, 100);
  };

  // Verificación después de todos los hooks
  if (!movimiento) return null;

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className={`fixed inset-0 bg-black z-40 md:hidden transition-opacity duration-300 ease-in-out ${
            isDragging && dragOffset > 50 ? 'bg-opacity-20' : 'bg-opacity-50'
          }`}
          onClick={handleClose}
        />
      )}

      {/* Drawer */}
      <div 
        ref={drawerRef}
        className={`
          fixed bottom-0 left-0 right-0 bg-white z-50 md:hidden
          transform transition-all duration-300 ease-out
          ${isOpen ? 'translate-y-0' : 'translate-y-full'}
          rounded-t-2xl shadow-2xl max-h-[90vh] overflow-hidden
          ${isDragging ? 'transition-none' : ''}
          flex flex-col
        `}
        style={{
          transform: isOpen 
            ? `translateY(${dragOffset}px)` 
            : 'translateY(100%)',
          opacity: dragOffset > 100 ? Math.max(0.3, 1 - (dragOffset - 100) / 100) : 1
        }}
      >
        {/* Handle - Arrastrable con animaciones */}
        <div 
          className={`
            flex justify-center py-4 border-b border-gray-200 cursor-grab active:cursor-grabbing 
            bg-gradient-to-b from-gray-50 to-gray-100 rounded-t-2xl
            transition-all duration-200 hover:bg-gradient-to-b hover:from-gray-100 hover:to-gray-150
            ${isDragging ? 'bg-gradient-to-b from-blue-50 to-blue-100' : ''}
          `}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
        >
          <div className="flex flex-col items-center space-y-1">
            <div className={`
              w-12 h-1 rounded-full transition-all duration-200
              ${isDragging ? 'bg-blue-500 w-16' : 'bg-gray-400'}
            `}></div>
            <div className={`
              w-8 h-1 rounded-full transition-all duration-200
              ${isDragging ? 'bg-blue-400 w-10' : 'bg-gray-300'}
            `}></div>
            {dragOffset > 100 && (
              <div className="text-xs text-gray-500 mt-1 animate-pulse">
                ↓ Suelta para cerrar
              </div>
            )}
          </div>
        </div>

        {/* Header */}

        {/* Content - Con scroll interno */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-6 py-4 space-y-6">
          
          {/* SECCIÓN 1: ESTADO ACTUAL DEL INVENTARIO */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              Estado del Inventario
            </h3>
            <div className="bg-white rounded-lg p-3 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Stock Actual:</span>
                <span className="text-xl font-bold text-blue-600">
                  {formatDecimal(movimiento.Stock)} 
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Código del Producto:</span>
                <span className="font-semibold text-gray-900">{movimiento.CodPro}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Almacén:</span>
                <span className="px-2 py-1 bg-gray-100 rounded text-sm font-medium">
                  {movimiento.Almacen || 'No especificado'}
                </span>
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: DETALLES DEL MOVIMIENTO */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              Movimiento Realizado
            </h3>
            <div className="space-y-3">
              <div className="bg-white rounded-lg p-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-600">Tipo de Movimiento:</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                    movimiento.Movimiento === 1 ? 'bg-green-100 text-green-800' : 
                    movimiento.Movimiento === 2 ? 'bg-red-100 text-red-800' : 
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {formatMovimiento(movimiento.Movimiento)}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-600">Cantidad Movida:</span>
                  <span className="text-lg font-bold text-gray-900">
                    {formatDecimal(movimiento.Cantidad)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Fecha del Movimiento:</span>
                  <span className="font-medium text-gray-900">{formatFecha(movimiento.Fecha)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* SECCIÓN 3: DOCUMENTACIÓN */}
          <div className="bg-yellow-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-yellow-900 mb-3 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Documentación
            </h3>
            <div className="bg-white rounded-lg p-3 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Número de Documento:</span>
                <span className="font-medium text-gray-900">{movimiento.Documento}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Clasificación:</span>
                <span className="font-medium text-gray-900">{movimiento.Clase || 'No especificada'}</span>
              </div>
            </div>
          </div>

          {/* SECCIÓN 4: INFORMACIÓN DEL LOTE */}
          <div className="bg-green-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-green-900 mb-3 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Información del Lote
            </h3>
            <div className="bg-white rounded-lg p-3 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Lote:</span>
                <span className="font-medium text-gray-900">{movimiento.Lote || 'No especificado'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Vencimiento: </span>
                <span className="font-medium text-gray-900">{formatFecha(movimiento.Vencimiento)}</span>
              </div>
            </div>
          </div>

          {/* SECCIÓN 5: VALORES MONETARIOS */}
          <div className="bg-purple-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-purple-900 mb-3 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
              Valores Monetarios
            </h3>
            <div className="bg-white rounded-lg p-3 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Costo Unitario:</span>
                <span className="text-lg font-bold text-green-600">
                  S/ {formatDecimal(movimiento.Costo)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Precio de Venta:</span>
                <span className="text-lg font-bold text-blue-600">
                  S/ {formatDecimal(movimiento.Venta)}
                </span>
              </div>
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Valor Total del Movimiento:</span>
                  <span className="text-lg font-bold text-purple-600">
                    S/ {formatDecimal(movimiento.Cantidad * movimiento.Costo)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          </div>
        </div>

        
      </div>
    </>
  );
};

export default KardexDetailDrawer; 