import { useState, useEffect, useCallback, useRef } from 'react';
import { useNotification } from '../App';
import { 
  MagnifyingGlassIcon, 
  FunnelIcon, 
  ArrowDownTrayIcon,
  XMarkIcon,
  ArchiveBoxIcon,
  PencilSquareIcon,
  PlusIcon,
  MinusIcon
} from '@heroicons/react/24/outline';
import axiosClient from '../services/axiosClient';

const Saldos = () => {
  const { showNotification } = useNotification();
  
  // Estados principales
  const [saldos, setSaldos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  
  // Estados para filtros de búsqueda inicial
  const [filtros, setFiltros] = useState({
    codigoProducto: '00'
  });
  const [codigosDisponibles, setCodigosDisponibles] = useState([]);

  // Estados para datos
  const [currentPage, setCurrentPage] = useState(1);
  const [totalSaldos, setTotalSaldos] = useState(0);
  const [allSaldos, setAllSaldos] = useState([]); // Todos los datos cargados
  
  // Configuración de paginación
  const REGISTROS_POR_PAGINA = 5; // Mostrar solo 5 registros por página
  
  // Estados para filtros en tiempo real
  const [filtroTiempoReal, setFiltroTiempoReal] = useState({
    codpro: '',
    nombre: '',
    almacen: '',
    lote: ''
  });
  
  // Estados para conteos físicos
  const [conteosFisicos, setConteosFisicos] = useState({}); // Mapa de conteos por clave única
  const [editandoConteo, setEditandoConteo] = useState(null); // Registro que se está editando
  const [guardandoConteo, setGuardandoConteo] = useState({}); // Mapa de estados de guardado
  const [valorTemporal, setValorTemporal] = useState({}); // Valores temporales durante la edición
  
  // Ref para el container de scroll
  const tableContainerRef = useRef(null);

  // Función para generar clave única de un saldo
  const generarClaveSaldo = (saldo) => {
    return `${saldo.codpro}-${saldo.almacen}-${saldo.lote || 'sin-lote'}-${saldo.vencimiento || 'sin-vencimiento'}`;
  };

  // Función para obtener el valor actual del conteo
  const obtenerValorActual = (saldo) => {
    const clave = generarClaveSaldo(saldo);
    
    // Si hay un valor temporal durante la edición, usarlo
    if (valorTemporal[clave] !== undefined) {
      const valor = parseFloat(valorTemporal[clave]);
      return isNaN(valor) ? 0 : valor;
    }
    
    // Si hay un conteo guardado en el estado local, usarlo
    const conteoActual = conteosFisicos[clave];
    if (conteoActual && conteoActual.Fisico !== undefined) {
      const valor = parseFloat(conteoActual.Fisico);
      return isNaN(valor) ? 0 : valor;
    }
    
    // Si hay un valor en el saldo (que viene del backend), usarlo
    if (saldo.fisico !== null && saldo.fisico !== undefined) {
      const valor = parseFloat(saldo.fisico);
      return isNaN(valor) ? 0 : valor;
    }
    
    // Por defecto, 0
    return 0;
  };



  // Cargar códigos disponibles al montar el componente
  useEffect(() => {
    cargarCodigosDisponibles();
  }, []);

  const cargarCodigosDisponibles = async () => {
    try {
      const response = await axiosClient.get('/saldos/codigos-disponibles');
      const data = response.data;
      
      if (data.success) {
        setCodigosDisponibles(data.data);
      }
    } catch (error) {
      console.error('Error al cargar códigos disponibles:', error);
    }
  };

  // Cargar saldos (TODOS los datos del backend)
  const cargarSaldos = async (resetear = true) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      Object.entries(filtros).forEach(([key, value]) => {
        if (value && value.trim() !== '') {
          params.append(key, value.trim());
        }
      });
      // NO paginación en el backend - cargar todos los datos
      params.append('limit', '10000'); // Límite alto para obtener todos los registros

      const response = await axiosClient.get(`/saldos?${params.toString()}`);
      const data = response.data;
      
      if (data.success) {
        const saldosConConteos = await agregarConteosFisicos(data.data);
        
        if (resetear) {
          setAllSaldos(saldosConConteos);
          // Mostrar solo los primeros 5 registros inicialmente
          setSaldos(saldosConConteos.slice(0, REGISTROS_POR_PAGINA));
          setCurrentPage(1);
        }
        
        setTotalSaldos(data.data.length);
        
        showNotification('success', `${data.data.length} registros cargados`);
      } else {
        showNotification('error', data.error || 'Error al cargar los saldos');
        if (resetear) {
          setAllSaldos([]);
          setSaldos([]);
        }
      }
    } catch (error) {
      console.error('Error al cargar saldos:', error);
      showNotification('error', 'Error de conexión al cargar los saldos');
      if (resetear) {
        setAllSaldos([]);
        setSaldos([]);
      }
    } finally {
      setLoading(false);
    }
  };



  // Agregar información de conteos físicos a los saldos
  const agregarConteosFisicos = async (saldosData) => {
    try {
      // Los datos ya vienen con los conteos físicos desde el backend
      // Solo necesitamos mapear los datos y actualizar el estado de conteos
      const todosLosConteos = {};
      
      const saldosConConteos = saldosData.map(saldo => {
        const clave = generarClaveSaldo(saldo);
        
        // Si hay datos de conteo físico, crear el objeto de conteo
        if (saldo.Fisico !== null && saldo.Fisico !== undefined) {
          const conteoData = {
            CodPro: saldo.codpro,
            Almacen: saldo.almacen,
            Lote: saldo.lote,
            Vencimiento: saldo.vencimiento,
            Fisico: saldo.Fisico,
            SaldoSistema: saldo.saldo,
            Diferencia: saldo.Diferencia,
            TipoDiferencia: saldo.TipoDiferencia
          };
          
          todosLosConteos[clave] = conteoData;
        }
        
        return {
          ...saldo,
          fisico: saldo.Fisico,
          diferencia: saldo.Diferencia,
          tipoDiferencia: saldo.TipoDiferencia,
          tieneConteo: saldo.Fisico !== null && saldo.Fisico !== undefined
        };
      });
      
      // Actualizar estado de conteos físicos
      setConteosFisicos(prev => ({ ...prev, ...todosLosConteos }));
      
      return saldosConConteos;
    } catch (error) {
      console.error('Error al procesar conteos físicos:', error);
      return saldosData.map(saldo => ({
        ...saldo,
        fisico: null,
        diferencia: null,
        tipoDiferencia: null,
        tieneConteo: false
      }));
    }
  };



  // Cerrar modo edición al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (editandoConteo && !event.target.closest('.conteo-editor')) {
        cerrarEdicion(editandoConteo);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [editandoConteo]);

  // Función para filtrar saldos en tiempo real - solo filtrar si hay datos en los inputs
  const hayFiltrosActivos = Object.values(filtroTiempoReal).some(valor => valor.trim() !== '');
  
  // Si hay filtros activos, filtrar en todos los datos y mostrar solo los primeros 5
  const saldosFiltrados = hayFiltrosActivos ? allSaldos.filter(saldo => {
    const cumpleCodpro = !filtroTiempoReal.codpro || 
      String(saldo.codpro || '').toLowerCase().includes(filtroTiempoReal.codpro.toLowerCase());
    
    const cumpleNombre = !filtroTiempoReal.nombre || 
      String(saldo.NombreProducto || '').toLowerCase().includes(filtroTiempoReal.nombre.toLowerCase());
    
    const cumpleAlmacen = !filtroTiempoReal.almacen || 
      String(saldo.almacen || '').toLowerCase().includes(filtroTiempoReal.almacen.toLowerCase());
    
    const cumpleLote = !filtroTiempoReal.lote || 
      String(saldo.lote || '').toLowerCase().includes(filtroTiempoReal.lote.toLowerCase());
    
    return cumpleCodpro && cumpleNombre && cumpleAlmacen && cumpleLote;
  }).slice(0, REGISTROS_POR_PAGINA) : null;

  // Determinar qué datos mostrar
  const saldosAMostrar = hayFiltrosActivos ? saldosFiltrados : saldos;

  const buscarSaldos = async () => {
    setCurrentPage(1);
    await cargarSaldos(true);
  };

  const limpiarFiltros = () => {
    setFiltros({
      codigoProducto: '00'
    });
    setFiltroTiempoReal({
      codpro: '',
      nombre: '',
      almacen: '',
      lote: ''
    });
  };

  const limpiarFiltrosTiempoReal = () => {
    setFiltroTiempoReal({
      codpro: '',
      nombre: '',
      almacen: '',
      lote: ''
    });
  };

  // Funciones para manejar conteos físicos
  const guardarConteoFisico = async (saldo, nuevoFisico) => {
    const clave = generarClaveSaldo(saldo);
    
    try {
      setGuardandoConteo(prev => ({ ...prev, [clave]: true }));
      
      const response = await axiosClient.post('/conteos/guardar', {
        codpro: saldo.codpro,
        lote: saldo.lote || null,
        almacen: saldo.almacen,
        vencimiento: saldo.vencimiento || null,
        fisico: parseFloat(nuevoFisico),
        saldoSistema: parseFloat(saldo.saldo || 0),
        observaciones: `Conteo actualizado desde vista Saldos`
      });

      if (response.data.success) {
        // Crear objeto de conteo con los datos que tenemos
        const conteoData = response.data.data || {
          Fisico: nuevoFisico,
          SaldoSistema: saldo.saldo || 0,
          Diferencia: nuevoFisico - (saldo.saldo || 0),
          TipoDiferencia: nuevoFisico - (saldo.saldo || 0) === 0 ? 'CUADRADO' : 
                         nuevoFisico - (saldo.saldo || 0) > 0 ? 'SOBRANTE' : 'FALTANTE'
        };

        // Actualizar el estado local
        setConteosFisicos(prev => ({
          ...prev,
          [clave]: conteoData
        }));

        // Actualizar los saldos con la nueva información
        const actualizarSaldos = (saldosArray) => 
          saldosArray.map(s => {
            if (generarClaveSaldo(s) === clave) {
              return {
                ...s,
                fisico: conteoData.Fisico,
                diferencia: conteoData.Diferencia,
                tipoDiferencia: conteoData.TipoDiferencia,
                tieneConteo: true
              };
            }
            return s;
          });

        setAllSaldos(actualizarSaldos);
        setSaldos(prev => actualizarSaldos(prev));

        showNotification('success', 'Conteo físico guardado exitosamente');
      }
    } catch (error) {
      console.error('Error al guardar conteo físico:', error);
      showNotification('error', 'Error al guardar el conteo físico');
    } finally {
      setGuardandoConteo(prev => ({ ...prev, [clave]: false }));
    }
  };

  const handleConteoChange = async (saldo, incremento) => {
    const clave = generarClaveSaldo(saldo);
    const fisicoActual = obtenerValorActual(saldo);
    const nuevoFisico = fisicoActual + incremento; // Permitir valores negativos
    
    // Actualizar valor temporal inmediatamente
    setValorTemporal(prev => ({
      ...prev,
      [clave]: nuevoFisico
    }));
    
    // Guardar en la base de datos sin cerrar la edición
    await guardarConteoFisico(saldo, nuevoFisico);
    
    // NO cerrar la edición aquí, mantener el modo de edición activo
  };

  const handleConteoInput = async (saldo, valor) => {
    const clave = generarClaveSaldo(saldo);
    // Convertir valor a número, permitir negativos, usar 0 solo si está vacío
    const nuevoFisico = valor === '' ? 0 : parseFloat(valor) || 0;
    
    // Actualizar valor temporal
    setValorTemporal(prev => ({
      ...prev,
      [clave]: nuevoFisico
    }));
    
    await guardarConteoFisico(saldo, nuevoFisico);
  };

  const cerrarEdicion = (clave) => {
    setEditandoConteo(null);
    // Limpiar valor temporal
    setValorTemporal(prev => {
      const newState = { ...prev };
      delete newState[clave];
      return newState;
    });
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

      const response = await axiosClient.get(`/saldos/export?${params.toString()}`, {
        responseType: 'blob'
      });
      const blob = response.data;
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
      showNotification('error', 'Error de conexión al exportar los saldos');
    } finally {
      setExporting(false);
    }
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

  return (
    <div className="container mx-auto">
      {/* Panel de filtros unificado */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <FunnelIcon className="w-5 h-5 text-gray-600" />
            <h3 className="text-sm font-medium text-gray-700">Filtros de búsqueda</h3>
          </div>
          
          {/* Desktop */}
          <div className="hidden md:block">
            <div className="grid grid-cols-7 gap-3 items-end">
              {/* Código de producto */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Código (2 dígitos)
                </label>
                <select
                  value={filtros.codigoProducto}
                  onChange={(e) => setFiltros({...filtros, codigoProducto: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {codigosDisponibles.map(codigo => (
                    <option key={codigo} value={codigo}>
                      {codigo}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Filtros en tiempo real */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Código</label>
                <input
                  type="text"
                  value={filtroTiempoReal.codpro}
                  onChange={(e) => setFiltroTiempoReal({...filtroTiempoReal, codpro: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Filtrar código..."
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nombre</label>
                <input
                  type="text"
                  value={filtroTiempoReal.nombre}
                  onChange={(e) => setFiltroTiempoReal({...filtroTiempoReal, nombre: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Filtrar nombre..."
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Almacén</label>
                <input
                  type="text"
                  value={filtroTiempoReal.almacen}
                  onChange={(e) => setFiltroTiempoReal({...filtroTiempoReal, almacen: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Filtrar almacén..."
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Lote</label>
                <div className="relative">
                  <input
                    type="text"
                    value={filtroTiempoReal.lote}
                    onChange={(e) => setFiltroTiempoReal({...filtroTiempoReal, lote: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-2 py-1.5 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Filtrar lote..."
                  />
                  {hayFiltrosActivos && (
                    <button
                      onClick={limpiarFiltrosTiempoReal}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      title="Limpiar filtros"
                    >
                      <XMarkIcon className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
              
              {/* Botones */}
              <div className="flex gap-2">
                <button
                  onClick={buscarSaldos}
                  disabled={loading}
                  className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
                >
                  <MagnifyingGlassIcon className="w-4 h-4" />
                  {loading ? 'Buscando...' : 'Buscar'}
                </button>
                
                <button
                  onClick={limpiarFiltros}
                  className="flex items-center gap-1 bg-gray-600 text-white px-3 py-1.5 rounded-md hover:bg-gray-700 text-sm"
                >
                  <XMarkIcon className="w-4 h-4" />
                  Limpiar
                </button>
              </div>
              
              {/* Botón Excel */}
              <div>
                <button
                  onClick={exportarExcel}
                  disabled={exporting || allSaldos.length === 0}
                  className="flex items-center gap-1 bg-green-600 text-white px-3 py-1.5 rounded-md hover:bg-green-700 disabled:opacity-50 text-sm w-full justify-center"
                >
                  {exporting ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                      Exportando...
                    </>
                  ) : (
                    <>
                      <ArrowDownTrayIcon className="w-4 h-4" />
                      Excel
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Mobile */}
          <div className="md:hidden">
            {/* Código de producto */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Código (2 dígitos)
              </label>
              <select
                value={filtros.codigoProducto}
                onChange={(e) => setFiltros({...filtros, codigoProducto: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {codigosDisponibles.map(codigo => (
                  <option key={codigo} value={codigo}>
                    {codigo}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Filtros en tiempo real en 2 columnas */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Código</label>
                <input
                  type="text"
                  value={filtroTiempoReal.codpro}
                  onChange={(e) => setFiltroTiempoReal({...filtroTiempoReal, codpro: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Filtrar código..."
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nombre</label>
                <input
                  type="text"
                  value={filtroTiempoReal.nombre}
                  onChange={(e) => setFiltroTiempoReal({...filtroTiempoReal, nombre: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Filtrar nombre..."
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Almacén</label>
                <input
                  type="text"
                  value={filtroTiempoReal.almacen}
                  onChange={(e) => setFiltroTiempoReal({...filtroTiempoReal, almacen: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Filtrar almacén..."
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Lote</label>
                <div className="relative">
                  <input
                    type="text"
                    value={filtroTiempoReal.lote}
                    onChange={(e) => setFiltroTiempoReal({...filtroTiempoReal, lote: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-2 py-1.5 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Filtrar lote..."
                  />
                  {hayFiltrosActivos && (
                    <button
                      onClick={limpiarFiltrosTiempoReal}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      title="Limpiar filtros"
                    >
                      <XMarkIcon className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            {/* Botones en la parte inferior */}
            <div className="flex gap-2 justify-center">
              <button
                onClick={buscarSaldos}
                disabled={loading}
                className="flex items-center gap-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
              >
                <MagnifyingGlassIcon className="w-4 h-4" />
                {loading ? 'Buscando...' : 'Buscar'}
              </button>
              
              <button
                onClick={limpiarFiltros}
                className="flex items-center gap-1 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 text-sm"
              >
                <XMarkIcon className="w-4 h-4" />
                Limpiar
              </button>
              
              <button
                onClick={exportarExcel}
                disabled={exporting || allSaldos.length === 0}
                className="flex items-center gap-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 text-sm"
              >
                {exporting ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                    Exportando...
                  </>
                ) : (
                  <>
                    <ArrowDownTrayIcon className="w-4 h-4" />
                    Excel
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Panel de acciones */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Saldos</h2>
            <p className="text-sm text-gray-600">
              Mostrando {saldosAMostrar.length} de {totalSaldos} resultados
              {hayFiltrosActivos && (
                <span className="text-green-600"> • Filtro activo: {saldosFiltrados.length} coincidencias de {totalSaldos}</span>
              )}
            </p>
          </div>
        </div>
        
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Cargando saldos...</p>
          </div>
        ) : allSaldos.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <ArchiveBoxIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">No hay datos cargados</p>
            <p className="text-sm">Selecciona un código de producto y haz clic en "Buscar" para cargar los saldos</p>
          </div>
        ) : saldosAMostrar.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>No se encontraron registros que coincidan con los filtros aplicados</p>
          </div>
        ) : (
          <>
            {/* Vista desktop */}
            <div 
              ref={tableContainerRef}
              className="hidden md:block overflow-x-auto max-h-[calc(100vh-300px)]"
            >
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      CodPro
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nombre
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Almacén
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Lote
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vencimiento
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Saldo
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Físico
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Diferencia
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {saldosAMostrar.map((saldo, index) => {
                    const clave = generarClaveSaldo(saldo);
                    const conteo = conteosFisicos[clave];
                    const guardando = guardandoConteo[clave];
                    const editando = editandoConteo === clave;
                    
                    return (
                      <tr key={`${clave}-${index}`} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm font-mono text-gray-900 font-medium">
                          {saldo.codpro}
                        </span>
                      </td>
                        <td className="px-4 py-3">
                        <div className="text-sm text-gray-900 max-w-xs truncate" title={saldo.NombreProducto}>
                          {saldo.NombreProducto || 'Sin nombre'}
                        </div>
                      </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {saldo.almacen || '-'}
                      </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {saldo.lote || '-'}
                      </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {formatearFecha(saldo.vencimiento)}
                      </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        <span className="font-medium">{formatearNumero(saldo.saldo)}</span>
                      </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <div className="flex items-center space-x-1">
                            {editando ? (
                              <div className="flex items-center space-x-1 bg-gray-50 rounded-md p-1 conteo-editor">
                                <button
                                  onMouseDown={(e) => {
                                    e.preventDefault(); // Prevenir que se dispare el blur del input
                                    handleConteoChange(saldo, -1);
                                  }}
                                  disabled={guardando}
                                  className="text-red-600 hover:text-red-800 p-1 rounded disabled:opacity-50"
                                  title="Decrementar"
                                >
                                  <MinusIcon className="w-4 h-4" />
                                </button>
                                
                                <input
                                  type="number"
                                  value={obtenerValorActual(saldo)}
                                  onChange={(e) => {
                                    const clave = generarClaveSaldo(saldo);
                                    const valor = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0;
                                    setValorTemporal(prev => ({
                                      ...prev,
                                      [clave]: valor
                                    }));
                                  }}
                                  onBlur={(e) => {
                                    // Solo cerrar si no se está interactuando con los botones
                                    setTimeout(() => {
                                      if (document.activeElement?.closest('.conteo-editor')) {
                                        return; // No cerrar si el foco está en el editor
                                      }
                                      handleConteoInput(saldo, e.target.value);
                                      cerrarEdicion(generarClaveSaldo(saldo));
                                    }, 100);
                                  }}
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                      handleConteoInput(saldo, e.target.value);
                                      cerrarEdicion(generarClaveSaldo(saldo));
                                    }
                                  }}
                                  disabled={guardando}
                                  className="w-16 text-center text-sm border border-gray-300 rounded px-1 py-0.5 disabled:opacity-50"
                                  step="0.01"
                                  autoFocus
                                />
                                
                                <button
                                  onMouseDown={(e) => {
                                    e.preventDefault(); // Prevenir que se dispare el blur del input
                                    handleConteoChange(saldo, 1);
                                  }}
                                  disabled={guardando}
                                  className="text-green-600 hover:text-green-800 p-1 rounded disabled:opacity-50"
                                  title="Incrementar"
                                >
                                  <PlusIcon className="w-4 h-4" />
                                </button>
                                
                                <button
                                  onClick={() => {
                                    const clave = generarClaveSaldo(saldo);
                                    handleConteoInput(saldo, obtenerValorActual(saldo));
                                    cerrarEdicion(clave);
                                  }}
                                  disabled={guardando}
                                  className="text-gray-500 hover:text-gray-700 p-1 rounded disabled:opacity-50"
                                  title="Cerrar edición"
                                >
                                  <XMarkIcon className="w-4 h-4" />
                                </button>
                                
                                {guardando && (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                )}
                              </div>
                            ) : (
                              <div className="flex items-center space-x-2">
                                {saldo.fisico !== null ? (
                                  <>
                                    <span className="font-medium text-blue-600">
                                      {formatearNumero(saldo.fisico)}
                                    </span>
                                    <button
                                      onClick={() => {
                                        setEditandoConteo(clave);
                                        setValorTemporal(prev => ({
                                          ...prev,
                                          [clave]: obtenerValorActual(saldo)
                                        }));
                                      }}
                                      className="text-gray-500 hover:text-gray-700 hover:bg-gray-50 p-1 rounded transition-colors"
                                      title="Editar conteo físico"
                                    >
                                      <PencilSquareIcon className="w-4 h-4" />
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setEditandoConteo(clave);
                                      setValorTemporal(prev => ({
                                        ...prev,
                                        [clave]: obtenerValorActual(saldo)
                                      }));
                                    }}
                                    className="text-green-600 hover:text-green-800 hover:bg-green-50 p-1 rounded transition-colors"
                                    title="Agregar conteo físico"
                                  >
                                    <PencilSquareIcon className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          {saldo.diferencia !== null ? (
                            <span className={`font-medium ${
                              saldo.diferencia > 0 ? 'text-green-600' : 
                              saldo.diferencia < 0 ? 'text-red-600' : 'text-gray-600'
                            }`}>
                              {saldo.diferencia > 0 ? '+' : ''}{formatearNumero(saldo.diferencia)}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
              
              {/* Mensaje cuando hay resultados */}
              {allSaldos.length > 0 && (
                <div className="flex justify-center items-center py-4">
                  <span className="text-sm text-gray-500">
                    ✓ Se han cargado {allSaldos.length} resultados
                  </span>
                </div>
              )}
            </div>

            {/* Vista móvil */}
            <div className="md:hidden max-h-[calc(100vh-300px)] overflow-y-auto">
              {saldosAMostrar.map((saldo, index) => {
                const clave = generarClaveSaldo(saldo);
                const conteo = conteosFisicos[clave];
                const guardando = guardandoConteo[clave];
                const editando = editandoConteo === clave;
                
                return (
                  <div key={`${clave}-${index}`} className="border-b border-gray-200 p-4">
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
                          Saldo: {formatearNumero(saldo.saldo)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatearFecha(saldo.vencimiento)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-2">
                    <div className="text-sm text-gray-900">{saldo.NombreProducto || 'Sin nombre'}</div>
                  </div>
                  
                    {/* Información de conteo físico */}
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-xs text-gray-600">
                        Físico: {saldo.fisico !== null ? formatearNumero(saldo.fisico) : '-'} | 
                        Diferencia: {saldo.diferencia !== null ? 
                          <span className={saldo.diferencia > 0 ? 'text-green-600' : saldo.diferencia < 0 ? 'text-red-600' : 'text-gray-600'}>
                            {saldo.diferencia > 0 ? '+' : ''}{formatearNumero(saldo.diferencia)}
                          </span> : '-'
                        }
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {saldo.fisico !== null ? (
                          <>
                            <span className="font-medium text-blue-600">
                              {formatearNumero(saldo.fisico)}
                            </span>
                            <button
                              onClick={() => {
                                setEditandoConteo(clave);
                                setValorTemporal(prev => ({
                                  ...prev,
                                  [clave]: obtenerValorActual(saldo)
                                }));
                              }}
                              className="text-gray-500 hover:text-gray-700 hover:bg-gray-50 p-1 rounded transition-colors"
                              title="Editar conteo físico"
                            >
                              <PencilSquareIcon className="w-5 h-5" />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => {
                              setEditandoConteo(clave);
                              setValorTemporal(prev => ({
                                ...prev,
                                [clave]: obtenerValorActual(saldo)
                              }));
                            }}
                            className="text-green-600 hover:text-green-800 hover:bg-green-50 p-1 rounded transition-colors"
                            title="Agregar conteo físico"
                          >
                            <PencilSquareIcon className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {editando && (
                      <div className="flex items-center justify-center space-x-2 bg-gray-50 rounded-md p-2 conteo-editor">
                        <button
                          onMouseDown={(e) => {
                            e.preventDefault(); // Prevenir que se dispare el blur del input
                            handleConteoChange(saldo, -1);
                          }}
                          disabled={guardando}
                          className="text-red-600 hover:text-red-800 p-2 rounded disabled:opacity-50"
                          title="Decrementar"
                        >
                          <MinusIcon className="w-5 h-5" />
                        </button>
                        
                        <input
                          type="number"
                          value={obtenerValorActual(saldo)}
                          onChange={(e) => {
                            const clave = generarClaveSaldo(saldo);
                            const valor = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0;
                            setValorTemporal(prev => ({
                              ...prev,
                              [clave]: valor
                            }));
                          }}
                          onBlur={(e) => {
                            // Solo cerrar si no se está interactuando con los botones
                            setTimeout(() => {
                              if (document.activeElement?.closest('.conteo-editor')) {
                                return; // No cerrar si el foco está en el editor
                              }
                              handleConteoInput(saldo, e.target.value);
                              cerrarEdicion(generarClaveSaldo(saldo));
                            }, 100);
                          }}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleConteoInput(saldo, e.target.value);
                              cerrarEdicion(generarClaveSaldo(saldo));
                            }
                          }}
                          disabled={guardando}
                          className="w-20 text-center border border-gray-300 rounded px-2 py-1 disabled:opacity-50"
                          step="0.01"
                          autoFocus
                        />
                        
                        <button
                          onMouseDown={(e) => {
                            e.preventDefault(); // Prevenir que se dispare el blur del input
                            handleConteoChange(saldo, 1);
                          }}
                          disabled={guardando}
                          className="text-green-600 hover:text-green-800 p-2 rounded disabled:opacity-50"
                          title="Incrementar"
                        >
                          <PlusIcon className="w-5 h-5" />
                        </button>
                        
                        <button
                          onClick={() => {
                            const clave = generarClaveSaldo(saldo);
                            handleConteoInput(saldo, obtenerValorActual(saldo));
                            cerrarEdicion(clave);
                          }}
                          disabled={guardando}
                          className="text-gray-500 hover:text-gray-700 p-2 rounded disabled:opacity-50"
                          title="Cerrar edición"
                        >
                          <XMarkIcon className="w-5 h-5" />
                        </button>
                        
                        {guardando && (
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Saldos; 