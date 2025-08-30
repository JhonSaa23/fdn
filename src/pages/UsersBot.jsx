import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Alert from '../components/Alert';
import axiosClient from '../services/axiosClient';

const UsersBot = () => {
  const [users, setUsers] = useState([]);
  const [laboratorios, setLaboratorios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [alert, setAlert] = useState(null);
  const [filters, setFilters] = useState({
    codUserBot: '',
    nombre: '',
    numero: '',
    rol: '',
    laboratorio: '',
    activo: ''
  });

  const [formData, setFormData] = useState({
    codUserBot: '',
    nombre: '',
    numero: '',
    rol: 'USER',
    laboratorio: '',
    activo: true
  });

  // Cargar datos iniciales
  useEffect(() => {
    cargarUsuarios();
    cargarLaboratorios();
  }, []);

  const cargarUsuarios = async () => {
    try {
      setLoading(true);
      const response = await axiosClient.get('/usersbot');
      if (response.data.success) {
        setUsers(response.data.data);
      }
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      mostrarAlerta('error', 'Error al cargar usuarios del bot');
    } finally {
      setLoading(false);
    }
  };

  const cargarLaboratorios = async () => {
    try {
      const response = await axiosClient.get('/usersbot/laboratorios/list');
      if (response.data.success) {
        setLaboratorios(response.data.data);
      }
    } catch (error) {
      console.error('Error al cargar laboratorios:', error);
    }
  };

  const mostrarAlerta = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const limpiarFormulario = () => {
    setFormData({
      codUserBot: '',
      nombre: '',
      numero: '',
      rol: 'USER',
      laboratorio: '',
      activo: true
    });
    setEditingUser(null);
  };

  const abrirModal = (user = null) => {
    if (user) {
      setFormData({
        codUserBot: user.CodUserBot,
        nombre: user.Nombre,
        numero: user.Numero,
        rol: user.Rol,
        laboratorio: user.Laboratorio || '',
        activo: user.Activo
      });
      setEditingUser(user);
    } else {
      limpiarFormulario();
    }
    setShowModal(true);
  };

  const cerrarModal = () => {
    setShowModal(false);
    limpiarFormulario();
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
        // Actualizar usuario
        await axiosClient.put(`/usersbot/${editingUser.CodUserBot}`, {
          ...formData,
          modificadoPor: 'Admin'
        });
        mostrarAlerta('success', 'Usuario actualizado exitosamente');
      } else {
        // Crear usuario
        await axiosClient.post('/usersbot', {
          ...formData,
          creadoPor: 'Admin'
        });
        mostrarAlerta('success', 'Usuario creado exitosamente');
      }
      
      cerrarModal();
      cargarUsuarios();
    } catch (error) {
      console.error('Error al guardar usuario:', error);
      const message = error.response?.data?.message || 'Error al guardar usuario';
      mostrarAlerta('error', message);
    }
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`¿Estás seguro de que quieres desactivar a ${user.Nombre}?`)) {
      return;
    }

    try {
              await axiosClient.delete(`/usersbot/${user.CodUserBot}`, {
        data: { modificadoPor: 'Admin' }
      });
      mostrarAlerta('success', 'Usuario desactivado exitosamente');
      cargarUsuarios();
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      mostrarAlerta('error', 'Error al eliminar usuario');
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

  const filtrarUsuarios = () => {
    return users.filter(user => {
      return (
        user.CodUserBot.toLowerCase().includes(filters.codUserBot.toLowerCase()) &&
        user.Nombre.toLowerCase().includes(filters.nombre.toLowerCase()) &&
        user.Numero.includes(filters.numero) &&
        (filters.rol === '' || user.Rol === filters.rol) &&
        (filters.laboratorio === '' || user.Laboratorio === filters.laboratorio) &&
        (filters.activo === '' || user.Activo.toString() === filters.activo)
      );
    });
  };

  const usuariosFiltrados = filtrarUsuarios();

  const getRolColor = (rol) => {
    switch (rol) {
      case 'ADMIN': return 'bg-red-100 text-red-800';
      case 'USER': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEstadoColor = (activo) => {
    return activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  return (
    <div className="container mx-auto px-4 py-6">
      {alert && (
        <Alert variant={alert.type} onClose={() => setAlert(null)} dismissible>
          {alert.message}
        </Alert>
      )}

      <Card>
        <Card.Header>
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Usuarios del Bot</h2>
            <Button onClick={() => abrirModal()} variant="primary">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Agregar Usuario
            </Button>
          </div>
        </Card.Header>

        <Card.Body>
          {/* Filtros */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Código</label>
                <input
                  type="text"
                  name="codUserBot"
                  value={filters.codUserBot}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Buscar por código..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input
                  type="text"
                  name="nombre"
                  value={filters.nombre}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Buscar por nombre..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Número</label>
                <input
                  type="text"
                  name="numero"
                  value={filters.numero}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Buscar por número..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                <select
                  name="rol"
                  value={filters.rol}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todos los roles</option>
                  <option value="ADMIN">Administrador</option>
                  <option value="USER">Usuario</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Laboratorio</label>
                <select
                  name="laboratorio"
                  value={filters.laboratorio}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todos los laboratorios</option>
                  {laboratorios.map((lab, index) => (
                    <option key={index} value={lab}>{lab}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                <select
                  name="activo"
                  value={filters.activo}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todos</option>
                  <option value="true">Activo</option>
                  <option value="false">Inactivo</option>
                </select>
              </div>
            </div>
            
            <div className="mt-3 flex justify-end">
              <Button onClick={limpiarFiltros} variant="secondary" size="sm">
                Limpiar Filtros
              </Button>
            </div>
          </div>

          {/* Tabla */}
          {loading ? (
            <div className="flex justify-center items-center py-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Código
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuario
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Número
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rol
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Laboratorio
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha Creación
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {usuariosFiltrados.map((user) => (
                    <tr key={user.CodUserBot} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{user.CodUserBot}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{user.Nombre}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.Numero}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRolColor(user.Rol)}`}>
                          {user.RolDescripcion}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.Laboratorio || '-'}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEstadoColor(user.Activo)}`}>
                          {user.EstadoDescripcion}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(user.FechaCreacion).toLocaleDateString('es-ES')}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Button
                            onClick={() => abrirModal(user)}
                            variant="secondary"
                            size="sm"
                          >
                            Editar
                          </Button>
                          {user.Activo && (
                            <Button
                              onClick={() => handleDelete(user)}
                              variant="danger"
                              size="sm"
                            >
                              Desactivar
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {usuariosFiltrados.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No se encontraron usuarios que coincidan con los filtros
                </div>
              )}
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Modal para crear/editar usuario */}
      <Modal isOpen={showModal} onClose={cerrarModal} title={editingUser ? 'Editar Usuario' : 'Agregar Usuario'} size="lg">
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre *
              </label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nombre completo"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Código de Usuario *
              </label>
              <input
                type="text"
                name="codUserBot"
                value={formData.codUserBot}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Código identificador del usuario"
              />
              <p className="text-xs text-gray-500 mt-1">Código único que identifica al usuario (ej: USER001, ADMIN002)</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número de Teléfono *
              </label>
              <input
                type="text"
                name="numero"
                value={formData.numero}
                onChange={handleInputChange}
                required
                pattern="[0-9]{11}"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="51912345678 (11 dígitos)"
              />
              <p className="text-xs text-gray-500 mt-1">Formato: 11 dígitos sin espacios ni guiones</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rol *
              </label>
              <select
                name="rol"
                value={formData.rol}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="USER">Usuario</option>
                <option value="ADMIN">Administrador</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Laboratorio
              </label>
              <input
                type="text"
                name="laboratorio"
                value={formData.laboratorio}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nombre del laboratorio (opcional)"
              />
            </div>

            {editingUser && (
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="activo"
                    checked={formData.activo}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">Usuario activo</span>
                </label>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <Button type="button" onClick={cerrarModal} variant="secondary">
              Cancelar
            </Button>
            <Button type="submit" variant="primary">
              {editingUser ? 'Actualizar' : 'Crear'} Usuario
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default UsersBot;
