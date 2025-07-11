import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNotification } from '../App';
import { 
  listarGuias, 
  editarGuiaIndividual, 
  editarGuiasRango, 
  editarGuiasSeleccion,
  buscarGuiaEspecifica
} from '../services/api';
import Button from '../components/Button';
import ResponsiveTableContainer from '../components/ResponsiveTableContainer';
import Modal from '../components/Modal';
import { PencilIcon, CalendarIcon, DocumentIcon, ClockIcon } from '@heroicons/react/24/outline';

const Guias = () => {
  const { showNotification } = useNotification();
  const [guias, setGuias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedGuias, setSelectedGuias] = useState([]);
  const [modoEdicion, setModoEdicion] = useState('individual'); // individual, rango, seleccion
  const [showModal, setShowModal] = useState(false);
  
  // Estados para paginación y windowing (copiado de clientes)
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalGuias, setTotalGuias] = useState(0);
  
  // Estados para windowing (ventana deslizante)
  const [allGuias, setAllGuias] = useState([]); // Todos los datos cargados
  const [visibleStartPage, setVisibleStartPage] = useState(1);
  const [visibleEndPage, setVisibleEndPage] = useState(3);
  const [lastScrollTop, setLastScrollTop] = useState(0);
  const [scrollDirection, setScrollDirection] = useState('down');
  
  // Configuración de windowing
  const WINDOW_SIZE = 3; // Mantener 3 páginas visibles (120 registros)
  
  // Estados para filtros
  const [filtros, setFiltros] = useState({
    tipo: '',
    numero: '',
    fechaDesde: '',
    fechaHasta: ''
  });
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  
  // Estados para edición
  const [formData, setFormData] = useState({
    numero: '',
  });
  
  // Estados para búsqueda de guía específica
  const [guiaEncontrada, setGuiaEncontrada] = useState(null);
  const [facturaRelacionada, setFacturaRelacionada] = useState(null);
  const [buscandoGuia, setBuscandoGuia] = useState(false);

  // Estados para edición de fechas
  const [fechaGuia, setFechaGuia] = useState('');
  const [fechaFactura, setFechaFactura] = useState('');
  const [editGuia, setEditGuia] = useState(false);
  const [editFactura, setEditFactura] = useState(false);
  const [loadingGuia, setLoadingGuia] = useState(false);
  const [loadingFactura, setLoadingFactura] = useState(false);
  const [loadingAmbas, setLoadingAmbas] = useState(false);

  // Ref para el container de scroll
  const tableContainerRef = useRef(null);

  // Estados para edición por rango y selección
  const [formRango, setFormRango] = useState({ numeroInicio: '', numeroFin: '', fecha: '' });
  const [loadingRango, setLoadingRango] = useState(false);
  const [formSeleccion, setFormSeleccion] = useState({ fecha: '' });
  const [loadingSeleccion, setLoadingSeleccion] = useState(false);

  // Calcular guías visibles basado en la ventana actual (copiado de clientes)
  const calcularGuiasVisibles = useCallback(() => {
    const startIndex = (visibleStartPage - 1) * 40;
    const endIndex = visibleEndPage * 40;
    return allGuias.slice(startIndex, endIndex);
  }, [allGuias, visibleStartPage, visibleEndPage]);

  // Actualizar guías visibles cuando cambie la ventana
  useEffect(() => {
    setGuias(calcularGuiasVisibles());
  }, [calcularGuiasVisibles]);

  // Cargar guías (primera página o nueva búsqueda) - copiado de clientes
  const cargarGuias = async (resetear = true) => {
    try {
      setLoading(true);
      console.log('Enviando filtros a la API:', filtros);
      const response = await listarGuias(filtros, 1, 40);
      
      if (resetear) {
        setAllGuias(response.data);
        setGuias(response.data);
        setCurrentPage(1);
        setVisibleStartPage(1);
        setVisibleEndPage(Math.min(WINDOW_SIZE, Math.ceil(response.pagination.total / 40)));
      }
      
      setHasMore(response.pagination.hasMore);
      setTotalGuias(response.pagination.total);
    } catch (error) {
      console.error('Error al cargar guías:', error);
      let mensaje = 'Error al cargar las guías';
      if (error.response) {
        mensaje = error.response.data?.error || mensaje;
      }
      showNotification('error', mensaje);
      if (resetear) {
        setAllGuias([]);
        setGuias([]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Cargar más guías (paginación infinita) - copiado de clientes
  const cargarMasGuias = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    
    try {
      setLoadingMore(true);
      const nextPage = currentPage + 1;
      console.log('Cargando página:', nextPage);
      
      const response = await listarGuias(filtros, nextPage, 40);
      
      // Agregar a allGuias en lugar de guias directamente
      setAllGuias(prev => [...prev, ...response.data]);
      setCurrentPage(nextPage);
      setHasMore(response.pagination.hasMore);
      
      // Expandir ventana si es necesario
      if (nextPage <= visibleEndPage + 1) {
        setVisibleEndPage(Math.min(nextPage, Math.ceil(totalGuias / 40)));
      }
    } catch (error) {
      console.error('Error al cargar más guías:', error);
      showNotification('error', 'Error al cargar más guías');
    } finally {
      setLoadingMore(false);
    }
  }, [filtros, currentPage, hasMore, loadingMore, visibleEndPage, totalGuias]);

  // Detectar scroll para carga infinita y windowing - copiado de clientes
  const handleScroll = useCallback(() => {
    const container = tableContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    
    // Detectar dirección del scroll
    const direction = scrollTop > lastScrollTop ? 'down' : 'up';
    setScrollDirection(direction);
    setLastScrollTop(scrollTop);

    // Calcular posición relativa (0-1)
    const scrollPercentage = scrollHeight > clientHeight ? scrollTop / (scrollHeight - clientHeight) : 0;
    
    // Estimar en qué "página" estamos basado en el scroll
    const totalPages = Math.ceil(totalGuias / 40);
    const estimatedPage = Math.max(1, Math.ceil(scrollPercentage * totalPages));

    // === WINDOWING LOGIC ===
    
    // Si estamos cerca del inicio (primera página), resetear ventana al inicio
    if (scrollPercentage < 0.1 && direction === 'up') {
      const newStartPage = 1;
      const newEndPage = Math.min(WINDOW_SIZE, totalPages);
      
      if (newStartPage !== visibleStartPage || newEndPage !== visibleEndPage) {
        console.log('📍 Reseteando ventana al inicio:', newStartPage, '-', newEndPage);
        setVisibleStartPage(newStartPage);
        setVisibleEndPage(newEndPage);
      }
    }
    // Si scrolleamos hacia abajo y necesitamos expandir/mover la ventana
    else if (direction === 'down') {
      const isNearBottom = scrollTop + clientHeight >= scrollHeight - 50;
      
      // Si estamos cerca del final de los datos visibles, cargar más
      if (isNearBottom && hasMore && !loadingMore && !loading) {
        cargarMasGuias();
      }
      
      // Si scrolleamos más allá de la ventana actual, moverla hacia abajo
      if (estimatedPage > visibleEndPage && estimatedPage <= currentPage) {
        const newStartPage = Math.max(1, estimatedPage - WINDOW_SIZE + 1);
        const newEndPage = Math.min(estimatedPage, currentPage);
        
        if (newStartPage !== visibleStartPage || newEndPage !== visibleEndPage) {
          console.log('📍 Moviendo ventana hacia abajo:', newStartPage, '-', newEndPage);
          setVisibleStartPage(newStartPage);
          setVisibleEndPage(newEndPage);
        }
      }
    }
    // Si scrolleamos hacia arriba y necesitamos mover la ventana
    else if (direction === 'up' && scrollPercentage > 0.1) {
      if (estimatedPage < visibleStartPage) {
        const newStartPage = Math.max(1, estimatedPage);
        const newEndPage = Math.min(newStartPage + WINDOW_SIZE - 1, currentPage);
        
        if (newStartPage !== visibleStartPage || newEndPage !== visibleEndPage) {
          console.log('📍 Moviendo ventana hacia arriba:', newStartPage, '-', newEndPage);
          setVisibleStartPage(newStartPage);
          setVisibleEndPage(newEndPage);
        }
      }
    }

  }, [hasMore, loadingMore, loading, cargarMasGuias, lastScrollTop, totalGuias, visibleStartPage, visibleEndPage, currentPage]);

  // No cargar datos al montar el componente - esperar a que el usuario haga clic en buscar
  useEffect(() => {
    setCurrentPage(1);
    setHasMore(true);
    setVisibleStartPage(1);
    setVisibleEndPage(WINDOW_SIZE);
    setLastScrollTop(0);
    setScrollDirection('down');
    
    // No cargar datos automáticamente
    setAllGuias([]);
    setGuias([]);
  }, []);

  // Agregar event listener para scroll - copiado de clientes
  useEffect(() => {
    const container = tableContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  // No resetear automáticamente cuando cambien los filtros - esperar a que el usuario haga clic en buscar

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFiltros(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Si cambia el tipo de filtro, limpiar los datos mostrados
    if (name === 'tipo') {
      setAllGuias([]);
      setGuias([]);
      setTotalGuias(0);
      setHasMore(true);
      setCurrentPage(1);
      setVisibleStartPage(1);
      setVisibleEndPage(WINDOW_SIZE);
      setLastScrollTop(0);
      setScrollDirection('down');
    }
  };

  const handleConsultar = () => {
    setCurrentPage(1);
    setHasMore(true);
    setVisibleStartPage(1);
    setVisibleEndPage(WINDOW_SIZE);
    setLastScrollTop(0);
    setScrollDirection('down');
    cargarGuias(true);
    setFiltersExpanded(false); // Cerrar filtros en móvil
  };

  const handleLimpiarFiltros = () => {
    setFiltros({
      tipo: '',
      numero: '',
      fechaDesde: '',
      fechaHasta: ''
    });
    setAllGuias([]);
    setGuias([]);
    setTotalGuias(0);
    setCurrentPage(1);
    setHasMore(true);
    setVisibleStartPage(1);
    setVisibleEndPage(WINDOW_SIZE);
    setLastScrollTop(0);
    setScrollDirection('down');
  };

  const handleRowSelect = (guia, isSelected) => {
    if (isSelected) {
      setSelectedGuias(prev => [...prev, guia]);
    } else {
      setSelectedGuias(prev => prev.filter(g => 
        g.Numero !== guia.Numero || g.Tipo !== guia.Tipo
      ));
    }
  };

  const handleSelectAll = () => {
    if (selectedGuias.length === guias.length) {
      setSelectedGuias([]);
    } else {
      setSelectedGuias([...guias]);
    }
  };

  const handleEditarIndividual = async () => {
    try {
      if (!formData.numero || !formData.fecha) {
        showNotification('error', 'Complete el número y la fecha');
        return;
      }

      // Determinar qué número usar según el tipo de edición
      let numeroAEditar = formData.numero.trim();
      
      if (formData.tipo === 'FACTURA' && facturaRelacionada) {
        // Si vamos a editar la factura, usar el número de la factura
        numeroAEditar = facturaRelacionada.Numero;
      } else if (formData.tipo === 'GUIA' && guiaEncontrada) {
        // Si vamos a editar la guía, usar el número de la guía
        numeroAEditar = guiaEncontrada.Numero;
      }

      setLoading(true);
      const response = await editarGuiaIndividual({
        numero: numeroAEditar,
        tipo: formData.tipo,
        fecha: formData.fecha,
        campo: formData.campo
      });

      if (response.success) {
        showNotification('success', response.message);
        setShowModal(false);
        setCurrentPage(1);
        setHasMore(true);
        setVisibleStartPage(1);
        setVisibleEndPage(WINDOW_SIZE);
        setLastScrollTop(0);
        setScrollDirection('down');
        cargarGuias(true);
        limpiarFormulario();
        setGuiaEncontrada(null);
        setFacturaRelacionada(null);
      } else {
        showNotification('error', response.error || 'Error al editar');
      }
    } catch (error) {
      console.error('Error al editar guía individual:', error);
      showNotification('error', 'Error al editar la guía');
    } finally {
      setLoading(false);
    }
  };

  const limpiarFormulario = () => {
    setFormData({ numero: '' });
    setGuiaEncontrada(null);
    setFacturaRelacionada(null);
    setFechaGuia('');
    setFechaFactura('');
    setEditGuia(false);
    setEditFactura(false);
  };

  const limpiarFormularioRango = () => {
    setFormRango({ numeroInicio: '', numeroFin: '', fecha: '' });
  };
  const limpiarFormularioSeleccion = () => {
    setFormSeleccion({ fecha: '' });
  };

  const abrirModal = (modo) => {
    limpiarFormulario();
    limpiarFormularioRango();
    limpiarFormularioSeleccion();
    setModoEdicion(modo);
    setShowModal(true);
  };

  const handleEditarRango = async () => {
    if (!formRango.numeroInicio.trim() || !formRango.numeroFin.trim() || !formRango.fecha) {
      showNotification('error', 'Complete todos los campos');
      return;
    }
    setLoadingRango(true);
    try {
      const response = await editarGuiasRango({
        numeroInicio: formRango.numeroInicio.trim(),
        numeroFin: formRango.numeroFin.trim(),
        tipo: filtros.tipo,
        fecha: formRango.fecha,
        campo: 'fecha',
      });
      if (response.success) {
        showNotification('success', response.message);
        setShowModal(false);
        limpiarFormularioRango();
        cargarGuias(true);
      } else {
        showNotification('error', response.error || 'Error al editar rango');
      }
    } catch (error) {
      showNotification('error', 'Error al editar el rango');
    } finally {
      setLoadingRango(false);
    }
  };

  const handleEditarSeleccion = async () => {
    if (selectedGuias.length === 0 || !formSeleccion.fecha) {
      showNotification('error', 'Seleccione guías/facturas y complete la fecha');
      return;
    }
    setLoadingSeleccion(true);
    try {
      const numeros = selectedGuias.map(guia => ({ numero: guia.Numero, tipo: filtros.tipo }));
      const response = await editarGuiasSeleccion({
        numeros,
        fecha: formSeleccion.fecha,
        campo: 'fecha',
      });
      if (response.success) {
        showNotification('success', response.message);
        setShowModal(false);
        limpiarFormularioSeleccion();
        setSelectedGuias([]);
        cargarGuias(true);
      } else {
        showNotification('error', response.error || 'Error al editar selección');
      }
    } catch (error) {
      showNotification('error', 'Error al editar la selección');
    } finally {
      setLoadingSeleccion(false);
    }
  };

  const buscarGuiaEspecificaHandler = async () => {
    if (!formData.numero.trim()) {
      showNotification('error', 'Ingrese un número de guía');
      return;
    }
    try {
      setBuscandoGuia(true);
      const response = await buscarGuiaEspecifica(formData.numero.trim());
      if (response.success) {
        setGuiaEncontrada(response.data.guia);
        setFacturaRelacionada(response.data.factura);
        setFechaGuia(response.data.guia?.FechaTransporte ? response.data.guia.FechaTransporte.slice(0, 10) : '');
        setFechaFactura(response.data.factura?.FechaEmision ? response.data.factura.FechaEmision.slice(0, 10) : '');
        setEditGuia(false);
        setEditFactura(false);
        showNotification('success', 'Guía encontrada');
      } else {
        setGuiaEncontrada(null);
        setFacturaRelacionada(null);
        setFechaGuia('');
        setFechaFactura('');
        setEditGuia(false);
        setEditFactura(false);
        showNotification('error', response.error || 'No se encontró la guía');
      }
    } catch (error) {
      setGuiaEncontrada(null);
      setFacturaRelacionada(null);
      setFechaGuia('');
      setFechaFactura('');
      setEditGuia(false);
      setEditFactura(false);
      showNotification('error', 'Error al buscar la guía');
    } finally {
      setBuscandoGuia(false);
    }
  };

  const handleActualizarGuia = async () => {
    if (!guiaEncontrada || !fechaGuia) return;
    setLoadingGuia(true);
    try {
      const response = await editarGuiaIndividual({
        numero: guiaEncontrada.Numero,
        tipo: 'GUIA',
        fecha: fechaGuia,
        campo: 'fecha',
      });
      if (response.success) {
        showNotification('success', 'Fecha de la guía actualizada');
        setEditGuia(false);
      } else {
        showNotification('error', response.error || 'Error al actualizar fecha de la guía');
      }
    } catch (error) {
      showNotification('error', 'Error al actualizar fecha de la guía');
    } finally {
      setLoadingGuia(false);
    }
  };

  const handleActualizarFactura = async () => {
    if (!facturaRelacionada || !fechaFactura) return;
    setLoadingFactura(true);
    try {
      const response = await editarGuiaIndividual({
        numero: facturaRelacionada.Numero,
        tipo: 'FACTURA',
        fecha: fechaFactura,
        campo: 'fecha',
      });
      if (response.success) {
        showNotification('success', 'Fecha de la factura actualizada');
        setEditFactura(false);
      } else {
        showNotification('error', response.error || 'Error al actualizar fecha de la factura');
      }
    } catch (error) {
      showNotification('error', 'Error al actualizar fecha de la factura');
    } finally {
      setLoadingFactura(false);
    }
  };

  const handleActualizarAmbas = async () => {
    if (!guiaEncontrada || !facturaRelacionada || !fechaGuia || !fechaFactura) return;
    setLoadingAmbas(true);
    try {
      const [resGuia, resFactura] = await Promise.all([
        editarGuiaIndividual({
          numero: guiaEncontrada.Numero,
          tipo: 'GUIA',
          fecha: fechaGuia,
          campo: 'fecha',
        }),
        editarGuiaIndividual({
          numero: facturaRelacionada.Numero,
          tipo: 'FACTURA',
          fecha: fechaFactura,
          campo: 'fecha',
        })
      ]);
      if (resGuia.success && resFactura.success) {
        showNotification('success', 'Ambas fechas actualizadas');
        setEditGuia(false);
        setEditFactura(false);
        setShowModal(false);
      } else {
        showNotification('error', 'Error al actualizar ambas fechas');
      }
    } catch (error) {
      showNotification('error', 'Error al actualizar ambas fechas');
    } finally {
      setLoadingAmbas(false);
    }
  };

  const formatFecha = (fecha) => {
    if (!fecha) return '';
    try {
      const date = new Date(fecha);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch (error) {
      return fecha;
    }
  };

  // En el render, definir columnas dinámicamente según el tipo seleccionado
  const columnasGuia = [
    { key: 'Numero', label: 'Número' },
    { key: 'Docventa', label: 'Doc Venta' },
    { key: 'TipoDoc', label: 'Tipo' },
    { key: 'Fecha', label: 'Fecha' },
    { key: 'Empresa', label: 'Empresa' },
    { key: 'Ruc', label: 'RUC' },
    { key: 'Placa', label: 'Placa' },
    { key: 'PtoLLegada', label: 'Pto Llegada' },
    { key: 'Destino', label: 'Destino' },
    { key: 'Eliminado', label: 'Eliminado' },
    { key: 'Impreso', label: 'Impreso' },
    { key: 'Peso', label: 'Peso' },
  ];
  const columnasFactura = [
    { key: 'Numero', label: 'Número' },
    { key: 'Tipo', label: 'Tipo' },
    { key: 'CodClie', label: 'CodClie' },
    { key: 'Fecha', label: 'Fecha' },
    { key: 'Dias', label: 'Días' },
    { key: 'FechaV', label: 'Fecha V.' },
    { key: 'Bruto', label: 'Bruto' },
    { key: 'Descuento', label: 'Descuento' },
    { key: 'Flete', label: 'Flete' },
    { key: 'Subtotal', label: 'Subtotal' },
    { key: 'Igv', label: 'IGV' },
    { key: 'Total', label: 'Total' },
    { key: 'Moneda', label: 'Moneda' },
    { key: 'Cambio', label: 'Cambio' },
    { key: 'Vendedor', label: 'Vendedor' },
    { key: 'Transporte', label: 'Transporte' },
    { key: 'Eliminado', label: 'Eliminado' },
    { key: 'Impreso', label: 'Impreso' },
    { key: 'NroPedido', label: 'Nro Pedido' },
    { key: 'NroGuia', label: 'Nro Guía' },
  ];
  const columnas = filtros.tipo === 'GUIA' ? columnasGuia : filtros.tipo === 'FACTURA' ? columnasFactura : [];

  return (
    <div className="space-y-6">
      {/* Header y Filtros Fusionados */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4">
          {/* Header con título y botones de acción */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <DocumentIcon className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Gestión de Guías</h1>
              </div>
            </div>
            
            {/* Botones de acción */}
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => abrirModal('individual')}
                className="text-xs bg-blue-600 hover:bg-blue-700 text-white flex items-center"
              >
                <PencilIcon className="h-3 w-3 mr-2" />
                Editar
              </Button>
              
              <Button
                onClick={() => abrirModal('rango')}
                className="text-xs bg-green-600 hover:bg-green-700 text-white flex items-center"
              >
                <ClockIcon className="h-3 w-3 mr-2" />
                Rango          
              </Button>
              
              <Button
                onClick={() => abrirModal('seleccion')}
                disabled={selectedGuias.length === 0}
                className="text-xs bg-purple-600 hover:bg-purple-700 text-white flex items-center disabled:opacity-50"
              >
                <CalendarIcon className="h-3 w-3 mr-2" />
                Selección ({selectedGuias.length})
              </Button>

              <Button
                onClick={() => cargarGuias(true)}
                variant="secondary"
                loading={loading}
                className="text-xs bg-gray-600 hover:bg-gray-700 text-white flex items-center"
              >
                Actualizar
              </Button>
            </div>
          </div>

          {/* Filtros */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Filtros de Búsqueda</h3>
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleConsultar}
                  loading={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
                >
                  Buscar
                </Button>
                <Button
                  onClick={handleLimpiarFiltros}
                  variant="outline"
                  className="text-xs"
                >
                  Limpiar Filtros
                </Button>
                <Button
                  onClick={() => setFiltersExpanded(!filtersExpanded)}
                  variant="outline"
                  size="sm"
                  className="md:hidden text-xs"
                >
                  {filtersExpanded ? 'Ocultar' : 'Mostrar'} Filtros
                </Button>
              </div>
            </div>

            <div className={`space-y-4 ${filtersExpanded ? 'block' : 'hidden md:block'}`}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <select
                    name="tipo"
                    value={filtros.tipo}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="">Tipo de Documento</option>
                    <option value="GUIA">Guías</option>
                    <option value="FACTURA">Facturas</option>
                  </select>
                </div>

                <div>
                  <input
                    type="text"
                    name="numero"
                    value={filtros.numero}
                    onChange={handleFilterChange}
                    placeholder="Número (Ej: T001-025424)"
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>

                <div>
                  <input
                    type="date"
                    name="fechaDesde"
                    value={filtros.fechaDesde}
                    onChange={handleFilterChange}
                    placeholder="Fecha Desde"
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>

                <div>
                  <input
                    type="date"
                    name="fechaHasta"
                    value={filtros.fechaHasta}
                    onChange={handleFilterChange}
                    placeholder="Fecha Hasta"
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de guías */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-2 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 justify-between w-full">
              {selectedGuias.length > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-600">
                    {selectedGuias.length} seleccionados
                  </span>
                  <Button
                    onClick={() => setSelectedGuias([])}
                    variant="outline"
                    size="xs"
                    className="text-xs"
                  >
                    Limpiar selección
                  </Button>
                </div>
              )}
              <div className="text-right flex items-center gap-2">
                <p className="text-xs text-gray-500">Total de registros</p>
                <p className="text-xs font-bold text-blue-600">{totalGuias}</p>
              </div>
            </div>
          </div>
        </div>

        {filtros.tipo && (filtros.tipo === 'GUIA' || filtros.tipo === 'FACTURA') && guias.length > 0 && (
          <div ref={tableContainerRef} className="overflow-x-auto max-h-[calc(100vh-28  0px)]">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={guias.length > 0 && selectedGuias.length === guias.length}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300"
                    />
                  </th>
                  {columnas.map(col => (
                    <th key={col.key} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{col.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={columnas.length + 1} className="px-6 py-4 text-center">Cargando...</td>
                  </tr>
                ) : guias.length === 0 ? (
                  <tr>
                    <td colSpan={columnas.length + 1} className="px-6 py-4 text-center">No hay datos disponibles</td>
                  </tr>
                ) : (
                  guias.map((guia, index) => (
                    <tr key={guia.Numero + '-' + index} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedGuias.some(g => g.Numero === guia.Numero && (g.Tipo || g.TipoDoc || g.Tipo === filtros.tipo))}
                          onChange={(e) => handleRowSelect(guia, e.target.checked)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      {columnas.map(col => (
                        <td key={col.key} className="px-4 py-4 whitespace-nowrap text-sm">
                          {guia[col.key] !== undefined && guia[col.key] !== null ? guia[col.key] : '-'}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de edición */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); limpiarFormulario(); }}
        title="Editar Guía y Factura"
        size="lg"
      >
        <div className="space-y-4">
          {/* Input para buscar la guía */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Número de Guía
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                name="numero"
                value={formData.numero}
                onChange={e => setFormData({ numero: e.target.value })}
                placeholder="Ej: T001-025424"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Button
                onClick={buscarGuiaEspecificaHandler}
                loading={buscandoGuia}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Buscar
              </Button>
            </div>
          </div>

          {/* Si se encontró la guía, mostrar los campos de fecha */}
          {guiaEncontrada && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Card de la Guía */}
              <div className="bg-blue-50 p-4 rounded-md border border-blue-200 flex flex-col gap-2">
                <span className="font-medium text-blue-900 mb-2 text-lg">Datos de la Guía</span>
                <div className="grid grid-cols-1 gap-1 text-sm mb-2">
                  <div><b>Número:</b> {guiaEncontrada.Numero}</div>
                  <div><b>Docventa:</b> {guiaEncontrada.Docventa}</div>
                  <div><b>Empresa:</b> {guiaEncontrada.Empresa}</div>
                  <div><b>Destino:</b> {guiaEncontrada.Destino}</div>
                  <div><b>Peso:</b> {guiaEncontrada.Peso}</div>
                  <div><b>Fecha de Transporte:</b> {guiaEncontrada.FechaTransporte ? formatFecha(guiaEncontrada.FechaTransporte) : '-'}</div>
                </div>
                <span className="font-medium text-blue-900 mb-1">Editar Fecha de Transporte</span>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={fechaGuia}
                    onChange={e => {
                      setFechaGuia(e.target.value);
                      setEditGuia(e.target.value !== (guiaEncontrada.FechaTransporte ? guiaEncontrada.FechaTransporte.slice(0, 10) : ''));
                    }}
                    className="px-3 py-2 border-2 border-blue-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                  />
                  <button
                    onClick={handleActualizarGuia}
                    disabled={!editGuia || loadingGuia}
                    className={`p-2 rounded-full ${editGuia ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                    title="Actualizar solo fecha de la guía"
                  >
                    {loadingGuia ? (
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                    )}
                  </button>
                </div>
              </div>
              {/* Card de la Factura */}
              {facturaRelacionada && (
                <div className="bg-green-50 p-4 rounded-md border border-green-200 flex flex-col gap-2">
                  <span className="font-medium text-green-900 mb-2 text-lg">Datos de la Factura</span>
                  <div className="grid grid-cols-1 gap-1 text-sm mb-2">
                    <div><b>Número:</b> {facturaRelacionada.Numero}</div>
                    <div><b>Cliente:</b> {facturaRelacionada.CodClie}</div>
                    <div><b>Total:</b> {facturaRelacionada.Total}</div>
                    <div><b>Moneda:</b> {facturaRelacionada.Moneda}</div>
                    <div><b>Vendedor:</b> {facturaRelacionada.Vendedor}</div>
                    <div><b>Transporte:</b> {facturaRelacionada.Transporte}</div>
                    <div><b>Fecha de Emisión:</b> {facturaRelacionada.FechaEmision ? formatFecha(facturaRelacionada.FechaEmision) : '-'}</div>
                  </div>
                  <span className="font-medium text-green-900 mb-1">Editar Fecha de Emisión</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={fechaFactura}
                      onChange={e => {
                        setFechaFactura(e.target.value);
                        setEditFactura(e.target.value !== (facturaRelacionada.FechaEmision ? facturaRelacionada.FechaEmision.slice(0, 10) : ''));
                      }}
                      className="px-3 py-2 border-2 border-green-400 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 font-semibold"
                    />
                    <button
                      onClick={handleActualizarFactura}
                      disabled={!editFactura || loadingFactura}
                      className={`p-2 rounded-full ${editFactura ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                      title="Actualizar solo fecha de la factura"
                    >
                      {loadingFactura ? (
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /></svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Botón para actualizar ambas fechas */}
          {guiaEncontrada && facturaRelacionada && (
            <div className="flex justify-end pt-4">
              <Button
                onClick={handleActualizarAmbas}
                loading={loadingAmbas}
                disabled={!(editGuia && editFactura) || loadingAmbas}
                className="bg-purple-600 hover:bg-purple-700 text-white disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Actualizar Ambas Fechas
              </Button>
            </div>
          )}
        </div>
      </Modal>

      {/* Modal de edición por rango */}
      {modoEdicion === 'rango' && (
        <Modal
          isOpen={showModal}
          onClose={() => { setShowModal(false); limpiarFormularioRango(); }}
          title={`Editar por Rango (${filtros.tipo === 'GUIA' ? 'Guías' : 'Facturas'})`}
          size="md"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Número Inicial</label>
              <input
                type="text"
                value={formRango.numeroInicio}
                onChange={e => setFormRango(f => ({ ...f, numeroInicio: e.target.value }))}
                placeholder="Ej: T001-024920"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Número Final</label>
              <input
                type="text"
                value={formRango.numeroFin}
                onChange={e => setFormRango(f => ({ ...f, numeroFin: e.target.value }))}
                placeholder="Ej: T001-024930"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nueva Fecha</label>
              <input
                type="date"
                value={formRango.fecha}
                onChange={e => setFormRango(f => ({ ...f, fecha: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex justify-end pt-4">
              <Button
                onClick={handleEditarRango}
                loading={loadingRango}
                disabled={
                  !formRango.numeroInicio.trim() ||
                  !formRango.numeroFin.trim() ||
                  !formRango.fecha ||
                  loadingRango
                }
                className="bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Actualizar Rango
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal de edición por selección */}
      {modoEdicion === 'seleccion' && (
        <Modal
          isOpen={showModal}
          onClose={() => { setShowModal(false); limpiarFormularioSeleccion(); }}
          title={`Editar Selección (${filtros.tipo === 'GUIA' ? 'Guías' : 'Facturas'})`}
          size="md"
        >
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-md">
              <span className="font-medium text-gray-700">Seleccionados:</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedGuias.map((g, i) => (
                  <span key={g.Numero + '-' + i} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                    {g.Numero}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nueva Fecha</label>
              <input
                type="date"
                value={formSeleccion.fecha}
                onChange={e => setFormSeleccion({ fecha: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex justify-end pt-4">
              <Button
                onClick={handleEditarSeleccion}
                loading={loadingSeleccion}
                disabled={selectedGuias.length === 0 || !formSeleccion.fecha || loadingSeleccion}
                className="bg-purple-600 hover:bg-purple-700 text-white disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Actualizar Selección
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Guias; 