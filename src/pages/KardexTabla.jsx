import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNotification } from '../App';
import axios from '../services/axiosClient';
import { getObservacionesDocumento, ejecutarProcedimientoKardex, getKardexTabla, obtenerDetalleDocumentoConHeaders, obtenerTodosLosProductos } from '../services/api';
import ObservacionesModal from '../components/ObservacionesModal';
import DocumentoDetalleModal from '../components/DocumentoDetalleModal';
import {
  ChevronUpIcon,
  ChevronDownIcon,
  FunnelIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  PencilSquareIcon,
} from '@heroicons/react/24/outline';

const KardexTabla = () => {
  const { showNotification } = useNotification();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [filters, setFilters] = useState({});
  const [activeFilter, setActiveFilter] = useState(null);
  const [uniqueValues, setUniqueValues] = useState({});
  const [selectedValues, setSelectedValues] = useState({});
  const [searchText, setSearchText] = useState('');
  const [observacionesModal, setObservacionesModal] = useState({
    isOpen: false,
    documento: '',
    observaciones: null,
    loading: false
  });
  const [documentoModal, setDocumentoModal] = useState({
    isOpen: false,
    documento: '',
    data: null,
    loading: false
  });
  const [procedureParams, setProcedureParams] = useState({
    codigo: '',
    lote: '',
    fechaInicio: '',
    fechaFin: ''
  });
  const [executingProcedure, setExecutingProcedure] = useState(false);
  const filterMenuRef = useRef(null);

  // Estados para autocompletado de productos
  const [busquedaProducto, setBusquedaProducto] = useState('');
  const [todosLosProductos, setTodosLosProductos] = useState([]);
  const [productosFiltrados, setProductosFiltrados] = useState([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [cargandoProductos, setCargandoProductos] = useState(false);

  // Cargar datos
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await getKardexTabla();
        setData(response);
        
        // Obtener valores únicos para cada columna
        const values = {};
        response.forEach(row => {
          Object.keys(row).forEach(key => {
            if (!values[key]) values[key] = new Set();
            values[key].add(row[key]?.toString() || '');
          });
        });
        
        // Convertir Sets a Arrays ordenados
        Object.keys(values).forEach(key => {
          values[key] = Array.from(values[key]).sort();
        });
        
        setUniqueValues(values);
        
        // Inicializar todos los valores como seleccionados
        const selected = {};
        Object.keys(values).forEach(key => {
          selected[key] = new Set(values[key]);
        });
        setSelectedValues(selected);
        
      } catch (error) {
        console.error('Error al cargar datos:', error);
        showNotification('error', 'Error al cargar los datos del kardex');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Función para refrescar datos después de ejecutar procedimiento
  const refreshData = async () => {
    try {
      setLoading(true);
      const response = await getKardexTabla();
      setData(response);
      
      // Obtener valores únicos para cada columna
      const values = {};
      response.forEach(row => {
        Object.keys(row).forEach(key => {
          if (!values[key]) values[key] = new Set();
          values[key].add(row[key]?.toString() || '');
        });
      });
      
      // Convertir Sets a Arrays ordenados
      Object.keys(values).forEach(key => {
        values[key] = Array.from(values[key]).sort();
      });
      
      setUniqueValues(values);
      
      // Inicializar todos los valores como seleccionados
      const selected = {};
      Object.keys(values).forEach(key => {
        selected[key] = new Set(values[key]);
      });
      setSelectedValues(selected);
      
    } catch (error) {
      console.error('Error al recargar datos:', error);
      showNotification('Error al recargar los datos del kardex', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Función para manejar cambios en el formulario
  const handleParamChange = (field, value) => {
    setProcedureParams(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Función para cargar todos los productos
  const cargarTodosLosProductos = async () => {
    try {
      setCargandoProductos(true);
      const productos = await obtenerTodosLosProductos();
      setTodosLosProductos(productos);
      
      if (productos.length === 0) {
        showNotification('No se encontraron productos en la base de datos', 'warning');
      }
    } catch (error) {
      console.error('Error al cargar productos:', error);
      let mensaje = 'Error al cargar la lista de productos';
      
      if (error.response?.data) {
        const { type, details } = error.response.data;
        if (type === 'CONNECTION_ERROR') {
          mensaje = 'Error de conexión con la base de datos. Por favor, intente nuevamente.';
        } else {
          mensaje = `Error al cargar productos: ${details}`;
        }
      }
      
      showNotification(mensaje, 'error');
      setTodosLosProductos([]);
    } finally {
      setCargandoProductos(false);
    }
  };

  // Función para filtrar productos localmente
  const filtrarProductos = (busqueda) => {
    if (!busqueda) {
      setProductosFiltrados([]);
      return;
    }

    const busquedaLower = busqueda.toLowerCase();
    const resultados = todosLosProductos.filter(producto => 
      producto.codpro.toLowerCase().includes(busquedaLower) ||
      producto.nombre.toLowerCase().includes(busquedaLower)
    ).slice(0, 50); // Limitamos a 50 resultados

    setProductosFiltrados(resultados);
  };

  // Función para seleccionar un producto
  const handleSeleccionarProducto = (producto) => {
    setProcedureParams(prev => ({
      ...prev,
      codigo: producto.codpro
    }));
    setBusquedaProducto('');
    setMostrarSugerencias(false);
  };

  // Función para manejar cambios en el input de código
  const handleCodigoChange = (value) => {
    setProcedureParams(prev => ({
      ...prev,
      codigo: value
    }));
    
    setBusquedaProducto(value);
    
    if (value.length > 0) {
      setMostrarSugerencias(true);
      // Cargar productos si no están cargados
      if (todosLosProductos.length === 0 && !cargandoProductos) {
        cargarTodosLosProductos();
      }
    } else {
      setMostrarSugerencias(false);
    }
  };

  // Función para manejar tecla Enter
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Si hay sugerencias visibles y hay al menos una, seleccionar la primera
      if (mostrarSugerencias && productosFiltrados.length > 0) {
        handleSeleccionarProducto(productosFiltrados[0]);
      } else {
        handleExecuteProcedure();
      }
    }
  };

  // Función para ejecutar el procedimiento
  const handleExecuteProcedure = async () => {
    if (!procedureParams.codigo || !procedureParams.fechaInicio || !procedureParams.fechaFin) {
      showNotification('Los campos código, fecha inicio y fecha fin son obligatorios', 'error');
      return;
    }

    try {
      setExecutingProcedure(true);
      const response = await ejecutarProcedimientoKardex(procedureParams);
      
      if (response.success) {
        showNotification('Procedimiento ejecutado correctamente', 'success');
        // Recargar los datos de la tabla
        await refreshData();
      } else {
        showNotification(response.error || 'Error al ejecutar procedimiento', 'error');
      }
    } catch (error) {
      console.error('Error al ejecutar procedimiento:', error);
      showNotification('Error al ejecutar el procedimiento', 'error');
    } finally {
      setExecutingProcedure(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterMenuRef.current && !filterMenuRef.current.contains(event.target)) {
        setActiveFilter(null);
        setSearchText('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Efecto para filtrar productos cuando cambia la búsqueda
  useEffect(() => {
    filtrarProductos(busquedaProducto);
  }, [busquedaProducto, todosLosProductos]);

  // Efecto para cerrar las sugerencias al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      const sugerenciasElement = document.querySelector('.sugerencias-productos-kardex');
      const inputElement = document.querySelector('.input-producto-kardex');
      
      if (sugerenciasElement && inputElement) {
        if (!sugerenciasElement.contains(event.target) && !inputElement.contains(event.target)) {
          setMostrarSugerencias(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Ordenar datos
  const sortedData = useMemo(() => {
    if (!sortConfig.key) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      // Manejar valores nulos
      if (aValue === null) return sortConfig.direction === 'asc' ? -1 : 1;
      if (bValue === null) return sortConfig.direction === 'asc' ? 1 : -1;
      
      // Intentar ordenar como números si es posible
      const aNum = Number(aValue);
      const bNum = Number(bValue);
      
      if (!isNaN(aNum) && !isNaN(bNum)) {
        return sortConfig.direction === 'asc' ? aNum - bNum : bNum - aNum;
      }
      
      // Ordenar como strings
      return sortConfig.direction === 'asc' 
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue));
    });
  }, [data, sortConfig]);

  // Aplicar filtros
  const filteredData = useMemo(() => {
    return sortedData.filter(row => {
      return Object.keys(selectedValues).every(key => {
        const value = row[key]?.toString() || '';
        return selectedValues[key].has(value);
      });
    });
  }, [sortedData, selectedValues]);

  // Manejar clic en encabezado para ordenar
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Manejar filtros
  const handleFilterClick = (columnName) => {
    setActiveFilter(activeFilter === columnName ? null : columnName);
    setSearchText('');
  };

  const handleFilterClose = () => {
    setActiveFilter(null);
    setSearchText('');
  };

  const handleValueSelect = (columnName, value) => {
    setSelectedValues(prev => {
      const newSet = new Set(prev[columnName]);
      if (newSet.has(value)) {
        newSet.delete(value);
      } else {
        newSet.add(value);
      }
      return { ...prev, [columnName]: newSet };
    });
  };

  const handleSelectAll = (columnName) => {
    setSelectedValues(prev => ({
      ...prev,
      [columnName]: new Set(uniqueValues[columnName])
    }));
  };

  const handleDeselectAll = (columnName) => {
    setSelectedValues(prev => ({
      ...prev,
      [columnName]: new Set()
    }));
  };

  // Filtrar valores únicos por búsqueda
  const getFilteredValues = (columnName) => {
    if (!searchText) return uniqueValues[columnName];
    return uniqueValues[columnName].filter(value => 
      value.toString().toLowerCase().includes(searchText.toLowerCase())
    );
  };

  // Función para limpiar todos los filtros
  const clearAllFilters = () => {
    setSelectedValues({});
    setSortConfig({ key: null, direction: null });
  };

  // Verificar si hay filtros activos
  const hasActiveFilters = useMemo(() => {
    return Object.keys(selectedValues).some(key => selectedValues[key]?.size > 0) || 
           sortConfig.key !== null;
  }, [selectedValues, sortConfig]);

  // Función para obtener observaciones
  const handleVerObservaciones = async (documento) => {
    setObservacionesModal({
      isOpen: true,
      documento: documento,
      observaciones: null,
      loading: true
    });

    try {
      const response = await getObservacionesDocumento(documento);
      setObservacionesModal(prev => ({
        ...prev,
        observaciones: response.data,
        loading: false
      }));
    } catch (error) {
      console.error('Error al obtener observaciones:', error);
      showNotification('Error al obtener observaciones', 'error');
      setObservacionesModal(prev => ({
        ...prev,
        loading: false
      }));
    }
  };

  // Función para cerrar modal de observaciones
  const handleCloseObservaciones = () => {
    setObservacionesModal({
      isOpen: false,
      documento: '',
      observaciones: null,
      loading: false
    });
  };

  // Función para ver detalles del documento
  const handleVerDetallesDocumento = async (documento) => {
    setDocumentoModal({
      isOpen: true,
      documento: documento,
      data: null,
      loading: true
    });

    try {
      const response = await obtenerDetalleDocumentoConHeaders(documento);
      setDocumentoModal(prev => ({
        ...prev,
        data: response,
        loading: false
      }));
    } catch (error) {
      console.error('Error al obtener detalles del documento:', error);
      showNotification('Error al obtener detalles del documento', 'error');
      setDocumentoModal(prev => ({
        ...prev,
        loading: false
      }));
    }
  };

  // Función para cerrar modal de documento
  const handleCloseDocumento = () => {
    setDocumentoModal({
      isOpen: false,
      documento: '',
      data: null,
      loading: false
    });
  };

  // Función para formatear fechas
  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    const formatNumber = (num) => num.toString().padStart(2, '0');
    
    const year = date.getFullYear();
    const month = formatNumber(date.getMonth() + 1);
    const day = formatNumber(date.getDate());
    const hours = formatNumber(date.getHours());
    const minutes = formatNumber(date.getMinutes());
    
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden relative">
      {/* Formulario para ejecutar procedimiento sp_kardex */}
      <div className="p-2 border-b bg-gray-50">
        
        <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-medium text-gray-700">Consultar Kardex</h3>
          <button
            onClick={handleExecuteProcedure}
            disabled={executingProcedure}
            className="inline-flex items-center px-4 py-1 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {executingProcedure ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Ejecutando...
              </>
            ) : (
              'Consultar'
            )}
          </button>
        </div>
        <div className="grid grid-cols-4 md:grid-cols-4 gap-1">
          <div className="relative">
            <input
              type="text"
              value={procedureParams.codigo}
              onChange={(e) => handleCodigoChange(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full px-3 py-1 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 input-producto-kardex"
              placeholder="Código * - Escriba para buscar"
              disabled={executingProcedure}
            />
            
            {/* Lista de sugerencias */}
            {mostrarSugerencias && (busquedaProducto || cargandoProductos) && !executingProcedure && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto sugerencias-productos-kardex">
                {cargandoProductos ? (
                  <div className="p-2 text-gray-500">
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin h-5 w-5 mr-2 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Cargando productos...
                    </div>
                  </div>
                ) : productosFiltrados.length > 0 ? (
                  productosFiltrados.map((producto) => (
                    <div
                      key={producto.codpro}
                      onClick={() => handleSeleccionarProducto(producto)}
                      className="p-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-medium text-blue-600">{producto.codpro}</div>
                      <div className="text-sm text-gray-600">{producto.nombre}</div>
                    </div>
                  ))
                ) : busquedaProducto ? (
                  <div className="p-2 text-gray-500">No se encontraron productos</div>
                ) : todosLosProductos.length === 0 ? (
                  <div className="p-2 text-gray-500">No hay productos disponibles</div>
                ) : null}
              </div>
            )}
          </div>
          <div>
            <input
              type="text"
              value={procedureParams.lote}
              onChange={(e) => handleParamChange('lote', e.target.value)}
              className="w-full px-3 py-1 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Lote (opcional)"
              disabled={executingProcedure}
            />
          </div>
          <div>
            <input
              type="date"
              value={procedureParams.fechaInicio}
              onChange={(e) => handleParamChange('fechaInicio', e.target.value)}
              className="w-full px-3 py-1 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              min="1753-01-01"
              max="9999-12-31"
              placeholder="Fecha Inicio *"
              disabled={executingProcedure}
            />
          </div>
          <div>
            <input
              type="date"
              value={procedureParams.fechaFin}
              onChange={(e) => handleParamChange('fechaFin', e.target.value)}
              className="w-full px-3 py-1 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              min="1753-01-01"
              max="9999-12-31"
              placeholder="Fecha Fin *"
              disabled={executingProcedure}
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div style={{ height: 'calc(100vh - 150px)', overflow: 'auto' }}>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                {/* Columna de observaciones */}
                <th className="px-2 py-2 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                  Acciones
                </th>
                {Object.keys(data[0] || {}).map((columnName) => (
                  <th
                    key={columnName}
                    className="px-2 py-2 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider relative bg-gray-50"
                  >
                    <div className="flex items-center space-x-1">
                      <span className="hover:text-gray-700">
                        {columnName}
                        {sortConfig.key === columnName && (
                          sortConfig.direction === 'asc' 
                            ? <ChevronUpIcon className="h-3 w-3 inline ml-1" />
                            : <ChevronDownIcon className="h-3 w-3 inline ml-1" />
                        )}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFilterClick(columnName);
                        }}
                        className="hover:bg-gray-100 p-0.5 rounded"
                      >
                        <FunnelIcon className="h-3 w-3" />
                      </button>
                    </div>

                    {/* Menú de filtro */}
                    {activeFilter === columnName && (
                      <div 
                        ref={filterMenuRef}
                        className="fixed z-50 mt-1 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5" 
                        style={{
                          top: 'auto',
                          left: 'auto',
                          transform: 'translateY(0)'
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="p-2">
                          <div className="flex justify-between items-center mb-1">
                            <div className="text-xs font-medium text-gray-700">Filtrar {columnName}</div>
                            <button onClick={handleFilterClose} className="text-gray-400 hover:text-gray-500">
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                          </div>

                          {/* Opciones de ordenamiento */}
                          <div className="mb-2 flex space-x-2">
                            <button
                              onClick={() => {
                                handleSort(columnName);
                                if (sortConfig.key !== columnName || sortConfig.direction !== 'asc') {
                                  setSortConfig({ key: columnName, direction: 'asc' });
                                }
                              }}
                              className={`text-[10px] px-2 py-1 rounded ${
                                sortConfig.key === columnName && sortConfig.direction === 'asc'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                              }`}
                            >
                              <ChevronUpIcon className="h-3 w-3 inline mr-1" />
                              Asc
                            </button>
                            <button
                              onClick={() => {
                                handleSort(columnName);
                                if (sortConfig.key !== columnName || sortConfig.direction !== 'desc') {
                                  setSortConfig({ key: columnName, direction: 'desc' });
                                }
                              }}
                              className={`text-[10px] px-2 py-1 rounded ${
                                sortConfig.key === columnName && sortConfig.direction === 'desc'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                              }`}
                            >
                              <ChevronDownIcon className="h-3 w-3 inline mr-1" />
                              Desc
                            </button>
                          </div>

                          <div className="relative mb-1">
                            <input
                              type="text"
                              className="w-full px-2 py-1 border rounded-md text-xs"
                              placeholder="Buscar..."
                              value={searchText}
                              onChange={(e) => setSearchText(e.target.value)}
                            />
                            <MagnifyingGlassIcon className="absolute right-2 top-1.5 h-3 w-3 text-gray-400" />
                          </div>

                          <div className="flex justify-between mb-1">
                            <button
                              onClick={() => handleSelectAll(columnName)}
                              className="text-[10px] text-blue-600 hover:text-blue-800"
                            >
                              Seleccionar todo
                            </button>
                            <button
                              onClick={() => handleDeselectAll(columnName)}
                              className="text-[10px] text-blue-600 hover:text-blue-800"
                            >
                              Deseleccionar todo
                            </button>
                          </div>

                          <div className="max-h-40 overflow-y-auto">
                            {getFilteredValues(columnName).map((value) => (
                              <label key={value} className="flex items-center p-0.5 hover:bg-gray-50">
                                <input
                                  type="checkbox"
                                  checked={selectedValues[columnName]?.has(value) || false}
                                  onChange={() => handleValueSelect(columnName, value)}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-3 w-3"
                                />
                                <span className="ml-1.5 text-[11px] text-gray-700">
                                  {value || '(Vacío)'}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData.map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-gray-50">
                  {/* Botones de acciones */}
                  <td className="px-2 py-1 whitespace-nowrap">
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleVerObservaciones(row.Documento)}
                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-1 rounded transition-colors"
                        title="Ver observaciones"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleVerDetallesDocumento(row.Documento)}
                        className="text-green-600 hover:text-green-800 hover:bg-green-50 p-1 rounded transition-colors"
                        title="Ver detalles del documento"
                      >
                        <PencilSquareIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                  {Object.keys(row).map((key) => (
                    <td key={key} className="px-2 py-1 whitespace-nowrap text-[15px] text-gray-500">
                      {key.toLowerCase().includes('fecha') ? formatDateTime(row[key]) : row[key]?.toString() || ''}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="px-3 py-2 border-t">
        <div className="text-[11px] text-gray-500">
          Mostrando {filteredData.length} de {data.length} registros
        </div>
      </div>

      {/* Botón flotante para limpiar filtros */}
      {hasActiveFilters && (
        <button
          onClick={clearAllFilters}
          className="fixed bottom-3 right-4 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg px-3 py-2 flex items-center space-x-2 text-[11px] transition-all duration-200 hover:scale-105"
        >
          <XMarkIcon className="h-4 w-4" />
          <span>Limpiar filtros</span>
        </button>
      )}

      {/* Modal de observaciones */}
      <ObservacionesModal
        isOpen={observacionesModal.isOpen}
        onClose={handleCloseObservaciones}
        observaciones={observacionesModal.observaciones}
        documento={observacionesModal.documento}
      />

      {/* Modal de detalles del documento */}
      <DocumentoDetalleModal
        isOpen={documentoModal.isOpen}
        onClose={handleCloseDocumento}
        documentData={documentoModal.data}
        loading={documentoModal.loading}
      />
    </div>
  );
};

export default KardexTabla; 