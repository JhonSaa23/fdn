import React, { useState, useEffect } from 'react';
import { XMarkIcon, MagnifyingGlassIcon, EyeIcon } from '@heroicons/react/24/outline';
import { consultarVentas, obtenerTodosLosProductos, obtenerVendedores } from '../services/api';
import axiosClient from '../services/axiosClient';

const ConsultarVentasModal = ({ isOpen, onClose }) => {
  const [filtros, setFiltros] = useState({
    vendedor: '',
    codigo: ''
  });
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [vendedores, setVendedores] = useState([]);
  const [mostrarSugerenciasVendedor, setMostrarSugerenciasVendedor] = useState(false);
  const [vendedoresFiltrados, setVendedoresFiltrados] = useState([]);

  // Cargar vendedores al abrir el modal
  useEffect(() => {
    if (isOpen) {
      cargarVendedores();
    }
  }, [isOpen]);

  const cargarVendedores = async () => {
    try {
      const vendedoresData = await obtenerVendedores();
      setVendedores(vendedoresData);
    } catch (error) {
      console.error('Error al cargar vendedores:', error);
    }
  };

  const handleFiltroChange = (campo, valor) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor
    }));

    // Si es el campo vendedor, mostrar sugerencias de vendedores
    if (campo === 'vendedor' && valor.length > 0) {
      const filtrados = vendedores.filter(vendedor =>
        String(vendedor.codigo).toLowerCase().includes(valor.toLowerCase()) ||
        String(vendedor.nombre || '').toLowerCase().includes(valor.toLowerCase())
      ).slice(0, 10);
      setVendedoresFiltrados(filtrados);
      setMostrarSugerenciasVendedor(true);
    } else if (campo === 'vendedor' && valor.length === 0) {
      setMostrarSugerenciasVendedor(false);
    }
  };

  const seleccionarVendedor = (vendedor) => {
    setFiltros(prev => ({
      ...prev,
      vendedor: `${String(vendedor.codigo)} - ${vendedor.nombre || ''}`
    }));
    setMostrarSugerenciasVendedor(false);
  };

  const handleConsultar = async () => {
    try {
      setLoading(true);
      // Enviar filtros de vendedor y código
      const filtrosSimplificados = {
        vendedor: filtros.vendedor,
        codigo: filtros.codigo
      };
      const resultado = await consultarVentas(filtrosSimplificados);
      setVentas(resultado);
    } catch (error) {
      console.error('Error al consultar ventas:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    if (!value || isNaN(value)) return 'S/ 0.00';
    return `S/ ${parseFloat(value).toFixed(2)}`;
  };

  const calcularTotalGeneral = () => {
    return ventas.reduce((total, venta) => total + (venta.cantidad * venta.venta || 0), 0);
  };

  const handleEnviarReporte = async () => {
    try {
      const reporteData = {
        ventas: ventas,
        filtros: filtros,
        totalGeneral: calcularTotalGeneral(),
        fechaGeneracion: new Date().toLocaleString('es-ES'),
        vendedorSeleccionado: filtros.vendedor || 'Todos los vendedores'
      };

                    const response = await axiosClient.post('/kardex/generar-reporte-ventas', reporteData, {
         responseType: 'blob'
       });

       if (response.status === 200) {
         const blob = response.data;
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte-ventas-${filtros.vendedor ? filtros.vendedor.split(' - ')[1] : 'todos'}-${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        console.error('Error al generar reporte');
        alert('Error al generar el reporte PDF');
      }
    } catch (error) {
      console.error('Error al enviar reporte:', error);
      alert('Error al generar el reporte PDF');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl h-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b bg-blue-50">
          <h2 className="text-xl font-semibold text-gray-900">
            Consultar Ventas
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

                        {/* Filtros */}
                 <div className="p-4 border-b bg-gray-50">
           <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
             {/* Código de Producto */}
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">
                 Código Producto (Opcional)
               </label>
               <input
                 type="text"
                 value={filtros.codigo}
                 onChange={(e) => handleFiltroChange('codigo', e.target.value)}
                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                 placeholder="Código del producto"
               />
             </div>

             {/* Vendedor */}
             <div className="relative">
               <label className="block text-sm font-medium text-gray-700 mb-1">
                 Vendedor (Opcional)
               </label>
               <input
                 type="text"
                 value={filtros.vendedor}
                 onChange={(e) => handleFiltroChange('vendedor', e.target.value)}
                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                 placeholder="Código o nombre"
               />
               
               {/* Sugerencias de vendedores */}
               {mostrarSugerenciasVendedor && vendedoresFiltrados.length > 0 && (
                 <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                   {vendedoresFiltrados.map((vendedor) => (
                     <div
                       key={vendedor.codigo}
                       onClick={() => seleccionarVendedor(vendedor)}
                       className="p-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                     >
                       <div className="font-medium text-green-600">{String(vendedor.codigo)}</div>
                       <div className="text-sm text-gray-600">{vendedor.nombre || ''}</div>
                     </div>
                   ))}
                 </div>
               )}
             </div>

            {/* Botón Consultar */}
            <div className="flex items-end">
              <button
                onClick={handleConsultar}
                disabled={loading}
                className="w-full inline-flex items-center justify-center px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Consultando...
                  </>
                ) : (
                  <>
                    <MagnifyingGlassIcon className="h-4 w-4 mr-2" />
                    Consultar
                  </>
                )}
              </button>
            </div>

            {/* Botón Enviar Reporte */}
            <div className="flex items-end">
              <button
                onClick={handleEnviarReporte}
                disabled={loading || ventas.length === 0}
                className="w-full inline-flex items-center justify-center px-6 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Enviar Reporte
              </button>
            </div>
          </div>
        </div>

        {/* Resultados */}
        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="h-full overflow-auto">
              {ventas.length > 0 ? (
                <>
                  {/* Resumen */}
                  <div className="p-4 bg-green-50 border-b">
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-600">
                        Se encontraron <span className="font-semibold text-green-600">{ventas.length}</span> ventas
                      </div>
                      <div className="text-lg font-semibold text-green-600">
                        Total General: {formatCurrency(calcularTotalGeneral())}
                      </div>
                    </div>
                  </div>

                  {/* Tabla */}
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Documento
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Fecha
                          </th>
                                                     <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                             CodPro
                           </th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Producto
                          </th>
                          
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Cantidad
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Precio Unit.
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total
                          </th>
                                                     <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                             Cliente
                           </th>
                           <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                             Vendedor
                           </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {ventas.map((venta, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 font-medium">
                              {venta.documento}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                              {venta.fecha}
                            </td>
                                                         <td className="px-3 py-2 whitespace-nowrap text-sm text-blue-600 font-medium">
                               {venta.codigoProducto || '-'}
                             </td>
                            <td className="px-3 py-2 text-sm text-gray-900">
                              {venta.nombreProducto || 'Sin nombre'}
                            </td>
                            
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 font-medium">
                              {venta.cantidad}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                              {formatCurrency(venta.venta)}
                            </td>
                                                         <td className="px-3 py-2 whitespace-nowrap text-sm text-green-600 font-semibold">
                               {formatCurrency(venta.cantidad * venta.venta)}
                             </td>
                                                         <td className="px-3 py-2 text-sm text-gray-500">
                               {venta.nombreCliente || 'Sin cliente'}
                             </td>
                             <td className="px-3 py-2 text-sm text-gray-500">
                               {venta.Vendedor || 'Sin vendedor'}
                             </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <EyeIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No hay ventas</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {ventas.length === 0 && !loading ? 'Ajusta los filtros y consulta nuevamente.' : ''}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConsultarVentasModal;
