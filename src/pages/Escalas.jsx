import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNotification } from '../App';
import { axiosConfig } from '../config';
import { 
  ArrowLeftIcon,
  PencilIcon, 
  TrashIcon,
  PlusIcon,
  FunnelIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

// Configurar axios con la URL base
const api = axios.create(axiosConfig);

// Mapeo de tipificaciones
const TIPIFICACIONES = {
  "1": "Farmacia Independiente",
  "2": "Clínica o Institución",
  "3": "Minicadenas",
  "4": "Mayorista",
  "5": "Otros"
};

// Función auxiliar para manejar strings de manera segura
const safeString = (value) => {
  return value ? String(value).trim() : '';
};

const Escalas = () => {
  const { showNotification } = useNotification();
  const [escalas, setEscalas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingEscala, setEditingEscala] = useState(null);

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

  // Cargar escalas
  const cargarEscalas = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      // Solo agregar los filtros que tengan valor
      if (filtros.tipificacion) {
        params.append('tipificacion', filtros.tipificacion);
      }
      if (filtros.codpro) {
        params.append('codpro', filtros.codpro);
      }
      if (filtros.desde) {
        params.append('desde', filtros.desde);
      }
      if (filtros.porcentaje) {
        params.append('porcentaje', filtros.porcentaje);
      }
      
      const response = await api.get(`/api/escalas?${params.toString()}`);
      setEscalas(response.data);
    } catch (error) {
      console.error('Error al cargar las escalas:', error);
      let mensaje = 'Error al cargar las escalas';
      if (error.response) {
        mensaje = error.response.data.error || mensaje;
      }
      showNotification('error', mensaje);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarEscalas();
  }, []);

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
    cargarEscalas();
  };

  const handleLimpiar = () => {
    setFiltros({
      tipificacion: '',
      codpro: '',
      desde: '',
      porcentaje: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Validación básica
      if (!formData.tipificacion || !formData.codpro || !formData.desde || !formData.porcentaje) {
        showNotification('error', 'Todos los campos son obligatorios');
        return;
      }

      // Validar números
      const desde = parseFloat(formData.desde);
      const porcentaje = parseFloat(formData.porcentaje);
      
      if (isNaN(desde) || isNaN(porcentaje)) {
        showNotification('error', 'Los campos "desde" y "porcentaje" deben ser números válidos');
        return;
      }

      if (editingEscala) {
        await api.put('/api/escalas', {
          tipificacionOld: editingEscala.tipificacion,
          codproOld: editingEscala.codpro,
          desdeOld: editingEscala.desde,
          porcentajeOld: editingEscala.porcentaje,
          tipificacionNew: safeString(formData.tipificacion),
          codproNew: safeString(formData.codpro),
          desdeNew: desde,
          porcentajeNew: porcentaje
        });
        showNotification('success', 'Escala actualizada exitosamente');
      } else {
        await api.post('/api/escalas', {
          tipificacion: safeString(formData.tipificacion),
          codpro: safeString(formData.codpro),
          desde: desde,
          porcentaje: porcentaje
        });
        showNotification('success', 'Escala creada exitosamente');
      }
      
      setShowForm(false);
      setEditingEscala(null);
      setFormData({
        tipificacion: '',
        codpro: '',
        desde: '',
        porcentaje: ''
      });
      cargarEscalas();
    } catch (error) {
      console.error('Error detallado:', error);
      let mensaje = 'Error al guardar la escala';
      
      if (error.response) {
        const { status, data } = error.response;
        
        if (status === 409) {
          mensaje = 'Ya existe una escala con estos valores';
          if (data.details) {
            mensaje = data.details;
          }
        } else if (data.error) {
          mensaje = data.error;
          if (data.details) {
            mensaje += `: ${data.details}`;
          }
        }
      }
      
      showNotification('error', mensaje);
    }
  };

  const handleEdit = (escala) => {
    setEditingEscala(escala);
    setFormData({
      tipificacion: escala.tipificacion || '',
      codpro: escala.codpro || '',
      desde: escala.desde?.toString() || '',
      porcentaje: escala.porcentaje?.toString() || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (escala) => {
    if (window.confirm('¿Está seguro de eliminar esta escala?')) {
      try {
        await api.delete('/api/escalas', { 
          data: {
            tipificacion: safeString(escala.tipificacion),
            codpro: safeString(escala.codpro),
            desde: escala.desde,
            porcentaje: escala.porcentaje
          }
        });
        showNotification('success', 'Escala eliminada exitosamente');
        cargarEscalas();
      } catch (error) {
        console.error('Error al eliminar la escala:', error);
        let mensaje = 'Error al eliminar la escala';
        if (error.response) {
          mensaje = error.response.data.error || mensaje;
        }
        showNotification('error', mensaje);
      }
    }
  };

  return (
    <div className="container mx-auto p-4">
      {/* Encabezado */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Consulta </h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleLimpiar}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg"
          >
            Limpiar
          </button>
          <button
            onClick={handleConsultar}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg"
          >
            Consultar
          </button>
          <button
            onClick={() => {
              setEditingEscala(null);
              setFormData({
                tipificacion: '',
                codpro: '',
                desde: '',
                porcentaje: ''
              });
              setShowForm(true);
            }}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Agregar
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Negocio
            </label>
            <select
              name="tipificacion"
              value={filtros.tipificacion}
              onChange={handleFilterChange}
              className="w-full p-2 border rounded-md"
            >
              <option value="">Todos</option>
              {Object.entries(TIPIFICACIONES).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              CodPro
            </label>
            <input
              type="text"
              name="codpro"
              value={filtros.codpro}
              onChange={handleFilterChange}
              className="w-full p-2 border rounded-md"
              placeholder="Ej: 000-000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Desde
            </label>
            <input
              type="number"
              name="desde"
              value={filtros.desde}
              onChange={handleFilterChange}
              className="w-full p-2 border rounded-md"
              step="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Porcentaje
            </label>
            <input
              type="number"
              name="porcentaje"
              value={filtros.porcentaje}
              onChange={handleFilterChange}
              className="w-full p-2 border rounded-md"
              step="0"
            />
          </div>
        </div>
      </div>

      {/* Formulario Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {editingEscala ? 'Editar Escala' : 'Nueva Escala'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingEscala(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Negocio
                  </label>
                  <select
                    name="tipificacion"
                    value={formData.tipificacion}
                    onChange={handleInputChange}
                    required
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="">Seleccione un tipo</option>
                    {Object.entries(TIPIFICACIONES).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Código de Producto
                  </label>
                  <input
                    type="text"
                    name="codpro"
                    value={formData.codpro}
                    onChange={handleInputChange}
                    required
                    className="w-full p-2 border rounded-md"
                  />
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
                    required
                    step="0"
                    className="w-full p-2 border rounded-md"
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
                    required
                    step="0"
                    className="w-full p-2 border rounded-md"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingEscala(null);
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  {editingEscala ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tabla */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tipi
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tipo de Negocio
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                CodPro
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Desde
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Porcentaje
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center">
                  Cargando...
                </td>
              </tr>
            ) : escalas.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center">
                  No hay datos disponibles
                </td>
              </tr>
            ) : (
              escalas.map((escala, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {escala.tipificacion}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {TIPIFICACIONES[escala.tipificacion] || escala.tipificacion}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {escala.codpro}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {escala.desde}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {escala.porcentaje}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(escala)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <PencilIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(escala)}
                        className="text-red-600 hover:text-red-900"
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
  );
};

export default Escalas; 