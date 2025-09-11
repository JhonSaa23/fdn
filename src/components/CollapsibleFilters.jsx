import { useState } from 'react';

const CollapsibleFilters = ({ 
  children, 
  buttons, 
  title = "Filtros",
  isExpanded: externalIsExpanded,
  onToggle: externalOnToggle
}) => {
  const [internalIsExpanded, setInternalIsExpanded] = useState(false);
  
  // Usar estado externo si se proporciona, sino usar estado interno
  const isExpanded = externalIsExpanded !== undefined ? externalIsExpanded : internalIsExpanded;
  const onToggle = externalOnToggle || (() => setInternalIsExpanded(!internalIsExpanded));

  return (
    <div className="w-full">
      {/* Botón toggle solo en móvil */}
      <div className="md:hidden mb-4">
        <button
          onClick={onToggle}
          className="flex items-center justify-between w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <span>{title}</span>
          <svg
            className={`w-5 h-5 transition-transform duration-200 ${
              isExpanded ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      </div>

      {/* Filtros colapsables en móvil, siempre visibles en desktop */}
      <div className={`md:block ${isExpanded ? 'block' : 'hidden'}`}>
        {children}
      </div>

      {/* Botones siempre visibles */}
      <div className="mt-4">
        {buttons}
      </div>
    </div>
  );
};

export default CollapsibleFilters; 
