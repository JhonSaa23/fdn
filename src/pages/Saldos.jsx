import { useState, useEffect } from 'react';
import { useNotification } from '../App';
import { 
  MagnifyingGlassIcon, 
  FunnelIcon, 
  ArrowDownTrayIcon,
  XMarkIcon,
  ArchiveBoxIcon
} from '@heroicons/react/24/outline';

const Saldos = () => {
  const { showNotification } = useNotification();
  const [saldos, setSaldos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [filtros, setFiltros] = useState({
    codigoProducto: '00'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [codigosDisponibles, setCodigosDisponibles] = useState([]);

  // Cargar saldos por defecto al montar el componente
  useEffect(() => {
    cargarSaldos();
    cargarCodigosDisponibles();
  }, []);

  const cargarSaldos = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      Object.entries(filtros).forEach(([key, value]) => {
        if (value && value.trim() !== '') {
          params.append(key, value.trim());
        }
      });

      const response = await fetch(`/api/saldos?${params.toString()}`);
      const data = await response.json();
      
      if (data.success) {
        setSaldos(data.data);
      } else {
        showNotification('danger', data.error || 'Error al cargar los saldos');
      }
    } catch (error) {
      console.error('Error al cargar saldos:', error);
      showNotification('danger', 'Error de conexión al cargar los saldos');
    } finally {
      setLoading(false);
    }
  };

  const cargarCodigosDisponibles = async () => {
    try {
      const response = await fetch('/api/saldos/codigos-disponibles');
      const data = await response.json();
      
      if (data.success) {
        setCodigosDisponibles(data.data);
      }
    } catch (error) {
      console.error('Error al cargar códigos disponibles:', error);
    }
  };

  const buscarSaldos = async () => {
    await cargarSaldos();
  };

  const exportarExcel = async () => {
    try {
      setExporting(true);
      
      const params = new URLSearchParams();
      Object.entries(filtros).forEach(([key, value]) => {
        if (value && value.trim() !== '') {
          params.append(key, value.trim());
        }
      });

      const response = await fetch(`/api/saldos/export?${params.toString()}`);
      if (!response.ok) throw new Error('Error al exportar los saldos');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `saldos_${filtros.codigoProducto}_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      showNotification('success', `Archivo Excel exportado correctamente`);
    } catch (error) {
      console.error('Error al exportar saldos:', error);
      showNotification('danger', 'Error de conexión al exportar los saldos');
    } finally {
      setExporting(false);
    }
  };

  const limpiarFiltros = () => {
    setFiltros({
      codigoProducto: '00'
    });
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatearNumero = (numero) => {
    if (!numero && numero !== 0) return '0';
    return parseFloat(numero).toLocaleString('es-PE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const formatearFechaHora = (fecha) => {
    if (!fecha) return '';
    const d = new Date(fecha);
    const dia = d.getDate().toString().padStart(2, '0');
    const mes = (d.getMonth() + 1).toString().padStart(2, '0');
    const anio = d.getFullYear();
    const hora = d.getHours().toString().padStart(2, '0');
    const min = d.getMinutes().toString().padStart(2, '0');
    return `${dia}/${mes}/${anio} ${hora}:${min}`;
  };

  return (
    <div className="container mx-auto">
      

      {/* Panel de filtros */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-2">
        <div className="border-b border-gray-200 px-4 py-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900 font-medium"
          >
            <FunnelIcon className="w-5 h-5" />
            Filtros de búsqueda
            <span className={`transform transition-transform ${showFilters ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </button>
        </div>
        
        {showFilters && (
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código de Producto (2 dígitos)
                </label>
                <select
                  value={filtros.codigoProducto}
                  onChange={(e) => setFiltros({...filtros, codigoProducto: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {codigosDisponibles.map(codigo => (
                    <option key={codigo} value={codigo}>
                      {codigo}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <button
                onClick={buscarSaldos}
                disabled={loading}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                <MagnifyingGlassIcon className="w-4 h-4" />
                {loading ? 'Buscando...' : 'Buscar'}
              </button>
              
              <button
                onClick={limpiarFiltros}
                className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
              >
                <XMarkIcon className="w-4 h-4" />
                Limpiar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Panel de acciones */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">
            Saldos 
          </h2>
          
          <button
            onClick={exportarExcel}
            disabled={exporting || saldos.length === 0}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            {exporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Exportando...
              </>
            ) : (
              <>
                <ArrowDownTrayIcon className="w-4 h-4" />
                Exportar Excel
              </>
            )}
          </button>
        </div>
        
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Cargando saldos...</p>
          </div>
        ) : saldos.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No se encontraron saldos con los filtros aplicados
          </div>
        ) : (
          <>
            {/* Vista desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      CodPro
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nombre
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Almacén
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Lote
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vencimiento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Saldo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Protocolo
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {saldos.map((saldo, index) => (
                    <tr key={`${saldo.codpro}-${saldo.almacen}-${saldo.lote}-${index}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-mono text-gray-900 font-medium">
                          {saldo.codpro}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate" title={saldo.NombreProducto}>
                          {saldo.NombreProducto || 'Sin nombre'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {saldo.almacen || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {saldo.lote || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatearFecha(saldo.vencimiento)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="font-medium">{formatearNumero(saldo.saldo)}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {saldo.protocolo || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Vista móvil */}
            <div className="md:hidden">
              {saldos.map((saldo, index) => (
                <div key={`${saldo.codpro}-${saldo.almacen}-${saldo.lote}-${index}`} className="border-b border-gray-200 p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-sm font-mono font-medium text-gray-900">
                        {saldo.codpro}
                      </span>
                      <div className="text-xs text-gray-500 mt-1">
                        Almacén: {saldo.almacen || '-'} | Lote: {saldo.lote || '-'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {formatearNumero(saldo.saldo)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatearFecha(saldo.vencimiento)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-2">
                    <div className="text-sm text-gray-900">{saldo.NombreProducto || 'Sin nombre'}</div>
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    Protocolo: {saldo.protocolo || '-'}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Saldos; 