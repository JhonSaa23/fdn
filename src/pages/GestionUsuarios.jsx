import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  EyeIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  KeyIcon,
  ShieldCheckIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { useNotification } from '../App';
import { usePermissions } from '../hooks/usePermissions';
import axiosClient from '../services/axiosClient';

const GestionUsuarios = () => {
  const { showNotification } = useNotification();
  const { getVistasSistema } = usePermissions();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    IDUS: '',
    CodigoInterno: '',
    Nombres: '',
    DNI_RUC: '',
    NumeroCelular: '',
    Email: '',
    TipoUsuario: 'Trabajador',
    Rol: '',
    Permisos: '',
    Activo: true,
    Bloqueado: false
  });
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [errors, setErrors] = useState({});
  const [filtros, setFiltros] = useState({
    nombre: '',
    codigo: '',
    dni: '',
    rol: '',
    tipo: '',
    activo: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  // Cargar usuarios al montar el componente
  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    try {
      setLoading(true);
      const response = await axiosClient.get('/auth/usuarios');
      if (response.data.success) {
        setUsuarios(response.data.data || []);
      } else {
        showNotification('error', 'Error al cargar usuarios');
      }
    } catch (error) {
      console.error('Error cargando usuarios:', error);
      showNotification('error', 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.CodigoInterno.trim()) {
      newErrors.CodigoInterno = 'Código interno es requerido';
    }

    if (!formData.Nombres.trim()) {
      newErrors.Nombres = 'Nombres son requeridos';
    }

    if (!formData.DNI_RUC.trim()) {
      newErrors.DNI_RUC = 'DNI/RUC es requerido';
    } else if (!/^(\d{8}|\d{11})$/.test(formData.DNI_RUC)) {
      newErrors.DNI_RUC = 'DNI debe tener 8 dígitos o RUC 11 dígitos';
    }

    if (!formData.NumeroCelular.trim()) {
      newErrors.NumeroCelular = 'Número de celular es requerido';
    } else if (!/^\d{9,15}$/.test(formData.NumeroCelular)) {
      newErrors.NumeroCelular = 'Número de celular debe tener entre 9 y 15 dígitos';
    }

    if (formData.Email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.Email)) {
      newErrors.Email = 'Email inválido';
    }

    if (!formData.Rol.trim()) {
      newErrors.Rol = 'Rol es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      // Preparar datos sin permisos (ahora se manejan en tabla separada)
      const dataToSend = {
        ...formData,
        Permisos: '' // Ya no se usa este campo
      };
      
      let response;
      if (editingUser) {
        response = await axiosClient.put(`/auth/usuarios/${editingUser.IDUS}`, dataToSend);
      } else {
        response = await axiosClient.post('/auth/usuarios', dataToSend);
      }

      if (response.data.success) {
        const userId = editingUser ? editingUser.IDUS : response.data.data?.IDUS;
        
        // Guardar vistas del usuario
        if (userId && selectedPermissions.length > 0) {
          try {
            await axiosClient.put(`/vistas/usuario/${userId}`, { vistas: selectedPermissions });
          } catch (error) {
            console.error('Error guardando vistas:', error);
          }
        }
        
        showNotification('success', editingUser ? 'Usuario actualizado exitosamente' : 'Usuario creado exitosamente');
        setShowModal(false);
        setEditingUser(null);
        resetForm();
        cargarUsuarios();
      } else {
        showNotification('error', response.data.message || 'Error al guardar usuario');
      }
    } catch (error) {
      console.error('Error guardando usuario:', error);
      showNotification('error', 'Error de conexión');
    }
  };

  const handleEdit = async (usuario) => {
    setEditingUser(usuario);
    
    // Cargar vistas del usuario desde la BD
    try {
      const response = await axiosClient.get(`/vistas/usuario/${usuario.IDUS}`);
      if (response.data.success) {
        const vistasUsuario = response.data.data || [];
        setSelectedPermissions(vistasUsuario.map(v => v.ID));
      }
    } catch (error) {
      console.error('Error cargando vistas del usuario:', error);
      setSelectedPermissions([]);
    }
    
    setFormData({
      IDUS: usuario.IDUS,
      CodigoInterno: usuario.CodigoInterno,
      Nombres: usuario.Nombres,
      DNI_RUC: usuario.DNI_RUC,
      NumeroCelular: usuario.NumeroCelular,
      Email: usuario.Email || '',
      TipoUsuario: usuario.TipoUsuario,
      Rol: usuario.Rol,
      Permisos: usuario.Permisos || '',
      Activo: usuario.Activo,
      Bloqueado: usuario.Bloqueado
    });
    setShowModal(true);
  };

  const handleDelete = async (idus) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este usuario?')) {
      return;
    }

    try {
      const response = await axiosClient.delete(`/auth/usuarios/${idus}`);

      if (response.data.success) {
        showNotification('success', 'Usuario eliminado exitosamente');
        cargarUsuarios();
      } else {
        showNotification('error', response.data.message || 'Error al eliminar usuario');
      }
    } catch (error) {
      console.error('Error eliminando usuario:', error);
      showNotification('error', 'Error de conexión');
    }
  };

  const resetForm = () => {
    setFormData({
      IDUS: '',
      CodigoInterno: '',
      Nombres: '',
      DNI_RUC: '',
      NumeroCelular: '',
      Email: '',
      TipoUsuario: 'Trabajador',
      Rol: '',
      Permisos: '',
      Activo: true,
      Bloqueado: false
    });
    setSelectedPermissions([]);
    setErrors({});
  };

  const openModal = () => {
    resetForm();
    setEditingUser(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingUser(null);
    resetForm();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('es-ES');
  };

  const getStatusBadge = (usuario) => {
    if (usuario.Bloqueado) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Bloqueado</span>;
    }
    if (!usuario.Activo) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Inactivo</span>;
    }
    if (usuario.SesionActiva) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">En línea</span>;
    }
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Activo</span>;
  };

  const handlePermissionChange = (vistaId, checked) => {
    if (checked) {
      setSelectedPermissions([...selectedPermissions, vistaId]);
    } else {
      setSelectedPermissions(selectedPermissions.filter(id => id !== vistaId));
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFiltros(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const limpiarFiltros = () => {
    setFiltros({
      nombre: '',
      codigo: '',
      dni: '',
      rol: '',
      tipo: '',
      activo: ''
    });
  };

  const usuariosFiltrados = usuarios.filter(usuario => {
    return (
      (filtros.nombre === '' || usuario.Nombres.toLowerCase().includes(filtros.nombre.toLowerCase())) &&
      (filtros.codigo === '' || usuario.CodigoInterno.toLowerCase().includes(filtros.codigo.toLowerCase())) &&
      (filtros.dni === '' || usuario.DNI_RUC.includes(filtros.dni)) &&
      (filtros.rol === '' || usuario.Rol.toLowerCase().includes(filtros.rol.toLowerCase())) &&
      (filtros.tipo === '' || usuario.TipoUsuario === filtros.tipo) &&
      (filtros.activo === '' || 
        (filtros.activo === 'activo' && usuario.Activo && !usuario.Bloqueado) ||
        (filtros.activo === 'inactivo' && !usuario.Activo) ||
        (filtros.activo === 'bloqueado' && usuario.Bloqueado))
    );
  });

  // Helper para el estilo de inputs
  const getInputClassName = (hasError) => 
    `mt-1 block w-full border rounded-md px-2 md:px-3 py-1.5 md:py-2 text-sm ${
      hasError ? 'border-red-300' : 'border-gray-300'
    } focus:outline-none focus:ring-blue-500 focus:border-blue-500`;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <>
      <div>
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:mb-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
              <p className="text-sm md:text-base text-gray-600">Administra los usuarios del sistema</p>
            </div>
            <div className="flex sm:flex-row gap-3">
              {/* Botón Filtrar - Solo en móvil */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="md:hidden inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 w-full sm:w-auto"
              >
                <MagnifyingGlassIcon className="h-4 w-4 mr-2" />
                {showFilters ? 'Ocultar' : 'Filtrar'}
              </button>
              <button
                onClick={openModal}
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 w-full sm:w-auto"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Nuevo
              </button>
            </div>
          </div>
        </div>

        {/* Panel de filtros */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4 md:mb-6">
          {/* Header de filtros - Solo visible en desktop */}
          <div className="hidden md:block border-b border-gray-200 px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <div className="flex items-center gap-2 text-gray-700 font-medium">
                <div className="p-1.5 bg-blue-100 rounded-lg">
                  <MagnifyingGlassIcon className="h-4 w-4 text-blue-600" />
                </div>
                <span className="text-sm font-semibold">Búsqueda y Filtros</span>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={limpiarFiltros}
                  className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 text-sm font-medium transition-colors shadow-sm"
                >
                  <XCircleIcon className="h-4 w-4" />
                  Limpiar
                </button>
              </div>
            </div>
          </div>

          {/* Filtros - Siempre visible en desktop, condicional en móvil */}
          <div className={`p-4 bg-gray-50 ${showFilters ? 'block' : 'hidden'} md:block`}>
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-6 gap-3">
              <input
                type="text"
                name="nombre"
                value={filtros.nombre}
                onChange={handleFilterChange}
                placeholder="Buscar por nombre..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              />
              <input
                type="text"
                name="codigo"
                value={filtros.codigo}
                onChange={handleFilterChange}
                placeholder="Buscar por código..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              />
              <input
                type="text"
                name="dni"
                value={filtros.dni}
                onChange={handleFilterChange}
                placeholder="Buscar por DNI/RUC..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              />
              <input
                type="text"
                name="rol"
                value={filtros.rol}
                onChange={handleFilterChange}
                placeholder="Buscar por rol..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              />
              <select
                name="tipo"
                value={filtros.tipo}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="">Todos los tipos</option>
                <option value="Admin">Administrador</option>
                <option value="Trabajador">Trabajador</option>
              </select>
              <select
                name="activo"
                value={filtros.activo}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="">Todos los estados</option>
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
                <option value="bloqueado">Bloqueado</option>
              </select>
            </div>
            
            {/* Botón limpiar - Solo visible en móvil cuando los filtros están abiertos */}
            <div className="md:hidden mt-3 flex justify-end">
              <button
                onClick={limpiarFiltros}
                className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 text-sm font-medium transition-colors"
              >
                <XCircleIcon className="h-4 w-4" />
                Limpiar Filtros
              </button>
            </div>
          </div>
        </div>

        {/* Lista de usuarios */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {/* Vista de escritorio - Tabla */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contacto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rol
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Último Acceso
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {usuariosFiltrados.map((usuario) => (
                  <tr key={usuario.IDUS} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <UserIcon className="h-5 w-5 text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{usuario.Nombres}</div>
                          <div className="text-sm text-gray-500">{usuario.CodigoInterno}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{usuario.DNI_RUC}</div>
                      <div className="text-sm text-gray-500 flex items-center">
                        <PhoneIcon className="h-3 w-3 mr-1" />
                        {usuario.NumeroCelular}
                      </div>
                      {usuario.Email && (
                        <div className="text-sm text-gray-500 flex items-center">
                          <EnvelopeIcon className="h-3 w-3 mr-1" />
                          {usuario.Email}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{usuario.Rol}</div>
                      <div className="text-sm text-gray-500">{usuario.TipoUsuario}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(usuario)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(usuario.UltimoAcceso)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(usuario)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Editar"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(usuario.IDUS)}
                          className="text-red-600 hover:text-red-900"
                          title="Eliminar"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Vista móvil - Cards */}
          <div className="md:hidden">
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
              <h3 className="text-sm font-medium text-gray-900">Lista de Usuarios ({usuariosFiltrados.length})</h3>
            </div>
            <div className="p-3 space-y-3">
              {usuariosFiltrados.map((usuario) => (
                <div 
                  key={usuario.IDUS} 
                  onClick={() => handleEdit(usuario)}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-all cursor-pointer active:scale-[0.98]"
                >
                  {/* Header del card */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0 h-12 w-12">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
                          <UserIcon className="h-6 w-6 text-white" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-base font-semibold text-gray-900 truncate">{usuario.Nombres}</h4>
                        <p className="text-sm text-gray-500">Código: {usuario.CodigoInterno}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      {getStatusBadge(usuario)}
                    </div>
                  </div>

                  {/* Información del usuario - Solo iconos */}
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center text-sm text-gray-600">
                        <KeyIcon className="h-4 w-4 mr-2 text-gray-400" />
                        <span className="truncate">{usuario.DNI_RUC}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <PhoneIcon className="h-4 w-4 mr-2 text-gray-400" />
                        <span className="truncate">{usuario.NumeroCelular}</span>
                      </div>
                      {usuario.Email && (
                        <div className="flex items-center text-sm text-gray-600 col-span-2">
                          <EnvelopeIcon className="h-4 w-4 mr-2 text-gray-400" />
                          <span className="truncate">{usuario.Email}</span>
                        </div>
                      )}
                      <div className="flex items-center text-sm text-gray-600">
                        <ShieldCheckIcon className="h-4 w-4 mr-2 text-gray-400" />
                        <span className="truncate">{usuario.Rol}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <ClockIcon className="h-4 w-4 mr-2 text-gray-400" />
                        <span className="truncate text-xs">{formatDate(usuario.UltimoAcceso)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-2 md:top-5 mx-auto p-2 md:p-5 border w-full md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white max-h-[98vh] md:max-h-[95vh] flex flex-col">
            <div className="flex items-center justify-between mb-3 md:mb-4 flex-shrink-0 px-1">
              <h3 className="text-base md:text-lg font-medium text-gray-900">
                {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <XCircleIcon className="h-5 w-5 md:h-6 md:w-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-1">
              <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4">
                  {/* Código Interno */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      CódInt *
                    </label>
                    <input
                      type="text"
                      value={formData.CodigoInterno}
                      onChange={(e) => setFormData({...formData, CodigoInterno: e.target.value})}
                      className={getInputClassName(errors.CodigoInterno)}
                      placeholder="EMP001"
                    />
                    {errors.CodigoInterno && (
                      <p className="mt-1 text-sm text-red-600">{errors.CodigoInterno}</p>
                    )}
                  </div>

                  {/* DNI/RUC */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      DNI/RUC *
                    </label>
                    <input
                      type="text"
                      value={formData.DNI_RUC}
                      onChange={(e) => setFormData({...formData, DNI_RUC: e.target.value})}
                      className={getInputClassName(errors.DNI_RUC)}
                      placeholder="12345678 o 20123456789"
                    />
                    {errors.DNI_RUC && (
                      <p className="mt-1 text-sm text-red-600">{errors.DNI_RUC}</p>
                    )}
                  </div>

                  {/* Nombres */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Nombres Completos *
                    </label>
                    <input
                      type="text"
                      value={formData.Nombres}
                      onChange={(e) => setFormData({...formData, Nombres: e.target.value})}
                      className={getInputClassName(errors.Nombres)}
                      placeholder="Juan Carlos Pérez García"
                    />
                    {errors.Nombres && (
                      <p className="mt-1 text-sm text-red-600">{errors.Nombres}</p>
                    )}
                  </div>

                  {/* Número de Celular */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Celular *
                    </label>
                    <input
                      type="tel"
                      value={formData.NumeroCelular}
                      onChange={(e) => setFormData({...formData, NumeroCelular: e.target.value})}
                      className={getInputClassName(errors.NumeroCelular)}
                      placeholder="987654321"
                    />
                    {errors.NumeroCelular && (
                      <p className="mt-1 text-sm text-red-600">{errors.NumeroCelular}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.Email}
                      onChange={(e) => setFormData({...formData, Email: e.target.value})}
                      className={getInputClassName(errors.Email)}
                      placeholder="usuario@empresa.com"
                    />
                    {errors.Email && (
                      <p className="mt-1 text-sm text-red-600">{errors.Email}</p>
                    )}
                  </div>

                  {/* Tipo de Usuario */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Tipo User *
                    </label>
                    <select
                      value={formData.TipoUsuario}
                      onChange={(e) => setFormData({...formData, TipoUsuario: e.target.value})}
                      className={getInputClassName(false)}
                    >
                      <option value="Trabajador">Trabajador</option>
                      <option value="Admin">Administrador</option>
                    </select>
                  </div>

                  {/* Rol */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Rol *
                    </label>
                    <input
                      type="text"
                      value={formData.Rol}
                      onChange={(e) => setFormData({...formData, Rol: e.target.value})}
                      className={getInputClassName(errors.Rol)}
                      placeholder="Vendedor, Supervisor, Gerente..."
                    />
                    {errors.Rol && (
                      <p className="mt-1 text-sm text-red-600">{errors.Rol}</p>
                    )}
                  </div>

                  {/* Permisos */}
                  <div className="md:col-span-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Vistas Permitidas
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-40 md:max-h-64 overflow-y-auto border border-gray-300 rounded-md p-2 md:p-3 bg-gray-50">
                      {getVistasSistema().map((vista) => (
                        <label key={vista.ID} className="flex items-start space-x-2 text-xs md:text-sm p-2 hover:bg-white rounded border border-transparent hover:border-gray-200 transition-colors">
                          <input
                            type="checkbox"
                            checked={selectedPermissions.includes(vista.ID)}
                            onChange={(e) => handlePermissionChange(vista.ID, e.target.checked)}
                            className="h-3 w-3 md:h-4 md:w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-0.5 flex-shrink-0"
                          />
                          <div className="flex flex-col min-w-0">
                            <span className="text-gray-700 font-medium truncate">{vista.Nombre}</span>
                            <span className="text-xs text-gray-500 truncate">{vista.Ruta}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Selecciona las vistas que este usuario puede acceder
                    </p>
                  </div>

                  {/* Estados */}
                  <div className="md:col-span-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.Activo}
                          onChange={(e) => setFormData({...formData, Activo: e.target.checked})}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">Usuario Activo</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.Bloqueado}
                          onChange={(e) => setFormData({...formData, Bloqueado: e.target.checked})}
                          className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">Usuario Bloqueado</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Botones */}
                <div className="flex flex-col sm:flex-row justify-between space-y-2 sm:space-y-0 pt-3 md:pt-4 flex-shrink-0">
                  {/* Botón eliminar - Solo cuando se está editando */}
                  {editingUser && (
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm('¿Estás seguro de que quieres eliminar este usuario?')) {
                          handleDelete(editingUser.IDUS);
                          closeModal();
                        }
                      }}
                      className="w-full sm:w-auto px-4 py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 flex items-center justify-center gap-2"
                    >
                      <TrashIcon className="h-4 w-4" />
                      Eliminar Usuario
                    </button>
                  )}
                  
                  {/* Botones principales */}
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="w-full sm:w-auto px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      {editingUser ? 'Actualizar' : 'Crear'} Usuario
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GestionUsuarios;
