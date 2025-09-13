import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNotification } from '../App';
import { consultarClientes, crearCliente, actualizarCliente, eliminarCliente, importarClientesExcel, eliminarClientesEnMasa, obtenerTipificacionesClientes, obtenerLaboratoriosClientes, agregarTipificacion, obtenerTipificacionesExistentes, actualizarTipificacion } from '../services/api';
import axiosClient from '../services/axiosClient';
import { 
  PencilIcon, 
  TrashIcon,
  XMarkIcon,
  DocumentArrowUpIcon,
  ExclamationTriangleIcon,
  EllipsisVerticalIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import Card from '../components/Card';
import Button from '../components/Button';

// Las tipificaciones y laboratorios se cargarán dinámicamente de la base de datos

// Función auxiliar para manejar strings de manera segura
const safeString = (value) => {
  return value ? String(value).trim() : '';
}

const Clientes = () => {
  const { showNotification } = useNotification();
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingCliente, setEditingCliente] = useState(null);
  
  // Estados para importación de Excel
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [selectedLab, setSelectedLab] = useState('');
  const [importLoading, setImportLoading] = useState(false);
  
  // Estados para eliminación en masa
  const [showDeleteMassModal, setShowDeleteMassModal] = useState(false);
  const [selectedTipificaciones, setSelectedTipificaciones] = useState([]);
  const [deleteMassLoading, setDeleteMassLoading] = useState(false);
  
  // Estado para el dropdown de acciones
  const [showActionsDropdown, setShowActionsDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  
  // Estados para agregar tipificación
  const [showTipificacionModal, setShowTipificacionModal] = useState(false);
  const [tipificacionForm, setTipificacionForm] = useState({
    tipificacion: '',
    codlab: '',
    descripcion: ''
  });
  const [tipificacionLoading, setTipificacionLoading] = useState(false);
  const [siguienteNumero, setSiguienteNumero] = useState(null);
  
  // Estados para select de búsqueda de laboratorios
  const [laboratoriosDisponibles, setLaboratoriosDisponibles] = useState([]);
  const [busquedaLaboratorio, setBusquedaLaboratorio] = useState('');
  const [mostrarLaboratorios, setMostrarLaboratorios] = useState(false);
  
  // Estados para editar tipificación
  const [showEditarTipificacionModal, setShowEditarTipificacionModal] = useState(false);
  const [tipificacionesExistentes, setTipificacionesExistentes] = useState([]);
  const [tipificacionSeleccionada, setTipificacionSeleccionada] = useState(null);
  const [editarTipificacionForm, setEditarTipificacionForm] = useState({
    descripcion: ''
  });
  const [editarTipificacionLoading, setEditarTipificacionLoading] = useState(false);
  
  // Estado para tipificaciones dinámicas
  const [tipificaciones, setTipificaciones] = useState([]);
  const [tipificacionesMap, setTipificacionesMap] = useState({});
  
  // Estado para laboratorios dinámicos
  const [laboratorios, setLaboratorios] = useState([]);
  const [laboratoriosMap, setLaboratoriosMap] = useState({});

  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalClientes, setTotalClientes] = useState(0);
  
  // Estados para windowing (ventana deslizante)
  const [allClientes, setAllClientes] = useState([]); // Todos los datos cargados
  const [visibleStartPage, setVisibleStartPage] = useState(1);
  const [visibleEndPage, setVisibleEndPage] = useState(3);
  const [lastScrollTop, setLastScrollTop] = useState(0);
  const [scrollDirection, setScrollDirection] = useState('down');
  
  // Configuración de windowing
  const WINDOW_SIZE = 3; // Mantener 3 páginas visibles (120 registros)

  // Estados para filtros
  const [filtros, setFiltros] = useState({
    codlab: '',
    tipificacion: '',
    activo: ''
  });

  // Estados para el formulario
  const [formData, setFormData] = useState({
    codlab: '',
    cliente: '',
    tipificacion: ''
  });

  // Estados para el filtro de cliente
  const [filtroCliente, setFiltroCliente] = useState('');

  // Ref para el container de scroll
  const tableContainerRef = useRef(null);
  
  // Ref para el dropdown de acciones
  const actionsDropdownRef = useRef(null);

  // Calcular clientes visibles basado en la ventana actual
  const calcularClientesVisibles = useCallback(() => {
    const startIndex = (visibleStartPage - 1) * 40;
    const endIndex = visibleEndPage * 40;
    return allClientes.slice(startIndex, endIndex);
  }, [allClientes, visibleStartPage, visibleEndPage]);

  // Actualizar clientes visibles cuando cambie la ventana
  useEffect(() => {
    setClientes(calcularClientesVisibles());
  }, [calcularClientesVisibles]);

  // Cargar tipificaciones desde la base de datos
  const cargarTipificaciones = async () => {
    try {
      const data = await obtenerTipificacionesClientes();
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

  // Cargar laboratorios desde la base de datos
  const cargarLaboratorios = async () => {
    try {
      const data = await obtenerLaboratoriosClientes();
      setLaboratorios(data);
      
      // Crear un mapa para búsqueda rápida
      const map = {};
      data.forEach(lab => {
        map[lab.codlab] = lab.descripcion;
      });
      setLaboratoriosMap(map);
    } catch (error) {
      console.error('Error al cargar laboratorios:', error);
      showNotification('error', 'Error al cargar los laboratorios');
    }
  };

  // Cargar clientes (primera página o nueva búsqueda)
  const cargarClientes = async (resetear = true) => {
    try {
      setLoading(true);
      const response = await consultarClientes(filtros, 1, 40);
      
      if (resetear) {
        setAllClientes(response.data);
        setClientes(response.data);
        setCurrentPage(1);
        setVisibleStartPage(1);
        setVisibleEndPage(Math.min(WINDOW_SIZE, Math.ceil(response.pagination.total / 40)));
      }
      
      setHasMore(response.pagination.hasMore);
      setTotalClientes(response.pagination.total);
    } catch (error) {
      console.error('Error al cargar clientes:', error);
      let mensaje = 'Error al cargar los clientes';
      if (error.response) {
        mensaje = error.response.data?.error || mensaje;
      }
      showNotification('error', mensaje);
      if (resetear) {
        setAllClientes([]);
        setClientes([]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Cargar más clientes (paginación infinita)
  const cargarMasClientes = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    
    try {
      setLoadingMore(true);
      const nextPage = currentPage + 1;
      
      const response = await consultarClientes(filtros, nextPage, 40);
      
      // Agregar a allClientes en lugar de clientes directamente
      setAllClientes(prev => [...prev, ...response.data]);
      setCurrentPage(nextPage);
      setHasMore(response.pagination.hasMore);
      
      // Expandir ventana si es necesario
      if (nextPage <= visibleEndPage + 1) {
        setVisibleEndPage(Math.min(nextPage, Math.ceil(totalClientes / 40)));
      }
    } catch (error) {
      console.error('Error al cargar más clientes:', error);
      showNotification('error', 'Error al cargar más clientes');
    } finally {
      setLoadingMore(false);
    }
  }, [filtros, currentPage, hasMore, loadingMore, visibleEndPage, totalClientes]);

  // Detectar scroll para carga infinita y windowing
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
    const totalPages = Math.ceil(totalClientes / 40);
    const estimatedPage = Math.max(1, Math.ceil(scrollPercentage * totalPages));

    // === WINDOWING LOGIC ===
    
    // Si estamos cerca del inicio (primera página), resetear ventana al inicio
    if (scrollPercentage < 0.1 && direction === 'up') {
      const newStartPage = 1;
      const newEndPage = Math.min(WINDOW_SIZE, totalPages);
      
      if (newStartPage !== visibleStartPage || newEndPage !== visibleEndPage) {
        setVisibleStartPage(newStartPage);
        setVisibleEndPage(newEndPage);
      }
    }
    // Si scrolleamos hacia abajo y necesitamos expandir/mover la ventana
    else if (direction === 'down') {
      const isNearBottom = scrollTop + clientHeight >= scrollHeight - 50;
      
      // Si estamos cerca del final de los datos visibles, cargar más
      if (isNearBottom && hasMore && !loadingMore && !loading) {
        cargarMasClientes();
      }
      
      // Si scrolleamos más allá de la ventana actual, moverla hacia abajo
      if (estimatedPage > visibleEndPage && estimatedPage <= currentPage) {
        const newStartPage = Math.max(1, estimatedPage - WINDOW_SIZE + 1);
        const newEndPage = Math.min(estimatedPage, currentPage);
        
        if (newStartPage !== visibleStartPage || newEndPage !== visibleEndPage) {
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
          setVisibleStartPage(newStartPage);
          setVisibleEndPage(newEndPage);
        }
      }
    }

  }, [hasMore, loadingMore, loading, cargarMasClientes, lastScrollTop, totalClientes, visibleStartPage, visibleEndPage, currentPage]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFiltros(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleConsultar = () => {
    setCurrentPage(1);
    setHasMore(true);
    setVisibleStartPage(1);
    setVisibleEndPage(WINDOW_SIZE);
    setLastScrollTop(0);
    setScrollDirection('down');
    cargarClientes(true);
  };

  useEffect(() => {
    setCurrentPage(1);
    setHasMore(true);
    setVisibleStartPage(1);
    setVisibleEndPage(WINDOW_SIZE);
    setLastScrollTop(0);
    setScrollDirection('down');
    
    // Cargar tipificaciones, laboratorios y clientes
    cargarTipificaciones();
    cargarLaboratorios();
    cargarClientes(true);
  }, []);

  // Agregar event listener para scroll
  useEffect(() => {
    const container = tableContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  // Resetear paginación cuando cambien los filtros
  useEffect(() => {
    if (JSON.stringify(filtros) !== JSON.stringify({ codlab: '', tipificacion: '', activo: '' })) {
      setCurrentPage(1);
      setHasMore(true);
      setVisibleStartPage(1);
      setVisibleEndPage(WINDOW_SIZE);
      setLastScrollTop(0);
      setScrollDirection('down');
    }
  }, [filtros]);

  // Cerrar dropdown cuando se haga clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Verificar si el click es en un botón del dropdown
      if (event.target.closest('button[data-dropdown-action]')) {
        return; // No cerrar si es un botón del dropdown
      }
      
      if (actionsDropdownRef.current && !actionsDropdownRef.current.contains(event.target)) {
        setShowActionsDropdown(false);
      }
    };

    if (showActionsDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showActionsDropdown]);

  // Cargar laboratorios cuando se abra el modal
  useEffect(() => {
    if (showTipificacionModal) {
      cargarLaboratoriosModal();
    }
  }, [showTipificacionModal]);

  // Cargar tipificaciones existentes cuando se abra el modal de editar
  useEffect(() => {
    if (showEditarTipificacionModal) {
      cargarTipificacionesExistentes();
    }
  }, [showEditarTipificacionModal]);

  // Cerrar dropdown de laboratorios cuando se haga clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.laboratorio-dropdown')) {
        setMostrarLaboratorios(false);
      }
    };

    if (mostrarLaboratorios) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [mostrarLaboratorios]);

  const handleLimpiar = () => {
    setFiltros({
      codlab: '',
      tipificacion: '',
      activo: ''
    });
    setFiltroCliente('');
    setCurrentPage(1);
    setHasMore(true);
    setVisibleStartPage(1);
    setVisibleEndPage(WINDOW_SIZE);
    setLastScrollTop(0);
    setScrollDirection('down');
  };

  // Función para cargar laboratorios para el modal
  const cargarLaboratoriosModal = async () => {
    try {
      const response = await axiosClient.get('/clientes/laboratorios-todos');
      setLaboratoriosDisponibles(response.data);
    } catch (error) {
      console.error('Error cargando laboratorios:', error);
    }
  };

  // Función para obtener el siguiente número de tipificación
  const obtenerSiguienteTipificacion = async (codlab) => {
    try {
      const response = await axiosClient.get(`/clientes/siguiente-tipificacion/${codlab}`);
      return response.data.siguienteNumero;
    } catch (error) {
      console.error('Error obteniendo siguiente tipificación:', error);
      return 1; // Valor por defecto
    }
  };

  // Función para cuando cambie el laboratorio, actualizar el número de tipificación
  const handleCodlabChange = async (codlab) => {
    setTipificacionForm(prev => ({ ...prev, codlab }));
    
    if (codlab) {
      const numero = await obtenerSiguienteTipificacion(codlab);
      setSiguienteNumero(numero);
    } else {
      setSiguienteNumero(null);
    }
  };

  // Función para filtrar laboratorios
  const laboratoriosFiltrados = laboratoriosDisponibles.filter(lab => {
    const codLab = lab.codlab || '';
    const descripcion = lab.descripcion || '';
    const busqueda = busquedaLaboratorio.toLowerCase();
    
    return codLab.toLowerCase().includes(busqueda) ||
           descripcion.toLowerCase().includes(busqueda);
  });

  // Función para seleccionar laboratorio
  const seleccionarLaboratorio = async (laboratorio) => {
    const codLab = laboratorio.codlab || '';
    const descripcion = laboratorio.descripcion || '';
    
    setTipificacionForm(prev => ({ ...prev, codlab: codLab }));
    setBusquedaLaboratorio(`${codLab} - ${descripcion}`);
    setMostrarLaboratorios(false);
    
    // Obtener siguiente número para este laboratorio
    if (codLab) {
      const numero = await obtenerSiguienteTipificacion(codLab);
      setSiguienteNumero(numero);
    }
  };

  // Función para cerrar el modal de tipificación
  const handleCerrarTipificacionModal = () => {
    setShowTipificacionModal(false);
    setTipificacionForm({ tipificacion: '', codlab: '', descripcion: '' });
    setSiguienteNumero(null);
    setBusquedaLaboratorio('');
    setMostrarLaboratorios(false);
  };

  // Función para agregar tipificación
  const handleAgregarTipificacion = async (e) => {
    e.preventDefault();
    
    if (!tipificacionForm.tipificacion || !tipificacionForm.codlab || !tipificacionForm.descripcion) {
      showNotification('danger', 'Todos los campos son requeridos');
      return;
    }

    try {
      setTipificacionLoading(true);
      
      const response = await agregarTipificacion(
        parseInt(tipificacionForm.tipificacion),
        tipificacionForm.codlab,
        tipificacionForm.descripcion
      );

      if (response.success) {
        showNotification('success', 'Tipificación agregada exitosamente');
        handleCerrarTipificacionModal();
        
        // Recargar tipificaciones
        await cargarTipificaciones();
      } else {
        showNotification('danger', response.message || 'Error al agregar tipificación');
      }
    } catch (error) {
      console.error('Error agregando tipificación:', error);
      showNotification('danger', error.response?.data?.message || 'Error al agregar tipificación');
    } finally {
      setTipificacionLoading(false);
    }
  };

  // Función para cargar tipificaciones existentes
  const cargarTipificacionesExistentes = async () => {
    try {
      const response = await obtenerTipificacionesExistentes();
      setTipificacionesExistentes(response);
    } catch (error) {
      console.error('Error cargando tipificaciones existentes:', error);
    }
  };

  // Función para seleccionar tipificación para editar
  const seleccionarTipificacionParaEditar = (tipificacion) => {
    setTipificacionSeleccionada(tipificacion);
    setEditarTipificacionForm({
      descripcion: tipificacion.descripcion
    });
  };

  // Función para editar tipificación
  const handleEditarTipificacion = async (e) => {
    e.preventDefault();
    
    if (!editarTipificacionForm.descripcion) {
      showNotification('danger', 'La descripción es requerida');
      return;
    }

    try {
      setEditarTipificacionLoading(true);
      
      const response = await actualizarTipificacion(
        tipificacionSeleccionada.tipificacion,
        tipificacionSeleccionada.codlab,
        editarTipificacionForm.descripcion
      );

      if (response.success) {
        showNotification('success', 'Tipificación actualizada exitosamente');
        handleCerrarEditarTipificacionModal();
        
        // Recargar tipificaciones
        await cargarTipificaciones();
      } else {
        showNotification('danger', response.message || 'Error al actualizar tipificación');
      }
    } catch (error) {
      console.error('Error actualizando tipificación:', error);
      showNotification('danger', error.response?.data?.message || 'Error al actualizar tipificación');
    } finally {
      setEditarTipificacionLoading(false);
    }
  };

  // Función para cerrar el modal de editar tipificación
  const handleCerrarEditarTipificacionModal = () => {
    setShowEditarTipificacionModal(false);
    setTipificacionSeleccionada(null);
    setEditarTipificacionForm({ descripcion: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!formData.cliente || !formData.tipificacion) {
        showNotification('error', 'Los campos cliente y tipificación son obligatorios');
        return;
      }
      
      const tipificacion = parseFloat(formData.tipificacion);
      if (isNaN(tipificacion)) {
        showNotification('error', 'El campo "tipificación" debe ser un número válido');
        return;
      }
      
      const codlabStr = String(formData.codlab || '01').trim();
      const clienteStr = String(formData.cliente || '').trim();
      
      if (editingCliente) {
        await actualizarCliente({
          codlabOld: editingCliente.codlab,
          clienteOld: editingCliente.cliente,
          tipificacionOld: editingCliente.tipificacion,
          codlabNew: codlabStr,
          clienteNew: clienteStr,
          tipificacionNew: tipificacion
        });
      } else {
        await crearCliente({
          codlab: codlabStr,
          cliente: clienteStr,
          tipificacion
        });
      }
      
      setShowForm(false);
      setEditingCliente(null);
      setFormData({ codlab: '', cliente: '', tipificacion: '' });
      setCurrentPage(1);
      setHasMore(true);
      setVisibleStartPage(1);
      setVisibleEndPage(WINDOW_SIZE);
      setLastScrollTop(0);
      setScrollDirection('down');
      cargarClientes(true);
    } catch (error) {
      console.error('Error completo:', error);
      let mensaje = 'Error al guardar el cliente';
      if (error.response) {
        const { status, data } = error.response;
        if (status === 409) {
          mensaje = data.details || 'Ya existe un cliente con estos valores';
        } else if (data && data.error) {
          mensaje = data.error;
          if (data.details) mensaje += `: ${data.details}`;
        }
      }
      showNotification('error', mensaje);
    }
  };

  const handleEdit = (cliente) => {
    setEditingCliente(cliente);
    setFormData({
      codlab: cliente.codlab || '',
      cliente: cliente.cliente || '',
      tipificacion: cliente.tipificacion?.toString() || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (cliente) => {
    if (window.confirm('¿Está seguro de eliminar este cliente?')) {
      try {
        await eliminarCliente({
          codlab: safeString(cliente.codlab),
          cliente: safeString(cliente.cliente),
          tipificacion: cliente.tipificacion
        });
        setCurrentPage(1);
        setHasMore(true);
        setVisibleStartPage(1);
        setVisibleEndPage(WINDOW_SIZE);
        setLastScrollTop(0);
        setScrollDirection('down');
        cargarClientes(true);
      } catch (error) {
        console.error('Error al eliminar el cliente:', error);
        let mensaje = 'Error al eliminar el cliente';
        if (error.response) {
          mensaje = error.response.data.error || mensaje;
        }
        showNotification('error', mensaje);
      }
    }
  };

  // Manejar selección de archivo
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = [
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];
      const allowedExtensions = ['.xls', '.xlsx'];
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      
      if (allowedTypes.includes(file.type) || allowedExtensions.includes(fileExtension)) {
        setImportFile(file);
      } else {
        showNotification('error', 'Solo se permiten archivos Excel (.xls, .xlsx)');
        e.target.value = '';
      }
    }
  };

  // Manejar importación de Excel
  const handleImportExcel = async () => {
    if (!importFile) {
      showNotification('error', 'Debe seleccionar un archivo');
      return;
    }
    
    if (!selectedLab) {
      showNotification('error', 'Debe seleccionar un laboratorio');
      return;
    }

    try {
      setImportLoading(true);
      
      const response = await importarClientesExcel(importFile, selectedLab);
      
      // Mostrar resumen de la importación
      const { resumen, detalles } = response;
      let mensaje = `Importación completada:\n`;
      mensaje += `• ${resumen.insertados} clientes insertados\n`;
      mensaje += `• ${resumen.duplicados} duplicados omitidos\n`;
      
      if (resumen.errores > 0) {
        mensaje += `• ${resumen.errores} errores encontrados`;
      }
      
      showNotification('success', mensaje);
      
      // Cerrar modal y recargar datos
      setShowImportModal(false);
      setImportFile(null);
      setSelectedLab('');
      setCurrentPage(1);
      setHasMore(true);
      setVisibleStartPage(1);
      setVisibleEndPage(WINDOW_SIZE);
      setLastScrollTop(0);
      setScrollDirection('down');
      cargarClientes(true);
      
    } catch (error) {
      console.error('Error en importación:', error);
      let mensaje = 'Error al importar el archivo';
      if (error.response?.data?.details) {
        mensaje += `: ${error.response.data.details}`;
      }
      showNotification('error', mensaje);
    } finally {
      setImportLoading(false);
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
      `¿Está seguro de eliminar TODOS los clientes con las siguientes tipificaciones?\n\n${tipificacionesTexto}\n\n⚠️ Esta acción NO se puede deshacer y eliminará los registros de ambas tablas.`
    );

    if (!confirmacion) return;

    try {
      setDeleteMassLoading(true);
      
      const response = await eliminarClientesEnMasa(selectedTipificaciones);
      
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
      setCurrentPage(1);
      setHasMore(true);
      setVisibleStartPage(1);
      setVisibleEndPage(WINDOW_SIZE);
      setLastScrollTop(0);
      setScrollDirection('down');
      cargarClientes(true);
      
    } catch (error) {
      console.error('Error en eliminación en masa:', error);
      let mensaje = 'Error al eliminar clientes en masa';
      if (error.response?.data?.details) {
        mensaje += `: ${error.response.data.details}`;
      }
      showNotification('error', mensaje);
    } finally {
      setDeleteMassLoading(false);
    }
  };

  // Filtrar clientes en tiempo real
  const clientesFiltrados = Array.isArray(clientes)
    ? (filtroCliente
        ? clientes.filter(c => {
            const ruc = (c.cliente || '').toLowerCase();
            const nombre = (c.razon || '').toLowerCase();
            const busqueda = filtroCliente.toLowerCase();
            return ruc.includes(busqueda) || nombre.includes(busqueda);
          })
        : clientes)
    : [];


  return (
    <>
      {/* Bloque principal: Título, botones y filtros */}
      <Card className="mb-6">
        <Card.Body>
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-xl font-bold">Consulta de Clientes</h1>
              <p className="text-sm text-gray-600">
                Mostrando {clientes.length} de {totalClientes} resultados
                {allClientes.length > clientes.length && (
                  <span className="text-blue-600"> (ventana: páginas {visibleStartPage}-{visibleEndPage})</span>
                )}
                {hasMore && ' (cargando más al hacer scroll)'}
              </p>
            </div>
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
              {/* Botón de Acciones con Dropdown */}
              <div className="relative" ref={actionsDropdownRef}>
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => {
                    if (!showActionsDropdown) {
                      const rect = actionsDropdownRef.current.getBoundingClientRect();
                      setDropdownPosition({
                        top: rect.bottom + window.scrollY + 8,
                        left: rect.right - 192 + window.scrollX // 192px es el ancho del dropdown
                      });
                    }
                    setShowActionsDropdown(!showActionsDropdown);
                  }}
                  className="flex items-center"
                >
                  <EllipsisVerticalIcon className="w-5 h-5 mr-2" />
                  Acciones
                </Button>
                
                {/* Dropdown Menu - Renderizado como Portal */}
                {showActionsDropdown && createPortal(
                  <div 
                    className="fixed w-48 bg-white rounded-md shadow-lg z-[9999] border border-gray-200"
                    style={{
                      top: `${dropdownPosition.top}px`,
                      left: `${dropdownPosition.left}px`
                    }}
                  >
                    <div className="py-1">
                      <button
                        data-dropdown-action
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setEditingCliente(null);
                          setFormData({ codlab: '', cliente: '', tipificacion: '' });
                          setShowForm(true);
                          setShowActionsDropdown(false);
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <PlusIcon className="w-4 h-4 mr-3 text-green-600" />
                        Agregar Cliente
                      </button>
                      
                      <button
                        data-dropdown-action
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setShowImportModal(true);
                          setShowActionsDropdown(false);
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <DocumentArrowUpIcon className="w-4 h-4 mr-3 text-blue-600" />
                        Importar desde Excel
                      </button>
                      
                      <button
                        data-dropdown-action
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setShowDeleteMassModal(true);
                          setShowActionsDropdown(false);
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <ExclamationTriangleIcon className="w-4 h-4 mr-3 text-red-600" />
                        Eliminar en Masa
                      </button>
                      
                      <div className="border-t border-gray-200 my-1"></div>
                      
                      <button
                        data-dropdown-action
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setShowTipificacionModal(true);
                          setShowActionsDropdown(false);
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <PlusIcon className="w-4 h-4 mr-3 text-purple-600" />
                        Agregar Tipificación
                      </button>
                      <button
                        data-dropdown-action
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setShowEditarTipificacionModal(true);
                          setShowActionsDropdown(false);
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <PencilIcon className="w-4 h-4 mr-3 text-blue-600" />
                        Editar Tipificación
                      </button>
                    </div>
                  </div>,
                  document.body
                )}
              </div>
            </div>
          </div>
          <form className="space-y-4">
            <div className="grid grid-cols-4 gap-x-4 gap-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Laboratorio
                </label>
                <select
                  name="codlab"
                  value={filtros.codlab}
                  onChange={handleFilterChange}
                  className="block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                >
                  <option value="">Todos</option>
                  {laboratorios.map(lab => (
                    <option key={lab.codlab} value={lab.codlab}>
                      {lab.codlab} - {lab.descripcion}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipificación
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
                  Estado
                </label>
                <select
                  name="activo"
                  value={filtros.activo}
                  onChange={handleFilterChange}
                  className="block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                >
                  <option value="">Todos</option>
                  <option value="1">Activo</option>
                  <option value="0">Inactivo</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filtro Cliente
                </label>
                <input
                  type="text"
                  value={filtroCliente}
                  onChange={e => setFiltroCliente(e.target.value)}
                  className="block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  placeholder="Buscar por nombre o RUC..."
                />
              </div>
            </div>
          </form>
        </Card.Body>
      </Card>

      {/* Tabla */}
      <Card>
        <div 
          ref={tableContainerRef}
          className="overflow-x-auto max-h-[calc(100vh-240px)]"
        >
          <div className="min-w-full inline-block align-middle">
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lab</th>
                    <th className="pr-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                    <th className="pr-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipificación</th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">En T</th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">En D</th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider sticky right-0 bg-gray-50 z-20">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-4 text-center">
                        Cargando...
                      </td>
                    </tr>
                  ) : clientesFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-4 text-center">
                        No hay datos disponibles
                      </td>
                    </tr>
                  ) : (
                    clientesFiltrados.map((cliente, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          {cliente.codlab}
                        </td>
                        <td className="py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900">
                              {cliente.razon || 'Sin nombre'}
                            </span>
                            <span className="text-sm text-gray-600">
                              RUC: {cliente.cliente}
                            </span>
                          </div>
                        </td>
                        <td className="py-4">
                          <div className="flex flex-col">
                            <span className="font-medium">{cliente.tipificacion}</span>
                            <span className="text-sm text-gray-600 italic">
                              {tipificacionesMap[cliente.tipificacion] || 'Desconocida'}
                            </span>
                          </div>
                        </td>
                        <td className="text-center py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            cliente.en_t ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {cliente.en_t ? '✓' : '✗'}
                          </span>
                        </td>
                        <td className="text-center py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            cliente.en_d ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {cliente.en_d ? '✓' : '✗'}
                          </span>
                        </td>
                        <td className="text-center py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            cliente.Activo === true || cliente.Activo === 1 ? 'bg-green-100 text-green-800' : 
                            cliente.Activo === false || cliente.Activo === 0 ? 'bg-red-100 text-red-800' : 
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {cliente.Activo === true || cliente.Activo === 1 ? 'Activo' : 
                             cliente.Activo === false || cliente.Activo === 0 ? 'Inactivo' : 
                             cliente.EstadoDescripcion || 'Sin info'}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap sticky right-0 bg-white z-20">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => handleEdit(cliente)}
                              className="text-sky-600 hover:text-sky-800 hover:bg-sky-50 p-1 rounded transition-colors"
                              title="Editar"
                            >
                              <PencilIcon className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDelete(cliente)}
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
              
              {/* Indicador de carga al final */}
              {loadingMore && (
                <div className="flex justify-center items-center py-4">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                    <span className="text-sm text-gray-600">Cargando más resultados...</span>
                  </div>
                </div>
              )}
              
              {/* Mensaje cuando no hay más resultados */}
              {!hasMore && clientes.length > 0 && (
                <div className="flex justify-center items-center py-4">
                  <span className="text-sm text-gray-500">
                    ✓ Se han cargado todos los resultados ({totalClientes})
                  </span>
                </div>
              )}
              
              {/* Indicador de windowing activo */}
              {allClientes.length > clientes.length && (
                <div className="flex justify-center items-center py-2 bg-blue-50 border-t">
                  <span className="text-xs text-blue-600">
                    🪟 Ventana optimizada: {allClientes.length} registros cargados, 
                    mostrando {clientes.length} (páginas {visibleStartPage}-{visibleEndPage})
                    - Scroll hacia arriba/abajo para navegar
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Formulario Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {editingCliente ? 'Editar Cliente' : 'Nuevo Cliente'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingCliente(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Laboratorio
                  </label>
                  <select
                    name="codlab"
                    value={formData.codlab}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="">Seleccione un laboratorio</option>
                    {laboratorios.map(lab => (
                      <option key={lab.codlab} value={lab.codlab}>
                        {lab.codlab} - {lab.descripcion}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cliente
                  </label>
                  <input
                    type="text"
                    name="cliente"
                    value={formData.cliente}
                    onChange={handleInputChange}
                    required
                    className="w-full p-2 border rounded-md"
                    placeholder="Ej: 10165799670"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipificación
                  </label>
                  <select
                    name="tipificacion"
                    value={formData.tipificacion}
                    onChange={handleInputChange}
                    required
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="">Seleccione una tipificación</option>
                    {tipificaciones.map(tip => (
                      <option key={tip.tipificacion} value={tip.tipificacion}>
                        {tip.tipificacion} - {tip.descripcion}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingCliente(null);
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  {editingCliente ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Importación de Excel */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Importar Clientes desde Excel</h2>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportFile(null);
                  setSelectedLab('');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Información del formato */}
              <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
                <h3 className="text-sm font-medium text-blue-800 mb-2">
                  Formato requerido del archivo Excel:
                </h3>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• Columna 1: <strong>Cliente</strong> (RUC/Documento)</li>
                  <li>• Columna 2: <strong>Tipificacion</strong> (Número 1-10)</li>
                  <li>• Formatos soportados: .xls, .xlsx</li>
                  <li>• Primera fila debe contener los encabezados</li>
                </ul>
              </div>

              {/* Selección de laboratorio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Laboratorio de destino *
                </label>
                <select
                  value={selectedLab}
                  onChange={e => setSelectedLab(e.target.value)}
                  className="w-full p-2 border rounded-md"
                  required
                >
                  <option value="">Seleccione un laboratorio</option>
                  {laboratorios.map(lab => (
                    <option key={lab.codlab} value={lab.codlab}>
                      {lab.codlab} - {lab.descripcion}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Los datos se insertarán en ambas tablas con este laboratorio
                </p>
              </div>

              {/* Selección de archivo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Archivo Excel *
                </label>
                <input
                  type="file"
                  accept=".xls,.xlsx"
                  onChange={handleFileChange}
                  className="w-full p-2 border rounded-md"
                  required
                />
                {importFile && (
                  <p className="text-xs text-green-600 mt-1">
                    ✓ Archivo seleccionado: {importFile.name}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowImportModal(false);
                  setImportFile(null);
                  setSelectedLab('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                disabled={importLoading}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleImportExcel}
                disabled={importLoading || !importFile || !selectedLab}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
              >
                {importLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Importando...
                  </>
                ) : (
                  <>
                    <DocumentArrowUpIcon className="w-4 h-4 mr-2" />
                    Importar
                  </>
                )}
              </button>
            </div>
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
                      Esta acción eliminará TODOS los clientes de las tipificaciones seleccionadas
                      de ambas tablas (t_Tipificaciones y Tipificaciones). 
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
                    Se eliminarán TODOS los clientes con estas tipificaciones.
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

      {/* Modal para Agregar Tipificación */}
      {showTipificacionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Agregar Nueva Tipificación</h2>
              <button
                onClick={handleCerrarTipificacionModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleAgregarTipificacion} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número de Tipificación *
                </label>
                <input
                  type="number"
                  value={tipificacionForm.tipificacion}
                  onChange={(e) => setTipificacionForm(prev => ({ ...prev, tipificacion: e.target.value }))}
                  className="block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  placeholder="Ingresa el número de tipificación"
                  min="1"
                  required
                />
                {siguienteNumero && (
                  <p className="text-xs text-gray-500 mt-1">
                    <span className="text-gray-400">Sugerido para este laboratorio: </span>
                    <span className="font-medium text-gray-600">{siguienteNumero}</span>
                  </p>
                )}
              </div>
              
              <div className="relative laboratorio-dropdown">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Laboratorio *
                </label>
                <input
                  type="text"
                  value={busquedaLaboratorio}
                  onChange={(e) => {
                    setBusquedaLaboratorio(e.target.value);
                    setMostrarLaboratorios(true);
                  }}
                  onFocus={() => setMostrarLaboratorios(true)}
                  className="block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  placeholder="Buscar laboratorio por código o nombre..."
                  required
                />
                
                {mostrarLaboratorios && laboratoriosFiltrados.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                    {laboratoriosFiltrados.map((lab) => (
                      <div
                        key={lab.codlab || 'unknown'}
                        onClick={() => seleccionarLaboratorio(lab)}
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                      >
                        <div className="font-medium text-gray-900">{lab.codlab || 'Sin código'}</div>
                        <div className="text-gray-500">{lab.descripcion || 'Sin descripción'}</div>
                      </div>
                    ))}
                  </div>
                )}
                
                {mostrarLaboratorios && laboratoriosFiltrados.length === 0 && busquedaLaboratorio && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                    <div className="px-3 py-2 text-sm text-gray-500">
                      No se encontraron laboratorios
                    </div>
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción *
                </label>
                <textarea
                  value={tipificacionForm.descripcion}
                  onChange={(e) => setTipificacionForm(prev => ({ ...prev, descripcion: e.target.value }))}
                  className="block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  placeholder="Descripción de la tipificación"
                  rows={3}
                  required
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleCerrarTipificacionModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={tipificacionLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50"
                >
                  {tipificacionLoading ? 'Agregando...' : 'Agregar Tipificación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para Editar Tipificación */}
      {showEditarTipificacionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Editar Tipificación</h2>
              <button
                onClick={handleCerrarEditarTipificacionModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Lista de tipificaciones existentes */}
              <div>
                <h3 className="text-lg font-medium mb-3">Selecciona una tipificación para editar:</h3>
                <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-md">
                  {tipificacionesExistentes.map((tip) => (
                    <div
                      key={`${tip.tipificacion}-${tip.codlab}`}
                      onClick={() => seleccionarTipificacionParaEditar(tip)}
                      className={`p-3 border-b border-gray-200 cursor-pointer hover:bg-gray-50 ${
                        tipificacionSeleccionada?.tipificacion === tip.tipificacion && 
                        tipificacionSeleccionada?.codlab === tip.codlab 
                          ? 'bg-blue-50 border-blue-200' 
                          : ''
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium text-gray-900">
                            {tip.codlab} - {tip.nombreLaboratorio}
                          </div>
                          <div className="text-sm text-gray-600">
                            Tipificación #{tip.tipificacion}
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            {tip.descripcion}
                          </div>
                        </div>
                        <PencilIcon className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Formulario de edición */}
              {tipificacionSeleccionada && (
                <div className="border-t pt-4">
                  <h3 className="text-lg font-medium mb-3">
                    Editando: {tipificacionSeleccionada.codlab} - Tipificación #{tipificacionSeleccionada.tipificacion}
                  </h3>
                  <form onSubmit={handleEditarTipificacion} className="space-y-4">
                    {/* Información de solo lectura */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Número de Tipificación
                        </label>
                        <input
                          type="text"
                          value={tipificacionSeleccionada.tipificacion}
                          className="block w-full rounded-md border border-gray-300 py-2 px-3 bg-gray-100 text-gray-600"
                          readOnly
                        />
                        <p className="text-xs text-gray-500 mt-1">No se puede modificar</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Código de Laboratorio
                        </label>
                        <input
                          type="text"
                          value={tipificacionSeleccionada.codlab}
                          className="block w-full rounded-md border border-gray-300 py-2 px-3 bg-gray-100 text-gray-600"
                          readOnly
                        />
                        <p className="text-xs text-gray-500 mt-1">No se puede modificar</p>
                      </div>
                    </div>

                    {/* Descripción editable */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Descripción *
                      </label>
                      <input
                        type="text"
                        value={editarTipificacionForm.descripcion}
                        onChange={(e) => setEditarTipificacionForm(prev => ({
                          ...prev,
                          descripcion: e.target.value
                        }))}
                        className="block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                        placeholder="Ingresa la descripción de la tipificación"
                        required
                        maxLength={40}
                      />
                    </div>

                    <div className="flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={handleCerrarEditarTipificacionModal}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={editarTipificacionLoading}
                        className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50"
                      >
                        {editarTipificacionLoading ? 'Actualizando...' : 'Actualizar Tipificación'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Clientes; 
