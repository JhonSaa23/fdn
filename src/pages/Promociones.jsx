import React, { useState, useEffect } from 'react';
import { useNotification } from '../App';
import { consultarPromociones, crearPromocion, actualizarPromocion, eliminarPromocion, importarPromocionesExcel, obtenerTipificacionesPromociones, eliminarPromocionesEnMasa, obtenerTodosLosProductos } from '../services/api';
import { 
  ArrowLeftIcon,
  PencilIcon, 
  TrashIcon,
  PlusIcon,
  FunnelIcon,
  XMarkIcon,
  DocumentArrowUpIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import Card from '../components/Card';
import Button from '../components/Button';

// Las tipificaciones se cargarán dinámicamente de la base de datos

// Función auxiliar para manejar strings de manera segura
const safeString = (value) => {
  return value ? String(value).trim() : '';
}

const Promociones = () => {
  const { showNotification } = useNotification();
  const [promociones, setPromociones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingPromocion, setEditingPromocion] = useState(null);
  
  // Estados para el modal de importación
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [importing, setImporting] = useState(false);
  
  // Estados para eliminación en masa
  const [showDeleteMassModal, setShowDeleteMassModal] = useState(false);
  const [selectedTipificaciones, setSelectedTipificaciones] = useState([]);
  const [deleteMassLoading, setDeleteMassLoading] = useState(false);
  
  // Estado para tipificaciones dinámicas
  const [tipificaciones, setTipificaciones] = useState([]);
  const [tipificacionesMap, setTipificacionesMap] = useState({});

  // Estados para filtros
  const [filtros, setFiltros] = useState({
    tipificacion: '',
    codpro: '',
    desde: '',
    porcentaje: ''
  });

  // Estados para el formulario
  const [formData, setFormData] = useState({
    tipificacion: '',
    codpro: '',
    desde: '',
    porcentaje: ''
  });

  // Estados para el filtro de nombre de producto
  const [filtroNombreProducto, setFiltroNombreProducto] = useState('');

  // Estado para rastrear el filtro usado en la última consulta
  const [ultimaConsultaTipificacion, setUltimaConsultaTipificacion] = useState('');

  // Estados para el autocompletado de productos
  const [busquedaProducto, setBusquedaProducto] = useState('');
  const [todosLosProductos, setTodosLosProductos] = useState([]);
  const [productosFiltrados, setProductosFiltrados] = useState([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [cargandoProductos, setCargandoProductos] = useState(false);

  // Cargar tipificaciones desde la base de datos
  const cargarTipificaciones = async () => {
    try {
      const data = await obtenerTipificacionesPromociones();
      setTipificaciones(data);
      
      // Crear un mapa para búsqueda rápida
      const map = {};
      data.forEach(tip => {
        map[tip.tipificacion.toString()] = tip.descripcion;
      });
      setTipificacionesMap(map);
    } catch (error) {
      console.error('Error al cargar tipificaciones:', error);
      showNotification('error', 'Error al cargar las tipificaciones');
    }
  };

  // Cargar promociones
  const cargarPromociones = async () => {
    try {
      setLoading(true);
      console.log('Enviando filtros a la API:', filtros);
      const data = await consultarPromociones(filtros);
      setPromociones(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error al cargar promociones:', error);
      let mensaje = 'Error al cargar las promociones';
      if (error.response) {
        mensaje = error.response.data?.error || mensaje;
      }
      showNotification('error', mensaje);
      setPromociones([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    console.log(`Cambiando filtro ${name} a:`, value);
    setFiltros(prev => {
      const newFiltros = {
        ...prev,
        [name]: value
      };
      console.log('Nuevos filtros:', newFiltros);
      return newFiltros;
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'codpro' && showForm) {
      setBusquedaProducto(value);
      setMostrarSugerencias(true);
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleConsultar = React.useCallback(() => {
    // Debug: Verificar los valores actuales de filtros
    console.log('Filtros antes de consultar:', filtros);
    
    // Capturar el filtro de tipificacion usado en esta consulta
    setUltimaConsultaTipificacion(filtros.tipificacion);
    cargarPromociones();
  }, [filtros]); // Incluir filtros como dependencia para que se actualice

  useEffect(() => {
    // Capturar la tipificacion inicial (vacía) y cargar datos al montar
    setUltimaConsultaTipificacion('');
    
    // Cargar tipificaciones y promociones
    cargarTipificaciones();
    cargarPromociones();
  }, []); // Solo ejecutar una vez al montar

  // Efecto para manejar la tecla Enter - ejecutar consulta
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Solo ejecutar si estamos en la vista y no hay modal abierto
      if (e.key === 'Enter' && !showForm) {
        e.preventDefault(); // Evita comportamiento por defecto (como abrir select)
        e.stopPropagation(); // Evita que el evento se propague
        handleConsultar();
      }
    };

    // Agregar listener al documento
    document.addEventListener('keydown', handleKeyDown);

    // Cleanup al desmontar
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showForm, handleConsultar]); // Incluir handleConsultar como dependencia

  const handleLimpiar = () => {
    setFiltros({
      tipificacion: '',
      codpro: '',
      desde: '',
      porcentaje: ''
    });
    setUltimaConsultaTipificacion('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!formData.tipificacion || !formData.codpro || !formData.desde || !formData.porcentaje) {
        showNotification('error', 'Todos los campos son obligatorios');
        return;
      }
      const desde = parseFloat(formData.desde);
      const porcentaje = parseFloat(formData.porcentaje);
      if (isNaN(desde) || isNaN(porcentaje)) {
        showNotification('error', 'Los campos "desde" y "porcentaje" deben ser números válidos');
        return;
      }
      
      // Asegurar que sean strings antes de hacer trim
      const tipificacionStr = String(formData.tipificacion || '').trim();
      const codproStr = String(formData.codpro || '').trim();
      
      if (editingPromocion) {
        console.log('Actualizando promoción:', {
          tipificacionOld: editingPromocion.tipificacion,
          codproOld: editingPromocion.codpro,
          desdeOld: editingPromocion.desde,
          porcentajeOld: editingPromocion.porcentaje,
          tipificacionNew: tipificacionStr,
          codproNew: codproStr,
          desdeNew: desde,
          porcentajeNew: porcentaje
        });
        
        await actualizarPromocion({
          tipificacionOld: editingPromocion.tipificacion,
          codproOld: editingPromocion.codpro,
          desdeOld: editingPromocion.desde,
          porcentajeOld: editingPromocion.porcentaje,
          tipificacionNew: tipificacionStr,
          codproNew: codproStr,
          desdeNew: desde,
          porcentajeNew: porcentaje
        });
      } else {
        await crearPromocion({
          tipificacion: tipificacionStr,
          codpro: codproStr,
          desde,
          porcentaje
                  });
      }
      setShowForm(false);
      setEditingPromocion(null);
      setFormData({ tipificacion: '', codpro: '', desde: '', porcentaje: '' });
      cargarPromociones();
    } catch (error) {
      console.error('Error completo:', error);
      console.error('Error response:', error.response);
      
      let mensaje = 'Error al guardar la promoción';
      if (error.response) {
        const { status, data } = error.response;
        console.error('Status:', status, 'Data:', data);
        if (status === 409) {
          mensaje = data.details || 'Ya existe una promoción con estos valores';
        } else if (data && data.error) {
          mensaje = data.error;
          if (data.details) mensaje += `: ${data.details}`;
        }
      }
      showNotification('error', mensaje);
    }
  };

  const handleEdit = (promocion) => {
    setEditingPromocion(promocion);
    setFormData({
      tipificacion: promocion.tipificacion || '',
      codpro: promocion.codpro || '',
      desde: promocion.desde?.toString() || '',
      porcentaje: promocion.porcentaje?.toString() || ''
    });
    setBusquedaProducto(promocion.codpro || '');
    cargarTodosLosProductos();
    setShowForm(true);
  };

  const handleDelete = async (promocion) => {
    if (window.confirm('¿Está seguro de eliminar esta promoción?')) {
      try {
        await eliminarPromocion({
          tipificacion: safeString(promocion.tipificacion),
          codpro: safeString(promocion.codpro),
          desde: promocion.desde,
          porcentaje: promocion.porcentaje
        });
        cargarPromociones();
      } catch (error) {
        console.error('Error al eliminar la promoción:', error);
        let mensaje = 'Error al eliminar la promoción';
        if (error.response) {
          mensaje = error.response.data.error || mensaje;
        }
        showNotification('error', mensaje);
      }
    }
  };

  // Funciones para manejar la importación
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);
  };

  const handleImportSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      showNotification('error', 'Debe seleccionar un archivo');
      return;
    }

    setImporting(true);
    try {
      const result = await importarPromocionesExcel(selectedFile);
      
      if (result.error) {
        showNotification('error', result.error);
      } else {
        showNotification('success', `Importación completada. Insertados: ${result.resumen.insertados}, Duplicados: ${result.resumen.duplicados}`);
        setShowImportModal(false);
        setSelectedFile(null);
        cargarPromociones(); // Recargar los datos
      }
    } catch (error) {
      console.error('Error en importación:', error);
      showNotification('error', 'Error al procesar el archivo');
    } finally {
      setImporting(false);
    }
  };

  // Manejar selección de tipificaciones para eliminación en masa
  const handleTipificacionToggle = (tipificacion) => {
    setSelectedTipificaciones(prev => {
      if (prev.includes(tipificacion)) {
        return prev.filter(t => t !== tipificacion);
      } else {
        return [...prev, tipificacion];
      }
    });
  };

  // Manejar eliminación en masa
  const handleDeleteMass = async () => {
    if (selectedTipificaciones.length === 0) {
      showNotification('error', 'Debe seleccionar al menos una tipificación');
      return;
    }

    const tipificacionesTexto = selectedTipificaciones
      .map(t => `${t} (${tipificacionesMap[t] || 'Desconocida'})`)
      .join(', ');

    const confirmacion = window.confirm(
      `¿Está seguro de eliminar TODAS las promociones con las siguientes tipificaciones?\n\n${tipificacionesTexto}\n\n⚠️ Esta acción NO se puede deshacer y eliminará los registros de ambas tablas.`
    );

    if (!confirmacion) return;

    try {
      setDeleteMassLoading(true);
      
      const response = await eliminarPromocionesEnMasa(selectedTipificaciones);
      
      // Mostrar resumen de la eliminación
      const { resumen } = response;
      let mensaje = `Eliminación en masa completada:\n`;
      mensaje += `• ${resumen.registrosEliminadosTemporal} registros eliminados de tabla temporal\n`;
      mensaje += `• ${resumen.registrosEliminadosPrincipal} registros eliminados de tabla principal\n`;
      mensaje += `• Total: ${resumen.totalRegistrosEliminados} registros eliminados`;
      
      showNotification('success', mensaje);
      
      // Cerrar modal y recargar datos
      setShowDeleteMassModal(false);
      setSelectedTipificaciones([]);
      cargarPromociones();
      
    } catch (error) {
      console.error('Error en eliminación en masa:', error);
      let mensaje = 'Error al eliminar promociones en masa';
      if (error.response?.data?.details) {
        mensaje += `: ${error.response.data.details}`;
      }
      showNotification('error', mensaje);
    } finally {
      setDeleteMassLoading(false);
    }
  };

  // Filtrar promociones en tiempo real por nombre de producto
  const promocionesFiltradas = Array.isArray(promociones)
    ? (filtroNombreProducto
        ? promociones.filter(e => (e.nombreProducto || '').toLowerCase().includes(filtroNombreProducto.toLowerCase()))
        : promociones)
    : [];

  // Función para cargar todos los productos
  const cargarTodosLosProductos = async () => {
    try {
      setCargandoProductos(true);
      const productos = await obtenerTodosLosProductos();
      setTodosLosProductos(productos);
      
      if (productos.length === 0) {
        showNotification('warning', 'No se encontraron productos en la base de datos');
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
      
      showNotification('error', mensaje);
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

  // Efecto para filtrar productos cuando cambia la búsqueda
  useEffect(() => {
    filtrarProductos(busquedaProducto);
  }, [busquedaProducto]);

  const handleSeleccionarProducto = (producto) => {
    setFormData(prev => ({
      ...prev,
      codpro: producto.codpro
    }));
    setBusquedaProducto(producto.codpro);
    setMostrarSugerencias(false);
  };

  // Efecto para cerrar las sugerencias al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      const sugerenciasElement = document.querySelector('.sugerencias-productos');
      const inputElement = document.querySelector('.input-producto');
      
      if (sugerenciasElement && inputElement) {
        if (!sugerenciasElement.contains(event.target) && !inputElement.contains(event.target)) {
          setMostrarSugerencias(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Modificar la función que abre el modal para cargar los productos
  const handleAgregarClick = () => {
    setShowForm(true);
    setEditingPromocion(null);
    setFormData({ tipificacion: '', codpro: '', desde: '', porcentaje: '' });
    setBusquedaProducto('');
    cargarTodosLosProductos();
  };

  return (
    <>
      {/* Bloque principal: Título, botones y filtros juntos en un solo Card */}
      <Card className="mb-6">
        <Card.Body>
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-xl font-bold">Consulta</h1>
            <div className="flex space-x-3">
              <Button
                type="button"
                variant="secondary"
                onClick={handleLimpiar}
              >
                Limpiar
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={handleConsultar}
                disabled={loading}
              >
                {loading ? 'Consultando...' : 'Consultar'}
              </Button>
              <Button
                style={{ display: 'flex', backgroundColor: '#007bff', color: 'white' }}
                type="button"
                variant="info"
                onClick={() => setShowImportModal(true)}
              >
                Importar
              </Button>
              <Button
                style={{ display: 'flex', backgroundColor: '#dc2626', color: 'white' }}
                type="button"
                variant="danger"
                onClick={() => setShowDeleteMassModal(true)}
              >
                <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
                EliMasa
              </Button>
              <Button
                onClick={handleAgregarClick}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Agregar
              </Button>
            </div>
          </div>
          <form className="space-y-4">
            <div className="grid grid-cols-5 md:grid-cols-5 lg:grid-cols-5 gap-x-4 gap-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Negocio
                </label>
                <select
                  name="tipificacion"
                  value={filtros.tipificacion}
                  onChange={handleFilterChange}
                  className="block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                >
                  <option value="">Todos</option>
                  {tipificaciones.map(tip => (
                    <option key={tip.tipificacion} value={tip.tipificacion}>
                      {tip.tipificacion} - {tip.descripcion}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CodPro
                </label>
                <input
                  type="text"
                  name="codpro"
                  value={filtros.codpro}
                  onChange={handleFilterChange}
                  className="block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  placeholder="Ej: 000-000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Desde
                </label>
                <input
                  type="number"
                  name="desde"
                  value={filtros.desde}
                  onChange={handleFilterChange}
                  className="block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  step="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Porcentaje
                </label>
                <input
                  type="number"
                  name="porcentaje"
                  value={filtros.porcentaje}
                  onChange={handleFilterChange}
                  className="block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  step="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre
                </label>
                <input
                  type="text"
                  value={filtroNombreProducto}
                  onChange={e => setFiltroNombreProducto(e.target.value)}
                  className="block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  placeholder="Escriba el nombre del producto..."
                />
              </div>
            </div>
          </form>
        </Card.Body>
      </Card>

      {/* Tabla en un Card aparte */}
      <Card>
        <div className="overflow-x-auto max-h-[calc(100vh-240px)]">
          <div className="min-w-full inline-block align-middle">
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipi</th>
                    <th className="pr-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CodPro</th>
                    <th className="pr-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre del Producto</th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Desde</th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Por%</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider sticky right-0 bg-gray-50 z-20 shadow-[-2px_0_4px_rgba(0,0,0,0.1)]">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-4 text-center">
                        Cargando...
                      </td>
                    </tr>
                  ) : promocionesFiltradas.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-4 text-center">
                        No hay datos disponibles
                      </td>
                    </tr>
                  ) : (
                    promocionesFiltradas.map((promocion, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          {promocion.tipificacion}
                        </td>
                        <td className="py-4 whitespace-nowrap">
                          {promocion.codpro}
                        </td>
                        <td className="py-4">
                          <div className="flex flex-col">
                            <span className="font-medium">{promocion.nombreProducto || ''}</span>
                            {/* Solo mostrar tipo de negocio en segunda línea si no hay filtro específico en la última consulta */}
                            {(!ultimaConsultaTipificacion || ultimaConsultaTipificacion === '') && (
                              <span className="text-sm text-gray-600 italic">
                                {tipificacionesMap[promocion.tipificacion] || 'Desconocida'}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="text-center py-4 whitespace-nowrap">
                          {promocion.desde}
                        </td>
                        <td className="text-center py-4 whitespace-nowrap">
                          {promocion.porcentaje}%
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap sticky right-0 bg-white z-20 shadow-[-2px_0_4px_rgba(0,0,0,0.1)]">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => handleEdit(promocion)}
                              className="text-sky-600 hover:text-sky-800 hover:bg-sky-50 p-1 rounded transition-colors"
                              title="Editar"
                            >
                              <PencilIcon className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDelete(promocion)}
                              className="text-red-600 hover:text-red-800 hover:bg-red-50 p-1 rounded transition-colors"
                              title="Eliminar"
                            >
                              <TrashIcon className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Card>

      {/* Formulario Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md relative">
            <button
              onClick={() => {
                setShowForm(false);
                setEditingPromocion(null);
                setFormData({ tipificacion: '', codpro: '', desde: '', porcentaje: '' });
                setBusquedaProducto('');
                setMostrarSugerencias(false);
              }}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
            
            <h2 className="text-xl font-bold mb-4">
              {editingPromocion ? 'Editar Promoción' : 'Nueva Promoción'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Negocio
                </label>
                <select
                  name="tipificacion"
                  value={formData.tipificacion}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccione un tipo</option>
                  {tipificaciones.map(tip => (
                    <option key={tip.tipificacion} value={tip.tipificacion}>
                      {tip.descripcion}
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código de Producto
                </label>
                <input
                  type="text"
                  name="codpro"
                  value={busquedaProducto}
                  onChange={handleInputChange}
                  onFocus={() => {
                    setMostrarSugerencias(true);
                    if (todosLosProductos.length === 0) {
                      cargarTodosLosProductos();
                    }
                  }}
                  autoComplete="off"
                  placeholder="Buscar por código o nombre..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 input-producto"
                />
                
                {/* Lista de sugerencias */}
                {mostrarSugerencias && (busquedaProducto || cargandoProductos) && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto sugerencias-productos">
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
                          className="p-2 hover:bg-gray-100 cursor-pointer"
                        >
                          <div className="font-medium">{producto.codpro}</div>
                          <div className="text-sm text-gray-600">{producto.nombre}</div>
                          <div className="text-xs text-gray-500">{producto.laboratorio}</div>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Desde
                </label>
                <input
                  type="number"
                  name="desde"
                  value={formData.desde}
                  onChange={handleInputChange}
                  placeholder="Cantidad mínima"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Porcentaje
                </label>
                <input
                  type="number"
                  name="porcentaje"
                  value={formData.porcentaje}
                  onChange={handleInputChange}
                  placeholder="Porcentaje de descuento"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingPromocion(null);
                    setFormData({ tipificacion: '', codpro: '', desde: '', porcentaje: '' });
                    setBusquedaProducto('');
                    setMostrarSugerencias(false);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  {editingPromocion ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Importación Excel */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Importar Promociones desde Excel</h2>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setSelectedFile(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">Formato requerido del Excel:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• <strong>Tipificacion</strong>: Número del negocio (1-10)</li>
                <li>• <strong>Codpro</strong>: Código del producto</li>
                <li>• <strong>Desde</strong>: Cantidad mínima (número)</li>
                <li>• <strong>Porcentaje</strong>: Descuento (número)</li>
              </ul>
            </div>

            <form onSubmit={handleImportSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Archivo Excel (.xls, .xlsx)
                </label>
                <input
                  type="file"
                  accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  onChange={handleFileSelect}
                  className="w-full p-2 border rounded-md"
                  required
                />
                {selectedFile && (
                  <p className="text-sm text-gray-600 mt-2">
                    Archivo seleccionado: {selectedFile.name}
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowImportModal(false);
                    setSelectedFile(null);
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  disabled={importing}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  disabled={importing || !selectedFile}
                >
                  {importing ? 'Importando...' : 'Importar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Eliminación en Masa */}
      {showDeleteMassModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-red-600 flex items-center">
                <ExclamationTriangleIcon className="w-6 h-6 mr-2" />
                Eliminar Masa
              </h2>
              <button
                onClick={() => {
                  setShowDeleteMassModal(false);
                  setSelectedTipificaciones([]);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Advertencia */}
              <div className="bg-red-50 p-4 rounded-md border border-red-200">
                <div className="flex">
                  <ExclamationTriangleIcon className="w-5 h-5 text-red-400 mr-2 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-red-800">
                      ⚠️ Acción irreversible
                    </h3>
                    <p className="text-xs text-red-700 mt-1">
                      Esta acción eliminará TODAS las promociones de las tipificaciones seleccionadas
                      de ambas tablas (t_Descuento_laboratorio y Descuento_laboratorio). 
                      <strong> No se puede deshacer.</strong>
                    </p>
                  </div>
                </div>
              </div>

              {/* Selección de tipificaciones */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Seleccione las tipificaciones a eliminar:
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto border rounded-lg p-3">
                  {tipificaciones.map(tip => (
                    <label key={tip.tipificacion} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
                      <input
                        type="checkbox"
                        checked={selectedTipificaciones.includes(tip.tipificacion.toString())}
                        onChange={() => handleTipificacionToggle(tip.tipificacion.toString())}
                        className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                      />
                      <span className="text-sm">
                        <strong>{tip.tipificacion}</strong> - {tip.descripcion}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Resumen de selección */}
              {selectedTipificaciones.length > 0 && (
                <div className="bg-yellow-50 p-3 rounded-md border border-yellow-200">
                  <h4 className="text-sm font-medium text-yellow-800 mb-2">
                    Tipificaciones seleccionadas para eliminación:
                  </h4>
                  <ul className="text-xs text-yellow-700 space-y-1">
                    {selectedTipificaciones.map(tip => (
                      <li key={tip}>
                        • <strong>{tip}</strong> - {tipificacionesMap[tip] || 'Desconocida'}
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-yellow-700 mt-2 font-medium">
                    Se eliminarán TODAS las promociones con estas tipificaciones.
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteMassModal(false);
                  setSelectedTipificaciones([]);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                disabled={deleteMassLoading}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteMass}
                disabled={deleteMassLoading || selectedTipificaciones.length === 0}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
              >
                {deleteMassLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Eliminando...
                  </>
                ) : (
                  <>
                    <ExclamationTriangleIcon className="w-4 h-4 mr-2" />
                    Eliminar {selectedTipificaciones.length > 0 ? `(${selectedTipificaciones.length})` : ''}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Promociones; 