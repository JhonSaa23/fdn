import CollapsibleFilters from './CollapsibleFilters';
import MobileTable from './MobileTable';

const ResponsiveTableContainer = ({ 
  title = "Consulta",
  filters,
  buttons,
  data,
  columns, // Para compatibilidad con otros componentes
  desktopColumns,
  mobileColumns,
  loading,
  emptyMessage = "No hay datos disponibles",
  maxHeight = "calc(100vh - 300px)",
  onRowClick,
  filtersExpanded,
  onToggleFilters
}) => {
  // Si se proporcionan columnas específicas para desktop/mobile, usarlas
  // Si no, usar las columnas genéricas para compatibilidad
  const finalDesktopColumns = desktopColumns || columns;
  const finalMobileColumns = mobileColumns || columns;
  return (
    <div className="space-y-6">
      {/* Card con filtros y botones */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-xl font-bold">{title}</h1>
            
            {/* Botones visibles solo en desktop */}
            <div className="hidden md:flex space-x-3">
              {buttons}
            </div>
          </div>

          {/* Filtros colapsables en móvil */}
          <CollapsibleFilters 
            title="Filtros de búsqueda"
            buttons={
              <div className="flex flex-wrap gap-3">
                {buttons}
              </div>
            }
            isExpanded={filtersExpanded}
            onToggle={onToggleFilters}
          >
            {filters}
          </CollapsibleFilters>
        </div>
      </div>

      {/* Tabla con scroll interno - desktop */}
      <div className="hidden md:block bg-white rounded-lg shadow-sm border border-gray-200">
        <div 
          className="overflow-auto"
          style={{ maxHeight }}
        >
          <MobileTable
            data={data}
            columns={finalDesktopColumns}
            loading={loading}
            emptyMessage={emptyMessage}
            onRowClick={onRowClick}
          />
        </div>
      </div>

      {/* Tarjetas móviles con scroll */}
      <div className="md:hidden">
        <div 
          className="overflow-auto"
          style={{ maxHeight }}
        >
          <MobileTable
            data={data}
            columns={finalMobileColumns}
            loading={loading}
            emptyMessage={emptyMessage}
            onRowClick={onRowClick}
          />
        </div>
      </div>
    </div>
  );
};

export default ResponsiveTableContainer; 