import React, { useState, useEffect, useMemo } from 'react';
import { useNotification } from '../App';
import axios from '../services/axiosClient';
import {
  ChevronUpIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';

const KardexTabla = () => {
  const { showNotification } = useNotification();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

  // Cargar datos
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/kardex/tabla');
        setData(response.data);
      } catch (error) {
        console.error('Error al cargar datos:', error);
        showNotification('error', 'Error al cargar los datos del kardex');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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

  // Manejar clic en encabezado para ordenar
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tabla */}
      <div className="bg-white rounded-lg shadow overflow-hidden relative">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {Object.keys(data[0] || {}).map((columnName) => (
                  <th
                    key={columnName}
                    className="px-2 py-2 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort(columnName)}
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
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedData.map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-gray-50">
                  {Object.keys(row).map((key) => (
                    <td key={key} className="px-2 py-1 whitespace-nowrap text-[11px] text-gray-500">
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
            Mostrando {sortedData.length} registros
          </div>
        </div>
      </div>
    </div>
  );
};

export default KardexTabla; 