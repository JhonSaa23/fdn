import React, { useState } from 'react';
import { useNotification } from '../App';
import { consultarKardex, obtenerDetalleDocumento } from '../services/api';
import Button from '../components/Button';
import ResponsiveTableContainer from '../components/ResponsiveTableContainer';
import KardexDetailDrawer from '../components/KardexDetailDrawer';
import KardexDetailModal from '../components/KardexDetailModal';
import DocumentDetailModal from '../components/DocumentDetailModal';

const Kardex = () => {
  const { showNotification } = useNotification();
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Estados para el detalle del movimiento
  const [selectedMovimiento, setSelectedMovimiento] = useState(null);
  const [showDetailDrawer, setShowDetailDrawer] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  // Estados para el modal de documento
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [documentData, setDocumentData] = useState(null);
  const [documentLoading, setDocumentLoading] = useState(false);
  
  // Estado para controlar los filtros colapsables
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  // Estados para filtros
  const [filtros, setFiltros] = useState({
    documento: '',
    fechaDesde: '',
    fechaHasta: '',
    codpro: '',
    lote: '',
    movimiento: '',
    clase: ''
  });

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFiltros(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Función para manejar click en documento
  const handleDocumentClick = async (documento) => {
    if (!documento || documento.trim() === '') {
      showNotification('Documento vacío', 'warning');
      return;
    }

    try {
      setDocumentLoading(true);
      setShowDocumentModal(true);
      setDocumentData(null); // Limpiar datos anteriores
      
      const data = await obtenerDetalleDocumento(documento.trim());
      setDocumentData(data);
      
      if (!data.success) {
        showNotification(data.message || 'No se encontraron detalles para este documento', 'info');
      }
    } catch (error) {
      console.error('Error al obtener detalles del documento:', error);
      showNotification('Error al obtener detalles del documento', 'error');
      setDocumentData({ 
        success: false, 
        message: 'Error al cargar los detalles del documento',
        documento: documento.trim()
      });
    } finally {
      setDocumentLoading(false);
    }
  };

  // Función para cerrar el modal de documento
  const handleCloseDocumentModal = () => {
    setShowDocumentModal(false);
    setDocumentData(null);
    setDocumentLoading(false);
  };

  // Función para ordenar movimientos por documento (del más antiguo al más reciente)
  const ordenarPorDocumento = (movimientos) => {
    return [...movimientos].sort((a, b) => {
      const docA = a.Documento || '';
      const docB = b.Documento || '';
      return docA.localeCompare(docB, 'es', { numeric: true });
    });
  };

  const handleConsultar = async () => {
    try {
      setLoading(true);
      console.log('Consultando kardex con filtros:', filtros);
      const data = await consultarKardex(filtros);
      const movimientosArray = Array.isArray(data) ? data : [];
      // Ordenar del más antiguo al más reciente por documento
      const movimientosOrdenados = ordenarPorDocumento(movimientosArray);
      setMovimientos(movimientosOrdenados);
      
      // Cerrar filtros automáticamente después de consultar (solo en móvil)
      setFiltersExpanded(false);
    } catch (error) {
      console.error('Error al consultar kardex:', error);
      let mensaje = 'Error al consultar movimientos';
      if (error.response) {
        mensaje = error.response.data?.error || mensaje;
      }
      showNotification(mensaje, 'error');
      setMovimientos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLimpiar = () => {
    setFiltros({
      documento: '',
      fechaDesde: '',
      fechaHasta: '',
      codpro: '',
      lote: '',
      movimiento: '',
      clase: ''
    });
    setMovimientos([]);
  };

  // Función para manejar el clic en una fila
  const handleRowClick = (movimiento) => {
    setSelectedMovimiento(movimiento);
    // Determinar si estamos en dispositivo móvil
    if (window.innerWidth < 768) {
      setShowDetailDrawer(true);
    } else {
      setShowDetailModal(true);
    }
  };

  // Funciones para cerrar los detalles
  const handleCloseDrawer = () => {
    setShowDetailDrawer(false);
    setSelectedMovimiento(null);
  };

  const handleCloseModal = () => {
    setShowDetailModal(false);
    setSelectedMovimiento(null);
  };

  // Función para manejar el toggle de filtros
  const handleToggleFilters = () => {
    setFiltersExpanded(!filtersExpanded);
  };

  // Función para formatear fecha de manera segura
  const formatFecha = (fecha) => {
    if (!fecha) return '';
    try {
      const date = new Date(fecha);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch (error) {
      return fecha;
    }
  };

  // Función para formatear el tipo de movimiento
  const formatMovimiento = (tipo) => {
    if (tipo === 1) return 'ENTRADA';
    if (tipo === 2) return 'SALIDA';
    return tipo;
  };

  // Función para formatear números decimales
  const formatDecimal = (numero) => {
    if (!numero) return '0.00';
    return parseFloat(numero).toFixed(2);
  };

  // Definir columnas para móvil con orden lógico del kardex
  const mobileColumns = [
    // GRUPO 1: Lo más importante - STOCK ACTUAL
    { 
      key: 'Stock', 
      title: 'Stock Actual', 
      formatter: (value) => (
        <span className="font-bold text-lg text-blue-600">
          {formatDecimal(value)}
        </span>
      )
    },

    // GRUPO 2: ¿Qué se hizo? - MOVIMIENTO
    { 
      key: 'Movimiento', 
      title: 'Movimiento', 
      formatter: (value) => (
        <span className={`px-3 py-1 rounded-full text-sm font-bold ${
          value === 1 ? 'bg-green-100 text-green-800' : 
          value === 2 ? 'bg-red-100 text-red-800' : 
          'bg-gray-100 text-gray-800'
        }`}>
          {formatMovimiento(value)}
        </span>
      )
    },

    // GRUPO 3: ¿Cuánto se movió? - CANTIDAD
    { 
      key: 'Cantidad', 
      title: 'Cantidad Movida', 
      formatter: (value) => (
        <span className="font-semibold text-gray-900">
          {formatDecimal(value)}
        </span>
      )
    },

    // GRUPO 4: ¿Dónde? - ALMACÉN
    { 
      key: 'Almacen', 
      title: 'Almacén',
      formatter: (value) => (
        <span className="px-2 py-1 bg-gray-100 rounded text-sm font-medium">
          {value || 'N/A'}
        </span>
      )
    },

    // GRUPO 5: Identificación del Producto
    { key: 'CodPro', title: 'Producto' },
    { key: 'Fecha', title: 'Fecha', formatter: (value) => formatFecha(value) },
    { 
      key: 'Documento', 
      title: 'Documento',
      formatter: (value, row) => (
        <button
          onClick={(e) => {
            e.stopPropagation(); // Evitar que se active el click de la fila
            handleDocumentClick(value);
          }}
          className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer font-medium"
          title="Ver detalles del documento"
        >
          {value || 'Sin documento'}
        </button>
      )
    },

    // GRUPO 6: Detalles del Producto
    { key: 'Lote', title: 'Lote' },
    { key: 'Vencimiento', title: 'Vencimiento', formatter: (value) => formatFecha(value) },
    { key: 'Clase', title: 'Clase' },

    // GRUPO 7: Valores Monetarios
    { key: 'Costo', title: 'Costo Unit.', formatter: (value) => `S/ ${formatDecimal(value)}` },
    { key: 'Venta', title: 'P. Venta', formatter: (value) => `S/ ${formatDecimal(value)}` }
  ];

  // Definir columnas para desktop en el orden de la base de datos
  const desktopColumns = [
    // 1. Documento - Hacer clickeable
    { 
      key: 'Documento', 
      title: 'Documento',
      formatter: (value, row) => (
        <button
          onClick={(e) => {
            e.stopPropagation(); // Evitar que se active el click de la fila
            handleDocumentClick(value);
          }}
          className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer font-medium"
          title="Ver detalles del documento"
        >
          {value || 'Sin documento'}
        </button>
      )
    },
    
    // 2. Fecha
    { key: 'Fecha', title: 'Fecha', formatter: (value) => formatFecha(value) },
    
    // 3. CodPro
    { key: 'CodPro', title: 'CodPro' },
    
    // 4. Lote
    { key: 'Lote', title: 'Lote' },
    
    // 5. Vencimiento
    { key: 'Vencimiento', title: 'Vencimiento', formatter: (value) => formatFecha(value) },
    
    // 6. Movimiento
    { 
      key: 'Movimiento', 
      title: 'Movimiento', 
      formatter: (value) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          value === 1 ? 'bg-green-100 text-green-800' : 
          value === 2 ? 'bg-red-100 text-red-800' : 
          'bg-gray-100 text-gray-800'
        }`}>
          {formatMovimiento(value)}
        </span>
      )
    },
    
    // 7. Clase
    { key: 'Clase', title: 'Clase' },
    
    // 8. Cantidad
    { 
      key: 'Cantidad', 
      title: 'Cantidad', 
      formatter: (value) => formatDecimal(value)
    },
    
    // 9. Costo
    { key: 'Costo', title: 'Costo', formatter: (value) => formatDecimal(value) },
    
    // 10. Venta
    { key: 'Venta', title: 'Venta', formatter: (value) => formatDecimal(value) },
    
    // 11. Stock
    { 
      key: 'Stock', 
      title: 'Stock', 
      formatter: (value) => formatDecimal(value)
    },
    
    // 12. Almacen
    { 
      key: 'Almacen', 
      title: 'Almacen',
      formatter: (value) => value || 'N/A'
    },
    
    // 13. Impreso
    { 
      key: 'Impreso', 
      title: 'Impreso',
      formatter: (value) => (
        <span className={`px-2 py-1 rounded text-xs ${
          value === 1 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {value === 1 ? 'Sí' : 'No'}
        </span>
      )
    },
    
    // 14. Anulado
    { 
      key: 'Anulado', 
      title: 'Anulado',
      formatter: (value) => (
        <span className={`px-2 py-1 rounded text-xs ${
          value === 1 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
        }`}>
          {value === 1 ? 'Sí' : 'No'}
        </span>
      )
    }
  ];

  // Componente de filtros
  const filters = (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 xl:grid-cols-6 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Producto (CodPro)
        </label>
        <input
          type="text"
          name="codpro"
          value={filtros.codpro}
          onChange={handleFilterChange}
          placeholder="Ej: 39504"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Fecha Desde
        </label>
        <input
          type="date"
          name="fechaDesde"
          value={filtros.fechaDesde}
          onChange={handleFilterChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Fecha Hasta
        </label>
        <input
          type="date"
          name="fechaHasta"
          value={filtros.fechaHasta}
          onChange={handleFilterChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tipo de Movimiento
        </label>
        <select
          name="movimiento"
          value={filtros.movimiento}
          onChange={handleFilterChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        >
          <option value="">Todos los movimientos</option>
          <option value="1">Solo Entradas</option>
          <option value="2">Solo Salidas</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Documento
        </label>
        <input
          type="text"
          name="documento"
          value={filtros.documento}
          onChange={handleFilterChange}
          placeholder="Ej: 100-0000001"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Lote
        </label>
        <input
          type="text"
          name="lote"
          value={filtros.lote}
          onChange={handleFilterChange}
          placeholder="Número de lote"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
      </div>

    </div>
  );

  // Botones de acción
  const buttons = [
    <Button
      key="limpiar"
      onClick={handleLimpiar}
      className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2"
    >
      Limpiar
    </Button>,
    <Button
      key="consultar"
      onClick={handleConsultar}
      disabled={loading}
      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
    >
      {loading ? 'Consultando...' : 'Consultar'}
    </Button>
  ];

  return (
    <>
      <ResponsiveTableContainer
        title="Kardex de Inventario"
        filters={filters}
        buttons={buttons}
        data={movimientos}
        desktopColumns={desktopColumns}
        mobileColumns={mobileColumns}
        loading={loading}
        emptyMessage="No se encontraron movimientos. Use los filtros para consultar el kardex."
        maxHeight="calc(100vh - 280px)"
        onRowClick={handleRowClick}
        filtersExpanded={filtersExpanded}
        onToggleFilters={handleToggleFilters}
      />

      {/* Drawer para móvil */}
      <KardexDetailDrawer
        isOpen={showDetailDrawer}
        onClose={handleCloseDrawer}
        movimiento={selectedMovimiento}
      />

      {/* Modal para desktop */}
      <KardexDetailModal
        isOpen={showDetailModal}
        onClose={handleCloseModal}
        movimiento={selectedMovimiento}
      />

      {/* Modal para detalles de documento */}
      <DocumentDetailModal
        isOpen={showDocumentModal}
        onClose={handleCloseDocumentModal}
        documentData={documentData}
        loading={documentLoading}
      />
    </>
  );
};

export default Kardex; 