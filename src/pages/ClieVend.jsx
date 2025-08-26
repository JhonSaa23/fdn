import { useState, useEffect } from 'react';
import { useNotification } from '../App';
import axiosClient from '../services/axiosClient';

const ClieVend = () => {
  const { showNotification } = useNotification();
  const [vendedores, setVendedores] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [selectedVendedor, setSelectedVendedor] = useState('');
  const [filtros, setFiltros] = useState({
    ruc: '',
    nombre: ''
  });
  const [selectedClientes, setSelectedClientes] = useState(new Set());
  const [showChangeVendedorModal, setShowChangeVendedorModal] = useState(false);
  const [newVendedor, setNewVendedor] = useState('');
  const [changingVendedor, setChangingVendedor] = useState(false);

  // Cargar lista de vendedores al montar el componente
  useEffect(() => {
    cargarVendedores();
  }, []);

  const cargarVendedores = async () => {
    try {
      setLoading(true);
      const response = await axiosClient.get('/vendedores');
      setVendedores(response.data);
    } catch (error) {
      console.error('Error al cargar vendedores:', error);
      showNotification('danger', 'Error al cargar la lista de vendedores');
    } finally {
      setLoading(false);
    }
  };

  const buscarClientesPorVendedor = async () => {
    if (!selectedVendedor) {
      showNotification('warning', 'Por favor selecciona un vendedor');
      return;
    }

    try {
      setSearching(true);
      const response = await axiosClient.get(`/vendedores/clientes-por-vendedor/${selectedVendedor}`);
      setClientes(response.data);
      showNotification('success', `Se encontraron ${response.data.length} clientes para el vendedor seleccionado`);
    } catch (error) {
      console.error('Error al buscar clientes:', error);
      showNotification('danger', 'Error al buscar clientes del vendedor');
      setClientes([]);
    } finally {
      setSearching(false);
    }
  };

  // Filtrar clientes en tiempo real
  const clientesFiltrados = clientes.filter(cliente => {
    const rucMatch = !filtros.ruc || cliente.Documento?.toLowerCase().includes(filtros.ruc.toLowerCase());
    const nombreMatch = !filtros.nombre || cliente.Razon?.toLowerCase().includes(filtros.nombre.toLowerCase());
    return rucMatch && nombreMatch;
  });

  const limpiarFiltros = () => {
    setFiltros({ ruc: '', nombre: '' });
  };

  const limpiarTodo = () => {
    setSelectedVendedor('');
    setClientes([]);
    setFiltros({ ruc: '', nombre: '' });
    setSelectedClientes(new Set());
  };

  // Funciones para selección masiva
  const toggleSelectAll = () => {
    if (selectedClientes.size === clientesFiltrados.length) {
      setSelectedClientes(new Set());
    } else {
      setSelectedClientes(new Set(clientesFiltrados.map(cliente => cliente.Codclie)));
    }
  };

  const toggleSelectCliente = (codclie) => {
    const newSelected = new Set(selectedClientes);
    if (newSelected.has(codclie)) {
      newSelected.delete(codclie);
    } else {
      newSelected.add(codclie);
    }
    setSelectedClientes(newSelected);
  };

  const cambiarVendedorMasivo = async () => {
    if (!newVendedor) {
      showNotification('warning', 'Por favor selecciona un nuevo vendedor');
      return;
    }

    if (selectedClientes.size === 0) {
      showNotification('warning', 'Por favor selecciona al menos un cliente');
      return;
    }

    try {
      setChangingVendedor(true);
      const response = await axiosClient.post('/vendedores/cambiar-vendedor-masivo', {
        clientes: Array.from(selectedClientes),
        nuevoVendedor: newVendedor
      });

      showNotification('success', `Se cambió el vendedor de ${response.data.actualizados} clientes exitosamente`);
      
      // Recargar los clientes del vendedor actual
      await buscarClientesPorVendedor();
      
      // Limpiar selección y modal
      setSelectedClientes(new Set());
      setShowChangeVendedorModal(false);
      setNewVendedor('');
    } catch (error) {
      console.error('Error al cambiar vendedor:', error);
      showNotification('danger', 'Error al cambiar el vendedor de los clientes');
    } finally {
      setChangingVendedor(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Clientes por Vendedor</h1>
        <p className="text-gray-600">
          Selecciona un vendedor para ver sus clientes y filtrar por RUC o nombre
        </p>
      </div>

      {/* Controles principales */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          {/* Selector de vendedor */}
          <div>
            <label htmlFor="vendedor" className="block text-sm font-medium text-gray-700 mb-2">
              Vendedor *
            </label>
            <select
              id="vendedor"
              value={selectedVendedor}
              onChange={(e) => setSelectedVendedor(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            >
              <option value="">Selecciona un vendedor</option>
              {vendedores.map((vendedor) => (
                <option key={vendedor.CodVend} value={vendedor.CodVend}>
                  {vendedor.CodVend} - {vendedor.Nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Botón buscar */}
          <div>
            <button
              onClick={buscarClientesPorVendedor}
              disabled={!selectedVendedor || searching}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200 flex items-center justify-center"
            >
              {searching ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Buscando...
                </>
              ) : (
                'Buscar Clientes'
              )}
            </button>
          </div>

          {/* Botón limpiar */}
          <div>
            <button
              onClick={limpiarTodo}
              className="w-full bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
            >
              Limpiar Todo
            </button>
          </div>
        </div>
      </div>

      {/* Filtros en tiempo real */}
      {clientes.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Filtros en Tiempo Real</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            {/* Filtro RUC */}
            <div>
              <label htmlFor="filtroRuc" className="block text-sm font-medium text-gray-700 mb-2">
                Filtrar por RUC
              </label>
              <input
                type="text"
                id="filtroRuc"
                value={filtros.ruc}
                onChange={(e) => setFiltros(prev => ({ ...prev, ruc: e.target.value }))}
                placeholder="Buscar por RUC..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Filtro Nombre */}
            <div>
              <label htmlFor="filtroNombre" className="block text-sm font-medium text-gray-700 mb-2">
                Filtrar por Nombre
              </label>
              <input
                type="text"
                id="filtroNombre"
                value={filtros.nombre}
                onChange={(e) => setFiltros(prev => ({ ...prev, nombre: e.target.value }))}
                placeholder="Buscar por nombre..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Botón limpiar filtros */}
            <div>
              <button
                onClick={limpiarFiltros}
                className="w-full bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium py-2 px-4 rounded-md transition-colors duration-200"
              >
                Limpiar Filtros
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resultados */}
      {clientes.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                     <div className="px-6 py-4 border-b border-gray-200">
             <div className="flex justify-between items-center">
               <h2 className="text-lg font-semibold text-gray-900">
                 Clientes del Vendedor
               </h2>
               <div className="flex items-center space-x-4">
                 <div className="text-sm text-gray-600">
                   {clientesFiltrados.length} de {clientes.length} clientes
                 </div>
                 {selectedClientes.size > 0 && (
                   <div className="flex items-center space-x-2">
                     <span className="text-sm text-blue-600 font-medium">
                       {selectedClientes.size} seleccionados
                     </span>
                     <button
                       onClick={() => setShowChangeVendedorModal(true)}
                       className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3 py-1.5 rounded-md transition-colors duration-200"
                     >
                       Cambiar Vendedor
                     </button>
                   </div>
                 )}
               </div>
             </div>
           </div>

          <div className="overflow-x-auto">
                         <table className="min-w-full divide-y divide-gray-200">
               <thead className="bg-gray-50">
                 <tr>
                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                     <input
                       type="checkbox"
                       checked={selectedClientes.size === clientesFiltrados.length && clientesFiltrados.length > 0}
                       onChange={toggleSelectAll}
                       className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                     />
                   </th>
                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                     Código
                   </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    RUC/Documento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Razón Social
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dirección
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Teléfono
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Celular
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Límite
                  </th>
                </tr>
              </thead>
                             <tbody className="bg-white divide-y divide-gray-200">
                 {clientesFiltrados.map((cliente) => (
                   <tr key={cliente.Codclie} className={`hover:bg-gray-50 ${selectedClientes.has(cliente.Codclie) ? 'bg-blue-50' : ''}`}>
                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                       <input
                         type="checkbox"
                         checked={selectedClientes.has(cliente.Codclie)}
                         onChange={() => toggleSelectCliente(cliente.Codclie)}
                         className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                       />
                     </td>
                     <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                       {cliente.Codclie}
                     </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {cliente.Documento}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="max-w-xs truncate" title={cliente.Razon}>
                        {cliente.Razon}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="max-w-xs truncate" title={cliente.Direccion}>
                        {cliente.Direccion}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {cliente.Telefono1 || cliente.Telefono2 || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {cliente.Celular || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {cliente.Email || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {cliente.Limite ? `S/. ${parseFloat(cliente.Limite).toFixed(2)}` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {clientesFiltrados.length === 0 && (
            <div className="px-6 py-8 text-center">
              <p className="text-gray-500">No se encontraron clientes con los filtros aplicados</p>
            </div>
          )}
        </div>
      )}

      {/* Estado inicial */}
      {clientes.length === 0 && !searching && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay clientes seleccionados</h3>
          <p className="text-gray-500">
            Selecciona un vendedor y haz clic en "Buscar Clientes" para ver los resultados
          </p>
                 </div>
       )}

       {/* Modal para cambiar vendedor */}
       {showChangeVendedorModal && (
         <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
           <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
             <div className="mt-3">
               <h3 className="text-lg font-medium text-gray-900 mb-4">
                 Cambiar Vendedor de {selectedClientes.size} Cliente{selectedClientes.size !== 1 ? 's' : ''}
               </h3>
               
               <div className="mb-4">
                 <label htmlFor="newVendedor" className="block text-sm font-medium text-gray-700 mb-2">
                   Nuevo Vendedor *
                 </label>
                 <select
                   id="newVendedor"
                   value={newVendedor}
                   onChange={(e) => setNewVendedor(e.target.value)}
                   className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                 >
                   <option value="">Selecciona un vendedor</option>
                   {vendedores.map((vendedor) => (
                     <option key={vendedor.CodVend} value={vendedor.CodVend}>
                       {vendedor.CodVend} - {vendedor.Nombre}
                     </option>
                   ))}
                 </select>
               </div>

               <div className="flex justify-end space-x-3">
                 <button
                   onClick={() => {
                     setShowChangeVendedorModal(false);
                     setNewVendedor('');
                   }}
                   className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium rounded-md transition-colors duration-200"
                   disabled={changingVendedor}
                 >
                   Cancelar
                 </button>
                 <button
                   onClick={cambiarVendedorMasivo}
                   disabled={!newVendedor || changingVendedor}
                   className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-md transition-colors duration-200 flex items-center"
                 >
                   {changingVendedor ? (
                     <>
                       <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                         <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                         <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                       </svg>
                       Cambiando...
                     </>
                   ) : (
                     'Confirmar Cambio'
                   )}
                 </button>
               </div>
             </div>
           </div>
         </div>
       )}
     </div>
   );
 };

export default ClieVend;
