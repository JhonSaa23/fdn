const MobileTable = ({ data, columns, loading, emptyMessage = "No hay datos disponibles", onRowClick }) => {
  // Dividir las columnas en grupos de 3 para mostrar en líneas en móvil
  const getColumnGroups = (columns) => {
    const groups = [];
    for (let i = 0; i < columns.length; i += 3) {
      groups.push(columns.slice(i, i + 3));
    }
    return groups;
  };

  const columnGroups = getColumnGroups(columns);

  // Función para renderizar el valor de una celda
  const renderCellValue = (column, item) => {
    if (column.formatter) {
      return column.formatter(item[column.key], item);
    }
    return item[column.key] || '-';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-gray-600">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <>
      {/* Vista desktop: tabla tradicional */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {column.title}
                </th>
              ))}
            </tr>
          </thead>
          
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((item, index) => (
              <tr 
                key={index} 
                className={`hover:bg-gray-50 ${onRowClick ? 'cursor-pointer hover:bg-blue-50' : ''}`}
                onClick={() => onRowClick && onRowClick(item)}
              >
                {columns.map((column) => (
                  <td key={column.key} className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {renderCellValue(column, item)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Vista móvil: tarjetas compactas */}
      <div className="md:hidden space-y-2 p-3">
        {data.map((item, index) => (
          <div 
            key={index} 
            className={`bg-white border border-gray-100 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow ${
              onRowClick ? 'cursor-pointer hover:bg-blue-50 hover:border-blue-200 active:bg-blue-100' : ''
            }`}
            onClick={() => onRowClick && onRowClick(item)}
          >
            {/* Línea principal: Información más importante */}
            {columnGroups[0] && (
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center space-x-2 flex-1">
                  <span className="text-sm font-semibold text-gray-900">
                    {renderCellValue(columnGroups[0][0], item)}
                  </span>
                  {columnGroups[0][1] && (
                    <span className="text-sm text-gray-700">
                      {renderCellValue(columnGroups[0][1], item)}
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {columnGroups[0][2] && (
                    <span className="text-sm font-medium text-blue-600">
                      {renderCellValue(columnGroups[0][2], item)}
                    </span>
                  )}
                  {onRowClick && (
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </div>
              </div>
            )}

            {/* Línea secundaria: Información adicional */}
            {columnGroups[1] && (
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  {columnGroups[1].slice(0, 2).map((column, idx) => (
                    <span key={column.key}>
                      {renderCellValue(column, item)}
                      {idx === 0 && columnGroups[1][1] && <span className="mx-1">•</span>}
                    </span>
                  ))}
                </div>
                {columnGroups[1][2] && (
                  <span className="text-sm text-gray-600">
                    {renderCellValue(columnGroups[1][2], item)}
                  </span>
                )}
              </div>
            )}

            {/* Línea terciaria: Detalles */}
            {columnGroups[2] && (
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center space-x-1">
                  {columnGroups[2].slice(0, 2).map((column, idx) => (
                    <span key={column.key}>
                      {renderCellValue(column, item)}
                      {idx === 0 && columnGroups[2][1] && <span className="mx-1">•</span>}
                    </span>
                  ))}
                </div>
                {columnGroups[2][2] && (
                  <span>{renderCellValue(columnGroups[2][2], item)}</span>
                )}
              </div>
            )}

            {/* Líneas adicionales - ocultas por defecto, más compactas */}
            {columnGroups.slice(3).length > 0 && (
              <div className="mt-2 pt-2 border-t border-gray-100 space-y-1">
                {columnGroups.slice(3).map((group, groupIndex) => (
                  <div key={groupIndex + 3} className="flex items-center justify-between text-xs text-gray-400">
                    <div className="flex items-center space-x-1">
                      {group.slice(0, 2).map((column, idx) => (
                        <span key={column.key}>
                          {renderCellValue(column, item)}
                          {idx === 0 && group[1] && <span className="mx-1">•</span>}
                        </span>
                      ))}
                    </div>
                    {group[2] && (
                      <span>{renderCellValue(group[2], item)}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
};

export default MobileTable; 
