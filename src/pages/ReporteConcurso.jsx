import { useState } from 'react';
import { useNotification } from '../App';
import Button from '../components/Button';
import Card from '../components/Card';
import { actualizarVistasConcurso } from '../services/api';

function ReporteConcurso() {
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(false);
  const [filtros, setFiltros] = useState({
    anio: new Date().getFullYear(),
    mes: new Date().getMonth() + 1,
    dia: new Date().getDate()
  });
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFiltros(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleActualizar = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      const resultado = await actualizarVistasConcurso(
        filtros.anio,
        filtros.mes,
        filtros.dia
      );
      
      if (!resultado.success) {
        throw new Error(resultado.error || 'Error al actualizar vistas');
      }
      
    } catch (error) {
      console.error('Error:', error);
      showNotification('danger', error.message || 'Error desconocido al actualizar vistas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 w-full">      
      <Card>
        <Card.Body>
          <form onSubmit={handleActualizar} className="space-y-4">
            <div className="flex flex-wrap items-end gap-4">
              <div className="w-full sm:w-auto">
                <label htmlFor="anio" className="block text-sm font-medium text-gray-700 mb-2">
                  Año
                </label>
                <input
                  type="number"
                  id="anio"
                  name="anio"
                  value={filtros.anio}
                  onChange={handleChange}
                  className="block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  min="2000"
                  max="2100"
                  required
                />
              </div>
              
              <div className="w-full sm:w-auto">
                <label htmlFor="mes" className="block text-sm font-medium text-gray-700 mb-2">
                  Mes
                </label>
                <select
                  id="mes"
                  name="mes"
                  value={filtros.mes}
                  onChange={handleChange}
                  className="block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  required
                >
                  <option value="1">Enero</option>
                  <option value="2">Febrero</option>
                  <option value="3">Marzo</option>
                  <option value="4">Abril</option>
                  <option value="5">Mayo</option>
                  <option value="6">Junio</option>
                  <option value="7">Julio</option>
                  <option value="8">Agosto</option>
                  <option value="9">Septiembre</option>
                  <option value="10">Octubre</option>
                  <option value="11">Noviembre</option>
                  <option value="12">Diciembre</option>
                </select>
              </div>

              <div className="w-full sm:w-auto">
                <label htmlFor="dia" className="block text-sm font-medium text-gray-700 mb-2">
                  Día
                </label>
                <input
                  type="number"
                  id="dia"
                  name="dia"
                  value={filtros.dia}
                  onChange={handleChange}
                  className="block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  min="1"
                  max="31"
                  required
                />
              </div>
              
              <div className="flex space-x-2 w-full sm:w-auto">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                      Actualizando...
                    </>
                  ) : 'Actualizar'}
                </Button>
              </div>
            </div>
          </form>
        </Card.Body>
      </Card>

      <Card>
        <Card.Body>
          <div className="text-sm text-gray-600">
            <p>Este formulario actualiza las siguientes vistas:</p>
            <ul className="list-disc list-inside mt-2">
              <li>v_concurso_cab_11_09_24 (Cabecera)</li>
              <li>v_concurso_det_11_09_24 (Detalle)</li>
            </ul>
            <p className="mt-2">
              Las vistas se actualizarán con la fecha seleccionada y mostrarán los registros correspondientes.
            </p>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
}

export default ReporteConcurso; 