import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ChevronDownIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const SearchableSelect = ({ 
  options = [], 
  value, 
  onChange, 
  placeholder = "Seleccionar...", 
  searchPlaceholder = "Buscar...",
  loading = false,
  onSearch,
  className = "",
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // Memoizar las opciones filtradas para evitar re-renders innecesarios
  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) {
      return options;
    }
    
    const term = searchTerm.toLowerCase();
    return options.filter(option =>
      option.Razon?.toLowerCase().includes(term) ||
      option.Documento?.toLowerCase().includes(term)
    );
  }, [searchTerm, options]);

  // Limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Enfocar input de búsqueda cuando se abre el dropdown
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      if (!isOpen) {
        setSearchTerm('');
      }
    }
  };

  const handleSelect = (option) => {
    onChange(option);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchTerm('');
    }
  };

  const selectedOption = options.find(option => 
    option.Documento === value?.Documento
  );

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Input principal */}
      <div
        className={`
          w-full px-3 py-2 border border-gray-300 rounded-md text-sm 
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          cursor-pointer flex items-center justify-between
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white hover:border-gray-400'}
        `}
        onClick={handleToggle}
      >
        <span className={selectedOption ? 'text-gray-900' : 'text-gray-500'}>
          {selectedOption ? selectedOption.DisplayText : placeholder}
        </span>
        <ChevronDownIcon 
          className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
        />
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-hidden">
          {/* Input de búsqueda */}
          <div className="p-2 border-b border-gray-200">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={searchPlaceholder}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Lista de opciones */}
          <div className="max-h-48 overflow-y-auto">
            {loading ? (
              <div className="p-3 text-center text-gray-500 text-sm">
                Cargando...
              </div>
            ) : filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => (
                <div
                  key={`${option.Documento}-${index}`}
                  className="px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 hover:text-blue-900 transition-colors"
                  onClick={() => handleSelect(option)}
                >
                  <div className="font-medium">{option.Razon}</div>
                  <div className="text-xs text-gray-500">
                    {option.Documento}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-3 text-center text-gray-500 text-sm">
                {searchTerm ? 'No se encontraron resultados' : 'No hay opciones disponibles'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
