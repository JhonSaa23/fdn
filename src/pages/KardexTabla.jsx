import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNotification } from '../App';
import axios from '../services/axiosClient';
import {
  ChevronUpIcon,
  ChevronDownIcon,
  FunnelIcon,
  XMarkIcon,
  MagnifyingGlassIcon
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
  const filterMenuRef = useRef(null);

  // Cargar datos
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/kardex/tabla');
        setData(response.data);
        
        // Obtener valores únicos para cada columna
        const values = {};
        response.data.forEach(row => {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden relative">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {Object.keys(data[0] || {}).map((columnName) => (
                <th
                  key={columnName}
                  className="px-2 py-2 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider relative"
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
                                checked={selectedValues[columnName].has(value)}
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
                {Object.keys(row).map((key) => (
                  <td key={key} className="px-2 py-1 whitespace-nowrap text-[15px] text-gray-500">
                    {row[key]?.toString() || ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
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
          className="fixed bottom-4 right-4 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg p-3 flex items-center space-x-2 text-[11px] transition-all duration-200 hover:scale-105"
        >
          <XMarkIcon className="h-4 w-4" />
          <span>Limpiar filtros</span>
        </button>
      )}
    </div>
  );
};

export default KardexTabla; 