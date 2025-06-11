import React, { useState, useEffect } from 'react';
import { useNotification } from '../App';
import { consultarEscalas, obtenerLaboratorios, actualizarEscala, eliminarEscala } from '../services/api';
import { 
  PencilIcon, 
  TrashIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import Card from '../components/Card';
import Button from '../components/Button';

const Escalas = () => {
  const { showNotification } = useNotification();
  const [escalas, setEscalas] = useState([]);
  const [laboratorios, setLaboratorios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingEscala, setEditingEscala] = useState(null);

  // Estados para filtros
  const [filtros, setFiltros] = useState({
    laboratorio: '',
    codpro: '',
    nombreProducto: ''
  });

  // Estados para el formulario de edición
  const [formData, setFormData] = useState({
    rango1: '',
    des11: '',
    des12: '',
    des13: '',
    rango2: '',
    des21: '',
    des22: '',
    des23: '',
    rango3: '',
    des31: '',
    des32: '',
    des33: '',
    rango4: '',
    des41: '',
    des42: '',
    des43: '',
    rango5: '',
    des51: '',
    des52: '',
    des53: ''
  });

  // Estados para escalas filtradas localmente
  const [escalasOriginales, setEscalasOriginales] = useState([]);
  const [escalasFiltradasLocal, setEscalasFiltradasLocal] = useState([]);

  // Cargar laboratorios al montar el componente
  useEffect(() => {
    cargarLaboratorios();
  }, []);

  // Filtro en tiempo real para nombre de producto
  useEffect(() => {
    if (filtros.nombreProducto.trim() === '') {
      setEscalasFiltradasLocal(escalasOriginales);
    } else {
      const filtradas = escalasOriginales.filter(escala =>
        escala.Nombre.toLowerCase().includes(filtros.nombreProducto.toLowerCase())
      );
      setEscalasFiltradasLocal(filtradas);
    }
  }, [filtros.nombreProducto, escalasOriginales]);

  const cargarLaboratorios = async () => {
    try {
      const data = await obtenerLaboratorios();
      setLaboratorios(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error al cargar laboratorios:', error);
      showNotification('error', 'Error al cargar laboratorios');
      setLaboratorios([]);
    }
  };

  const cargarEscalas = async () => {
    try {
      setLoading(true);
      // Solo enviar laboratorio y codpro para la consulta al servidor
      const filtrosServidor = {
        laboratorio: filtros.laboratorio,
        codpro: filtros.codpro
      };
      const data = await consultarEscalas(filtrosServidor);
      const escalasArray = Array.isArray(data) ? data : [];
      setEscalasOriginales(escalasArray);
      setEscalas(escalasArray);
    } catch (error) {
      console.error('Error al cargar escalas:', error);
      let mensaje = 'Error al cargar las escalas';
      if (error.response) {
        mensaje = error.response.data?.error || mensaje;
      }
      showNotification('error', mensaje);
      setEscalasOriginales([]);
      setEscalas([]);
    } finally {
      setLoading(false);
    }
  };

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
      laboratorio: '',
      codpro: '',
      nombreProducto: ''
    });
    setEscalas([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const dataToSend = {
        rango1: parseFloat(formData.rango1) || 0,
        des11: parseFloat(formData.des11) || 0,
        des12: parseFloat(formData.des12) || 0,
        des13: parseFloat(formData.des13) || 0,
        rango2: parseFloat(formData.rango2) || 0,
        des21: parseFloat(formData.des21) || 0,
        des22: parseFloat(formData.des22) || 0,
        des23: parseFloat(formData.des23) || 0,
        rango3: parseFloat(formData.rango3) || 0,
        des31: parseFloat(formData.des31) || 0,
        des32: parseFloat(formData.des32) || 0,
        des33: parseFloat(formData.des33) || 0,
        rango4: parseFloat(formData.rango4) || 0,
        des41: parseFloat(formData.des41) || 0,
        des42: parseFloat(formData.des42) || 0,
        des43: parseFloat(formData.des43) || 0,
        rango5: parseFloat(formData.rango5) || 0,
        des51: parseFloat(formData.des51) || 0,
        des52: parseFloat(formData.des52) || 0,
        des53: parseFloat(formData.des53) || 0
      };

      await actualizarEscala(editingEscala.CodPro, dataToSend);
      showNotification('success', 'Escala actualizada exitosamente');
      setShowForm(false);
      setEditingEscala(null);
      setFormData({
        rango1: '', des11: '', des12: '', des13: '',
        rango2: '', des21: '', des22: '', des23: '',
        rango3: '', des31: '', des32: '', des33: '',
        rango4: '', des41: '', des42: '', des43: '',
        rango5: '', des51: '', des52: '', des53: ''
      });
      cargarEscalas();
    } catch (error) {
      let mensaje = 'Error al actualizar la escala';
      if (error.response) {
        mensaje = error.response.data?.error || mensaje;
      }
      showNotification('error', mensaje);
    }
  };

  const handleEdit = (escala) => {
    setEditingEscala(escala);
    setFormData({
      rango1: escala.Rango1?.toString() || '',
      des11: escala.Des11?.toString() || '',
      des12: escala.des12?.toString() || '',
      des13: escala.des13?.toString() || '',
      rango2: escala.Rango2?.toString() || '',
      des21: escala.des21?.toString() || '',
      des22: escala.des22?.toString() || '',
      des23: escala.des23?.toString() || '',
      rango3: escala.Rango3?.toString() || '',
      des31: escala.des31?.toString() || '',
      des32: escala.des32?.toString() || '',
      des33: escala.des33?.toString() || '',
      rango4: escala.Rango4?.toString() || '',
      des41: escala.des41?.toString() || '',
      des42: escala.des42?.toString() || '',
      des43: escala.des43?.toString() || '',
      rango5: escala.Rango5?.toString() || '',
      des51: escala.des51?.toString() || '',
      des52: escala.des52?.toString() || '',
      des53: escala.des53?.toString() || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (escala) => {
    if (window.confirm(`¿Está seguro de eliminar la escala del producto ${escala.CodPro}?`)) {
      try {
        await eliminarEscala(escala.CodPro);
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
    <>
      {/* Bloque principal: Título, botones y filtros juntos en un solo Card */}
      <Card className="mb-6">
        <Card.Body>
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-xl font-bold">Consulta de Escalas</h1>
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
            </div>
          </div>
          <form className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Laboratorio
                </label>
                <select
                  name="laboratorio"
                  value={filtros.laboratorio}
                  onChange={handleFilterChange}
                  className="block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                >
                  <option value="">Todos</option>
                  {laboratorios.map((lab) => (
                    <option key={lab.CodLab} value={lab.CodLab}>
                      {lab.Descripcion}
                    </option>
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
                  value={filtros.codpro}
                  onChange={handleFilterChange}
                  className="block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  placeholder="Ej: 00-0000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Producto
                </label>
                <input
                  type="text"
                  name="nombreProducto"
                  value={filtros.nombreProducto}
                  onChange={handleFilterChange}
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
                    <th className="pl-6 py-0 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Laboratorio</th>
                    <th className="pl-6 py-0 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                    <th className="pl-6 py-0 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                    <th className="pl-6 py-0 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Rango 1</th>
                    <th className="pl-6 py-0 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Rango 2</th>
                    <th className="pl-6 py-0 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Rango 3</th>
                    <th className="pl-6 py-0 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Rango 4</th>
                    <th className="pl-6 py-0 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Rango 5</th>
                    <th className="px-4 py-0 text-right text-xs font-medium text-gray-500 uppercase tracking-wider sticky right-0 bg-gray-50">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan="9" className="px-6 py-4 text-center">
                        Cargando...
                      </td>
                    </tr>
                  ) : (filtros.nombreProducto ? escalasFiltradasLocal : escalas).length === 0 ? (
                    <tr>
                      <td colSpan="9" className="px-6 py-4 text-center">
                        {filtros.nombreProducto ? 'No se encontraron productos con ese nombre' : 'Seleccione un laboratorio o código '}
                      </td>
                    </tr>
                  ) : (
                    (filtros.nombreProducto ? escalasFiltradasLocal : escalas).map((escala, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="pl-6 py-1 whitespace-nowrap text-sm text-gray-900">{escala.Laboratorio}</td>
                        <td className="pl-6 py-1 whitespace-nowrap text-sm text-gray-900 font-bold ">{escala.CodPro}</td>
                        <td className="pl-6 py-1 whitespace-nowrap text-sm text-gray-900">{escala.Nombre}</td>
                        
                        {/* Rango 1 con descuentos agrupados */}
                        <td className="pl-6 py-1 text-center">
                          <div className="bg-sky-50 border border-sky-200 rounded-lg p-2 min-w-[120px]">
                            
                            <div className="text-xs space-y-1 flex items-baseline gap-2">
                              <div className="flex justify-between bg-white rounded px-2 py-1">
                                <span className="text-gray-600">D1:</span>
                                <span className="font-medium">{escala.Des11 || '0'}</span>
                              </div>
                              <div className="flex justify-between bg-white rounded px-2 py-1">
                                <span className="text-gray-600">D2:</span>
                                <span className="font-medium">{escala.des12 || '0'}</span>
                              </div>
                              <div className="flex justify-between bg-white rounded px-2 py-1">
                                <span className="text-gray-600">D3:</span>
                                <span className="font-medium">{escala.des13 || '0'}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Rango 2 con descuentos agrupados */}
                        <td className="pl-6 py-1 text-center">
                          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2 min-w-[120px]">
                            <div className="text-xs space-y-1 flex items-baseline gap-2">
                              <div className="flex justify-between bg-white rounded px-2 py-1">
                                <span className="text-gray-600">D1:</span>
                                <span className="font-medium">{escala.des21 || '0'}</span>
                              </div>
                              <div className="flex justify-between bg-white rounded px-2 py-1">
                                <span className="text-gray-600">D2:</span>
                                <span className="font-medium">{escala.des22 || '0'}</span>
                              </div>
                              <div className="flex justify-between bg-white rounded px-2 py-1">
                                <span className="text-gray-600">D3:</span>
                                <span className="font-medium">{escala.des23 || '0'}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Rango 3 con descuentos agrupados */}
                        <td className="pl-6 py-1 text-center">
                          <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 min-w-[120px]">
                            <div className="text-xs space-y-1 flex items-baseline gap-2">
                              <div className="flex justify-between bg-white rounded px-2 py-1">
                                <span className="text-gray-600">D1:</span>
                                <span className="font-medium">{escala.des31 || '0'}</span>
                              </div>
                              <div className="flex justify-between bg-white rounded px-2 py-1">
                                <span className="text-gray-600">D2:</span>
                                <span className="font-medium">{escala.des32 || '0'}</span>
                              </div>
                              <div className="flex justify-between bg-white rounded px-2 py-1">
                                <span className="text-gray-600">D3:</span>
                                <span className="font-medium">{escala.des33 || '0'}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Rango 4 con descuentos agrupados */}
                        <td className="pl-6 py-1 text-center">
                          <div className="bg-purple-50 border border-purple-200 rounded-lg p-2 min-w-[120px]">
                            <div className="text-xs space-y-1 flex items-baseline gap-2">
                              <div className="flex justify-between bg-white rounded px-2 py-1">
                                <span className="text-gray-600">D1:</span>
                                <span className="font-medium">{escala.des41 || '0'}</span>
                              </div>
                              <div className="flex justify-between bg-white rounded px-2 py-1">
                                <span className="text-gray-600">D2:</span>
                                <span className="font-medium">{escala.des42 || '0'}</span>
                              </div>
                              <div className="flex justify-between bg-white rounded px-2 py-1">
                                <span className="text-gray-600">D3:</span>
                                <span className="font-medium">{escala.des43 || '0'}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Rango 5 con descuentos agrupados */}
                        <td className="pl-6 py-1 text-center">
                          <div className="bg-rose-50 border border-rose-200 rounded-lg p-2 min-w-[120px]">
                            <div className="text-xs space-y-1 flex items-baseline gap-2">
                              <div className="flex justify-between bg-white rounded px-2 py-1">
                                <span className="text-gray-600">D1:</span>
                                <span className="font-medium">{escala.des51 || '0'}</span>
                              </div>
                              <div className="flex justify-between bg-white rounded px-2 py-1">
                                <span className="text-gray-600">D2:</span>
                                <span className="font-medium">{escala.des52 || '0'}</span>
                              </div>
                              <div className="flex justify-between bg-white rounded px-2 py-1">
                                <span className="text-gray-600">D3:</span>
                                <span className="font-medium">{escala.des53 || '0'}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Acciones pegadas a la derecha */}
                        <td className="px-4 py-4 whitespace-nowrap sticky right-0 bg-white">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => handleEdit(escala)}
                              className="text-sky-600 hover:text-sky-800 hover:bg-sky-50 p-1 rounded transition-colors"
                              title="Editar"
                            >
                              <PencilIcon className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDelete(escala)}
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
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                Editar Escala - {editingEscala?.CodPro} - {editingEscala?.Nombre}
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
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                {/* Rango 1 */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-3">Rango 1</h3>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-sm text-gray-600">Rango</label>
                      <input
                        type="number"
                        name="rango1"
                        value={formData.rango1}
                        onChange={handleInputChange}
                        className="w-full p-2 border rounded-md text-sm"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600">Des. 1-1</label>
                      <input
                        type="number"
                        name="des11"
                        value={formData.des11}
                        onChange={handleInputChange}
                        className="w-full p-2 border rounded-md text-sm"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600">Des. 1-2</label>
                      <input
                        type="number"
                        name="des12"
                        value={formData.des12}
                        onChange={handleInputChange}
                        className="w-full p-2 border rounded-md text-sm"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600">Des. 1-3</label>
                      <input
                        type="number"
                        name="des13"
                        value={formData.des13}
                        onChange={handleInputChange}
                        className="w-full p-2 border rounded-md text-sm"
                        step="0.01"
                      />
                    </div>
                  </div>
                </div>

                {/* Rango 2 */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-3">Rango 2</h3>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-sm text-gray-600">Rango</label>
                      <input
                        type="number"
                        name="rango2"
                        value={formData.rango2}
                        onChange={handleInputChange}
                        className="w-full p-2 border rounded-md text-sm"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600">Des. 2-1</label>
                      <input
                        type="number"
                        name="des21"
                        value={formData.des21}
                        onChange={handleInputChange}
                        className="w-full p-2 border rounded-md text-sm"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600">Des. 2-2</label>
                      <input
                        type="number"
                        name="des22"
                        value={formData.des22}
                        onChange={handleInputChange}
                        className="w-full p-2 border rounded-md text-sm"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600">Des. 2-3</label>
                      <input
                        type="number"
                        name="des23"
                        value={formData.des23}
                        onChange={handleInputChange}
                        className="w-full p-2 border rounded-md text-sm"
                        step="0.01"
                      />
                    </div>
                  </div>
                </div>

                {/* Rango 3 */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-3">Rango 3</h3>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-sm text-gray-600">Rango</label>
                      <input
                        type="number"
                        name="rango3"
                        value={formData.rango3}
                        onChange={handleInputChange}
                        className="w-full p-2 border rounded-md text-sm"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600">Des. 3-1</label>
                      <input
                        type="number"
                        name="des31"
                        value={formData.des31}
                        onChange={handleInputChange}
                        className="w-full p-2 border rounded-md text-sm"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600">Des. 3-2</label>
                      <input
                        type="number"
                        name="des32"
                        value={formData.des32}
                        onChange={handleInputChange}
                        className="w-full p-2 border rounded-md text-sm"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600">Des. 3-3</label>
                      <input
                        type="number"
                        name="des33"
                        value={formData.des33}
                        onChange={handleInputChange}
                        className="w-full p-2 border rounded-md text-sm"
                        step="0.01"
                      />
                    </div>
                  </div>
                </div>

                {/* Rango 4 */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-3">Rango 4</h3>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-sm text-gray-600">Rango</label>
                      <input
                        type="number"
                        name="rango4"
                        value={formData.rango4}
                        onChange={handleInputChange}
                        className="w-full p-2 border rounded-md text-sm"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600">Des. 4-1</label>
                      <input
                        type="number"
                        name="des41"
                        value={formData.des41}
                        onChange={handleInputChange}
                        className="w-full p-2 border rounded-md text-sm"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600">Des. 4-2</label>
                      <input
                        type="number"
                        name="des42"
                        value={formData.des42}
                        onChange={handleInputChange}
                        className="w-full p-2 border rounded-md text-sm"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600">Des. 4-3</label>
                      <input
                        type="number"
                        name="des43"
                        value={formData.des43}
                        onChange={handleInputChange}
                        className="w-full p-2 border rounded-md text-sm"
                        step="0.01"
                      />
                    </div>
                  </div>
                </div>

                {/* Rango 5 */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-3">Rango 5</h3>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-sm text-gray-600">Rango</label>
                      <input
                        type="number"
                        name="rango5"
                        value={formData.rango5}
                        onChange={handleInputChange}
                        className="w-full p-2 border rounded-md text-sm"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600">Des. 5-1</label>
                      <input
                        type="number"
                        name="des51"
                        value={formData.des51}
                        onChange={handleInputChange}
                        className="w-full p-2 border rounded-md text-sm"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600">Des. 5-2</label>
                      <input
                        type="number"
                        name="des52"
                        value={formData.des52}
                        onChange={handleInputChange}
                        className="w-full p-2 border rounded-md text-sm"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600">Des. 5-3</label>
                      <input
                        type="number"
                        name="des53"
                        value={formData.des53}
                        onChange={handleInputChange}
                        className="w-full p-2 border rounded-md text-sm"
                        step="0.01"
                      />
                    </div>
                  </div>
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
                  Actualizar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Escalas; 