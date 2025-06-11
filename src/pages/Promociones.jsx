import React, { useState, useEffect } from 'react';
import { useNotification } from '../App';
import { consultarPromociones, crearPromocion, actualizarPromocion, eliminarPromocion } from '../services/api';
import { 
  ArrowLeftIcon,
  PencilIcon, 
  TrashIcon,
  PlusIcon,
  FunnelIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import Card from '../components/Card';
import Button from '../components/Button';

// Nueva lista de tipificaciones/negocios
const TIPIFICACIONES = {
  "1": "Farmacia Independiente",
  "2": "Mayorista",
  "3": "Minicadenas",
  "4": "Sub-Distribuidores",
  "5": "Institución",
  "6": "Cadena Regional",
  "7": "Farmacias Regulares",
  "8": "Clinicas",
  "9": "Mayorista",
  "10": "Farmacias Tops"
};

// Función auxiliar para manejar strings de manera segura
const safeString = (value) => {
  return value ? String(value).trim() : '';
};

const Promociones = () => {
  const { showNotification } = useNotification();
  const [promociones, setPromociones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingPromocion, setEditingPromocion] = useState(null);

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

  // Cargar promociones
  const cargarPromociones = async () => {
    try {
      setLoading(true);
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

  useEffect(() => {
    cargarPromociones();
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
    cargarPromociones();
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
        showNotification('success', 'Promoción actualizada exitosamente');
      } else {
        await crearPromocion({
          tipificacion: tipificacionStr,
          codpro: codproStr,
          desde,
          porcentaje
        });
        showNotification('success', 'Promoción creada exitosamente');
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
        showNotification('success', 'Promoción eliminada exitosamente');
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

  // Filtrar promociones en tiempo real por nombre de producto
  const promocionesFiltradas = Array.isArray(promociones)
    ? (filtroNombreProducto
        ? promociones.filter(e => (e.nombreProducto || '').toLowerCase().includes(filtroNombreProducto.toLowerCase()))
        : promociones)
    : [];

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
                type="button"
                variant="success"
                onClick={() => {
                  setEditingPromocion(null);
                  setFormData({
                    tipificacion: '',
                    codpro: '',
                    desde: '',
                    porcentaje: ''
                  });
                  setShowForm(true);
                }}
              >
                Agregar
              </Button>
            </div>
          </div>
          <form className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-4 gap-y-4">
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
                  {Object.entries(TIPIFICACIONES).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
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
                  Nombre de producto
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
        <div className="overflow-x-auto max-h-[calc(100vh-300px)]">
          <div className="min-w-full inline-block align-middle">
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipi</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CodPro</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre del Producto</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo de Negocio</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Desde</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Porcentaje</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider sticky right-0 bg-gray-50 z-20 shadow-[-2px_0_4px_rgba(0,0,0,0.1)]">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-4 text-center">
                        Cargando...
                      </td>
                    </tr>
                  ) : promocionesFiltradas.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-4 text-center">
                        No hay datos disponibles
                      </td>
                    </tr>
                  ) : (
                    promocionesFiltradas.map((promocion, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          {promocion.tipificacion}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {promocion.codpro}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {promocion.nombreProducto || ''}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {TIPIFICACIONES[promocion.tipificacion] || promocion.tipificacion}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {promocion.desde}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {editingPromocion ? 'Editar Promoción' : 'Nueva Promoción'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingPromocion(null);
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    setEditingPromocion(null);
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  {editingPromocion ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Promociones; 