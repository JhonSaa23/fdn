import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import Alert from '../components/Alert';
import Button from '../components/Button';
import axiosClient from '../services/axiosClient';
import ConfirmModal from '../components/ConfirmModal';

const UsersBot = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, user: null });
  const [alert, setAlert] = useState(null);
  const [laboratorios, setLaboratorios] = useState([]);
  
  const [filters, setFilters] = useState({
    codUserBot: '',
    nombre: '',
    numero: '',
    rol: '',
    laboratorio: '',
    activo: ''
  });

  const [formData, setFormData] = useState({
    nombre: '',
    codUserBot: '',
    numero: '',
    rol: 'REPRESENTANTE',
    laboratorio: '',
    activo: true
  });

  useEffect(() => {
    fetchUsuarios();
    fetchLaboratorios();
  }, []);

  const fetchUsuarios = async () => {
    try {
      setLoading(true);
      console.log('🔍 Iniciando fetchUsuarios...');
      const response = await axiosClient.get('/usersbot');
      console.log('📡 Response completa:', response);
      console.log('📊 Response.data:', response.data);
      setUsuarios(response.data.data); // Extraer solo el array de usuarios
      console.log('✅ Usuarios establecidos:', response.data.data);
    } catch (error) {
      console.error('❌ Error al obtener usuarios:', error);
      console.error('❌ Error.response:', error.response);
      console.error('❌ Error.message:', error.message);
      setAlert({ type: 'danger', message: 'Error al obtener usuarios' });
    } finally {
      setLoading(false);
      console.log('🏁 Loading terminado');
    }
  };

  const fetchLaboratorios = async () => {
    try {
      console.log('🔍 Iniciando fetchLaboratorios...');
      const response = await axiosClient.get('/laboratorios');
      console.log('📡 Response laboratorios:', response);
      console.log('📊 Laboratorios.data:', response.data);
      setLaboratorios(response.data.data); // Extraer solo el array de laboratorios
      console.log('✅ Laboratorios establecidos:', response.data.data);
    } catch (error) {
      console.error('❌ Error al obtener laboratorios:', error);
      console.error('❌ Error.response:', error.response);
      console.error('❌ Error.message:', error.message);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const limpiarFiltros = () => {
    setFilters({
      codUserBot: '',
      nombre: '',
      numero: '',
      rol: '',
      laboratorio: '',
      activo: ''
    });
  };

  const abrirModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        nombre: user.Nombre,
        codUserBot: user.CodUserBot,
        numero: user.Numero,
        rol: user.Rol,
        laboratorio: user.Laboratorio || '',
        activo: user.Activo
      });
    } else {
      setEditingUser(null);
      setFormData({
        nombre: '',
        codUserBot: '',
        numero: '',
        rol: 'REPRESENTANTE',
        laboratorio: '',
        activo: true
      });
    }
    setShowModal(true);
  };

  const cerrarModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setFormData({
      nombre: '',
      codUserBot: '',
      numero: '',
      rol: 'REPRESENTANTE',
      laboratorio: '',
      activo: true
    });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await axiosClient.put(`/usersbot/${editingUser.CodUserBot}`, formData);
        setAlert({ type: 'success', message: 'Usuario actualizado exitosamente' });
      } else {
        await axiosClient.post('/usersbot', formData);
        setAlert({ type: 'success', message: 'Usuario creado exitosamente' });
      }
      cerrarModal();
      fetchUsuarios();
    } catch (error) {
      console.error('Error al guardar usuario:', error);
      setAlert({ type: 'danger', message: 'Error al guardar usuario' });
    }
  };

  const handleDeactivate = async (user) => {
    try {
      await axiosClient.patch(`/usersbot/${user.CodUserBot}/deactivate`);
      setAlert({ type: 'success', message: 'Usuario desactivado exitosamente' });
      fetchUsuarios();
    } catch (error) {
      console.error('Error al desactivar usuario:', error);
      setAlert({ type: 'danger', message: 'Error al desactivar usuario' });
    }
  };

  const handleActivate = async (user) => {
    try {
      await axiosClient.patch(`/usersbot/${user.CodUserBot}/activate`);
      setAlert({ type: 'success', message: 'Usuario reactivado exitosamente' });
      fetchUsuarios();
    } catch (error) {
      console.error('Error al reactivar usuario:', error);
      setAlert({ type: 'danger', message: 'Error al reactivar usuario' });
    }
  };

  const handleDelete = (user) => {
    setConfirmModal({ isOpen: true, user });
  };

  const closeConfirmModal = () => {
    setConfirmModal({ isOpen: false, user: null });
  };

  const handleConfirmDelete = async () => {
    try {
      await axiosClient.delete(`/usersbot/${confirmModal.user.CodUserBot}`);
      setAlert({ type: 'success', message: 'Usuario eliminado exitosamente' });
      closeConfirmModal();
      fetchUsuarios();
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      setAlert({ type: 'danger', message: 'Error al eliminar usuario' });
    }
  };

  const getRolColor = (rol) => {
    switch (rol) {
      case 'ADMIN': return 'bg-purple-100 text-purple-800';
      case 'REPRESENTANTE': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEstadoColor = (activo) => {
    return activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const usuariosFiltrados = Array.isArray(usuarios) ? usuarios.filter(user => {
    return (
      user.CodUserBot.toLowerCase().includes(filters.codUserBot.toLowerCase()) &&
      user.Nombre.toLowerCase().includes(filters.nombre.toLowerCase()) &&
      user.Numero.includes(filters.numero) &&
      (filters.rol === '' || user.Rol === filters.rol) &&
      (filters.laboratorio === '' || user.Laboratorio === filters.laboratorio) &&
      (filters.activo === '' || user.Activo.toString() === filters.activo)
    );
  }) : [];

  // Debug logs
  console.log('🔍 Estado actual:');
  console.log('📊 usuarios:', usuarios);
  console.log('📊 usuariosFiltrados:', usuariosFiltrados);
  console.log('📊 loading:', loading);
  console.log('📊 laboratorios:', laboratorios);

  return (
    <div className="w-full px-0 sm:px-4 py-3 sm:py-6">
      {alert && (
        <Alert variant={alert.type} onClose={() => setAlert(null)} dismissible>
          {alert.message}
        </Alert>
      )}

      <Card>
        <Card.Header>
          <div className="flex sm:flex-row justify-between items-start sm:items-center gap-3">
            <h2 className="text-lg font-medium text-gray-800">Users del Bot</h2>
            <div className="flex gap-2">
              <button 
                onClick={limpiarFiltros} 
                className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors font-bold"
              >
                Limpiar
              </button>
              <button 
                onClick={() => abrirModal()} 
                className="px-3 py-1.5 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors font-bold"
              >
                Agregar
              </button>
            </div>
          </div>
        </Card.Header>

        <Card.Body className="p-0 sm:p-6">
          {/* Filtros compactos */}
          <div className="p-2 sm:p-3 bg-gray-50 sm:rounded">
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2">
              <input
                type="text"
                name="codUserBot"
                value={filters.codUserBot}
                onChange={handleFilterChange}
                className="px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:border-blue-300"
                placeholder="Código"
              />
              
              <input
                type="text"
                name="nombre"
                value={filters.nombre}
                onChange={handleFilterChange}
                className="px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:border-blue-300"
                placeholder="Nombre"
              />
              
              <input
                type="text"
                name="numero"
                value={filters.numero}
                onChange={handleFilterChange}
                className="px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:border-blue-300"
                placeholder="Número"
              />
              
              <select
                name="rol"
                value={filters.rol}
                onChange={handleFilterChange}
                className="px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:border-blue-300"
              >
                <option value="">Rol</option>
                <option value="ADMIN">Admin</option>
                <option value="REPRESENTANTE">Rep</option>
              </select>
              
              <select
                name="laboratorio"
                value={filters.laboratorio}
                onChange={handleFilterChange}
                className="px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:border-blue-300"
              >
                <option value="">Lab</option>
                {Array.isArray(laboratorios) && laboratorios.map((lab, index) => (
                  <option key={index} value={lab.codlab || lab}>{lab.Descripcion || lab}</option>
                ))}
              </select>
              
              <select
                name="activo"
                value={filters.activo}
                onChange={handleFilterChange}
                className="px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:border-blue-300"
              >
                <option value="">Estado</option>
                <option value="true">Activo</option>
                <option value="false">Inactivo</option>
              </select>
            </div>
          </div>

          {/* Vista Desktop - Tabla */}
          <div className="hidden md:block">
            {loading ? (
              <div className="flex justify-center items-center py-6">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Usuario
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Código
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Número
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rol
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Lab
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha Creación
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {usuariosFiltrados.map((user) => (
                      <tr key={user.CodUserBot}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{user.Nombre}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 font-mono">{user.CodUserBot}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{user.Numero}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRolColor(user.Rol)}`}>
                            {user.Rol === 'ADMIN' ? 'Administrador' : 'Representante'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{user.Laboratorio || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getEstadoColor(user.Activo)}`}>
                            {user.Activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {new Date(user.FechaCreacion).toLocaleDateString('es-ES')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="relative">
                            <button
                              onClick={() => setConfirmModal({ isOpen: true, user, action: 'menu' })}
                              className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
                            >
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Vista Móvil - Cards */}
          <div className="md:hidden">
            {loading ? (
              <div className="flex justify-center items-center py-6">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="space-y-0">
                {usuariosFiltrados.map((user) => (
                  <div key={user.CodUserBot} className="bg-white border-b border-gray-200 p-4">
                    {/* Nombre del usuario - Primera fila completa */}
                    <div className="mb-3">
                      <div className="text-base font-semibold text-gray-900">{user.Nombre}</div>
                    </div>

                    {/* Segunda fila - Código, Rol y Estado */}
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono font-medium text-gray-700">
                          {user.CodUserBot}
                        </span>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRolColor(user.Rol)}`}>
                          {user.Rol === 'ADMIN' ? 'Administrador' : 'Representante'}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getEstadoColor(user.Activo)}`}>
                          {user.Activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                    </div>

                    {/* Tercera fila - Información adicional */}
                    <div className="mb-3 text-xs text-gray-500">
                      <div>Número: {user.Numero}</div>
                      {user.Laboratorio && (
                        <div>Lab: {user.Laboratorio}</div>
                      )}
                      <div>Fecha: {new Date(user.FechaCreacion).toLocaleDateString('es-ES')}</div>
                    </div>

                    {/* Botones de acción */}
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                      <button
                        onClick={() => abrirModal(user)}
                        className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
                      >
                        Editar
                      </button>
                      {user.Activo ? (
                        <button
                          onClick={() => handleDeactivate(user)}
                          className="px-3 py-1.5 text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-700 rounded transition-colors"
                        >
                          Desactivar
                        </button>
                      ) : (
                        <button
                          onClick={() => handleActivate(user)}
                          className="px-3 py-1.5 text-xs bg-green-100 hover:bg-green-200 text-green-700 rounded transition-colors"
                        >
                          Reactivar
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(user)}
                        className="px-3 py-1.5 text-xs bg-red-100 hover:bg-red-300 text-red-700 rounded transition-colors"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
                
                {usuariosFiltrados.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No se encontraron usuarios que coincidan con los filtros
                  </div>
                )}
              </div>
            )}
          </div>
        </Card.Body>
      </Card>

      {/* Modal personalizado para crear/editar usuario */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* Overlay */}
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={cerrarModal} />
            
            {/* Modal */}
            <div className="inline-block w-full max-w-2xl p-6 my-8 text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl relative">
              {/* Header personalizado con X */}
              <div className="relative">
                <button
                  onClick={cerrarModal}
                  className="absolute top-0 right-0 p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200 rounded-full hover:bg-gray-100 z-10"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                
                <div className="text-center mb-6">
                  <div className="mx-auto flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-3">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {editingUser ? 'Editar Usuario' : 'Agregar Nuevo Usuario'}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {editingUser ? 'Modifica la información del usuario seleccionado' : 'Completa los datos para crear un nuevo usuario'}
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Columna Izquierda */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <span className="text-red-500">*</span> Nombre Completo
                      </label>
                      <input
                        type="text"
                        name="nombre"
                        value={formData.nombre}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="Ej: Juan Pérez García"
                      />
                      <p className="text-xs text-gray-500 mt-2 flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        Nombre completo del usuario del bot
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <span className="text-red-500">*</span> Código de Usuario
                      </label>
                      <input
                        type="text"
                        name="codUserBot"
                        value={formData.codUserBot}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="Ej: USER001, ADMIN002"
                      />
                      <p className="text-xs text-gray-500 mt-2 flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        Código único que identifica al usuario
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <span className="text-red-500">*</span> Número de Teléfono
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          name="numero"
                          value={formData.numero}
                          onChange={handleInputChange}
                          required
                          pattern="[0-9]{11}"
                          className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                          placeholder="51912345678"
                        />
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2 flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        11 dígitos sin espacios ni guiones
                      </p>
                    </div>
                  </div>

                  {/* Columna Derecha */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <span className="text-red-500">*</span> Rol del Usuario
                      </label>
                      <div className="relative">
                        <select
                          name="rol"
                          value={formData.rol}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none bg-white"
                        >
                          <option value="">Selecciona un rol</option>
                          <option value="REPRESENTANTE">Representante</option>
                          <option value="ADMIN">Administrador</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2 flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        Define los permisos y funcionalidades del usuario
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Laboratorio (Opcional)
                      </label>
                      <input
                        type="text"
                        name="laboratorio"
                        value={formData.laboratorio}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="Ej: Lab Central, Sucursal Norte"
                      />
                      <p className="text-xs text-gray-500 mt-2 flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        Laboratorio o sucursal asignada al usuario
                      </p>
                    </div>

                    {editingUser && (
                      <div className="pt-4">
                        <div 
                          className="flex items-center p-4 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 cursor-pointer transition-colors"
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              activo: !prev.activo
                            }));
                          }}
                        >
                          <input
                            type="checkbox"
                            name="activo"
                            checked={formData.activo}
                            onChange={(e) => {
                              setFormData(prev => ({
                                ...prev,
                                activo: e.target.checked
                              }));
                            }}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
                          />
                          <div className="ml-3 flex-1">
                            <label className="text-sm font-semibold text-gray-700 cursor-pointer">
                              Usuario Activo
                            </label>
                            <p className="text-xs text-gray-500 mt-1">
                              Marca esta casilla para activar el usuario en el sistema
                            </p>
                          </div>
                          <div className="ml-2">
                            <svg className={`w-5 h-5 transition-colors ${formData.activo ? 'text-green-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={formData.activo ? "M5 13l4 4L19 7" : "M6 18L18 6M6 6l12 12"} />
                            </svg>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={cerrarModal}
                    className="px-6 py-3 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center gap-2"
                  >
                    {editingUser ? (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        Actualizar Usuario
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Crear Usuario
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de menú de acciones */}
      {confirmModal.isOpen && confirmModal.action === 'menu' && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* Overlay */}
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={closeConfirmModal} />
            
            {/* Modal de menú */}
            <div className="inline-block w-full max-w-sm p-0 my-8 text-left align-middle transition-all transform bg-white shadow-xl rounded-lg relative">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Acciones para {confirmModal.user?.Nombre}
                </h3>
              </div>
              
              <div className="py-2">
                <button
                  onClick={() => {
                    closeConfirmModal();
                    abrirModal(confirmModal.user);
                  }}
                  className="w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                >
                  <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Editar Usuario
                </button>
                
                {confirmModal.user?.Activo ? (
                  <button
                    onClick={() => {
                      closeConfirmModal();
                      handleDeactivate(confirmModal.user);
                    }}
                    className="w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                  >
                    <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                    Desactivar Usuario
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      closeConfirmModal();
                      handleActivate(confirmModal.user);
                    }}
                    className="w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                  >
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Reactivar Usuario
                  </button>
                )}
                
                <button
                  onClick={() => {
                    closeConfirmModal();
                    setConfirmModal({ isOpen: true, user: confirmModal.user, action: 'delete' });
                  }}
                  className="w-full px-4 py-3 text-left text-red-600 hover:bg-red-50 flex items-center gap-3"
                >
                  <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Eliminar Usuario
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación para eliminar */}
      {confirmModal.isOpen && confirmModal.action === 'delete' && (
        <ConfirmModal
          isOpen={true}
          onClose={closeConfirmModal}
          onConfirm={handleConfirmDelete}
          title="¿Eliminar usuario?"
          message={`¿Estás seguro de eliminar a ${confirmModal.user?.Nombre}? Puedes desactivarlo en su lugar.`}
          confirmText="Eliminar"
          cancelText="Cancelar"
        />
      )}
    </div>
  );
};

export default UsersBot;
