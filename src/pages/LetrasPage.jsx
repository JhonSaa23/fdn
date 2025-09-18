import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  DocumentTextIcon, 
  MagnifyingGlassIcon, 
  Bars3Icon,
  ChartBarIcon,
  CalendarDaysIcon,
  UserIcon,
  XMarkIcon,
  EyeIcon,
  ClipboardDocumentIcon
} from '@heroicons/react/24/outline';
import axiosClient from '../services/axiosClient';

const LetrasPage = () => {
  const navigate = useNavigate();
  const [letras, setLetras] = useState([]);
  const [todasLasLetras, setTodasLasLetras] = useState([]); // Todas las letras cargadas
  const [estadisticas, setEstadisticas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtroActivo, setFiltroActivo] = useState(1); // 1=Pendientes, 2=Pagadas, 3=Vencidas
  const [filtroCodigoBanco, setFiltroCodigoBanco] = useState(false);
  
  // Filtros
  const [filtros, setFiltros] = useState({
    fechaInicio: '',
    fechaFin: '',
    estado: '',
    cliente: ''
  });
  
  // Estados para modales
  const [showFiltros, setShowFiltros] = useState(false);
  const [letraSeleccionada, setLetraSeleccionada] = useState(null);
  const [showDetalle, setShowDetalle] = useState(false);
  const [mostrandoSoloPendientes, setMostrandoSoloPendientes] = useState(true);
  const [copiado, setCopiado] = useState(false);

  // Cargar datos iniciales
  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      
      // Cargar letras y estadísticas en paralelo
      const [letrasRes, statsRes] = await Promise.all([
        axiosClient.get('/letras'),
        axiosClient.get('/letras/estadisticas')
      ]);

      // Guardar todas las letras
      const todasLasLetrasData = letrasRes.data.data || [];
      setTodasLasLetras(todasLasLetrasData);
      
      // Filtrar solo las letras pendientes por defecto
      const letrasPendientes = todasLasLetrasData.filter(letra => letra.Estado === 1);
      setLetras(letrasPendientes);
      setEstadisticas(statsRes.data.data || {});
      setFiltroActivo(1); // Pendientes por defecto
      setFiltroCodigoBanco(false); // Asegurar que el filtro de código de banco esté desactivado
    } catch (err) {
      setError('Error al cargar las letras de cambio');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltros = () => {
    // Filtrar en el frontend sin consultar la base de datos
    let letrasFiltradas = [...todasLasLetras];
    
    // Filtrar por estado
    if (filtros.estado) {
      letrasFiltradas = letrasFiltradas.filter(letra => letra.Estado === parseInt(filtros.estado));
    }
    
    // Filtrar por fecha inicio
    if (filtros.fechaInicio) {
      letrasFiltradas = letrasFiltradas.filter(letra => {
        const fechaLetra = new Date(letra.FecIni);
        const fechaInicio = new Date(filtros.fechaInicio);
        return fechaLetra >= fechaInicio;
      });
    }
    
    // Filtrar por fecha fin
    if (filtros.fechaFin) {
      letrasFiltradas = letrasFiltradas.filter(letra => {
        const fechaLetra = new Date(letra.FecIni);
        const fechaFin = new Date(filtros.fechaFin);
        return fechaLetra <= fechaFin;
      });
    }
    
    // Filtrar por cliente
    if (filtros.cliente) {
      const clienteBusqueda = filtros.cliente.toLowerCase();
      letrasFiltradas = letrasFiltradas.filter(letra => 
        letra.NombreCliente.toLowerCase().includes(clienteBusqueda) ||
        letra.Codclie.toLowerCase().includes(clienteBusqueda)
      );
    }
    
    // Filtrar por código de banco si está activo (verde = solo con código)
    if (filtroCodigoBanco) {
      letrasFiltradas = letrasFiltradas.filter(letra => letra.CodBanco && letra.CodBanco.trim() !== '');
    }
    
    setLetras(letrasFiltradas);
    setShowFiltros(false);
  };

  const limpiarFiltros = () => {
    setFiltros({
      fechaInicio: '',
      fechaFin: '',
      estado: '',
      cliente: ''
    });
    setFiltroCodigoBanco(false);
    setFiltroActivo(1);
    // Volver a mostrar solo pendientes
    const letrasPendientes = todasLasLetras.filter(letra => letra.Estado === 1);
    setLetras(letrasPendientes);
  };


  const aplicarFiltroEstado = (estado) => {
    setFiltroActivo(estado);
    aplicarFiltrosReales();
  };

  const toggleFiltroCodigoBanco = () => {
    const nuevoEstado = !filtroCodigoBanco;
    console.log('Toggle filtro código banco:', nuevoEstado);
    setFiltroCodigoBanco(nuevoEstado);
    aplicarFiltrosReales();
  };

  const aplicarFiltrosReales = () => {
    let letrasFiltradas = todasLasLetras.filter(letra => letra.Estado === filtroActivo);
    console.log('Filtro activo:', filtroActivo, 'Filtro código banco:', filtroCodigoBanco);
    console.log('Letras antes del filtro de código:', letrasFiltradas.length);
    
    // Aplicar filtro de código de banco si está activo (verde = solo con código)
    if (filtroCodigoBanco) {
      letrasFiltradas = letrasFiltradas.filter(letra => letra.CodBanco && letra.CodBanco.trim() !== '');
      console.log('Letras después del filtro de código:', letrasFiltradas.length);
    }
    
    // Aplicar filtro de cliente en tiempo real
    if (filtros.cliente) {
      const clienteBusqueda = filtros.cliente.toLowerCase();
      letrasFiltradas = letrasFiltradas.filter(letra => 
        letra.NombreCliente.toLowerCase().includes(clienteBusqueda) ||
        letra.Codclie.toLowerCase().includes(clienteBusqueda)
      );
    }
    
    setLetras(letrasFiltradas);
  };

  const handleClienteChange = (e) => {
    setFiltros({...filtros, cliente: e.target.value});
    // Aplicar filtro en tiempo real después de un pequeño delay
    setTimeout(() => {
      aplicarFiltrosReales();
    }, 100);
  };

  const verDetalle = (letra) => {
    setLetraSeleccionada(letra);
    setShowDetalle(true);
  };

  const copiarCodigoBanco = async (codigoBanco, event) => {
    event.stopPropagation(); // Evitar que se abra el modal de detalle
    try {
      await navigator.clipboard.writeText(codigoBanco);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000); // Ocultar después de 2 segundos
    } catch (err) {
      console.error('Error al copiar:', err);
    }
  };

  const copiarDatosLetra = async (letra, event) => {
    event.stopPropagation(); // Evitar que se abra el modal de detalle
    try {
      const datosFormateados = `Letra: ${letra.Numero}
Cliente: ${letra.NombreCliente}
Código Banco: ${letra.CodBanco || 'N/A'}
Vencimiento: ${formatDate(letra.FecVen)}
Monto: ${formatCurrency(letra.Monto)}`;
      
      await navigator.clipboard.writeText(datosFormateados);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch (err) {
      console.error('Error al copiar datos:', err);
    }
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 1: return 'warning';
      case 2: return 'success';
      case 3: return 'error';
      default: return 'default';
    }
  };

  const getEstadoText = (estado) => {
    switch (estado) {
      case 1: return 'Pendiente';
      case 2: return 'Pagado';
      case 3: return 'Vencido';
      default: return 'Desconocido';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(amount);
  };

  const formatDate = (date) => {
    if (!date) return '-';
    
    try {
      // Convertir a string
      const dateStr = date.toString();
      
      // Extraer solo la parte de la fecha (YYYY-MM-DD)
      let datePart;
      if (dateStr.includes(' ')) {
        datePart = dateStr.split(' ')[0]; // Tomar solo la parte de la fecha
      } else if (dateStr.includes('T')) {
        datePart = dateStr.split('T')[0]; // Tomar solo la parte de la fecha
      } else {
        datePart = dateStr;
      }
      
      // Dividir en año, mes, día
      const [year, month, day] = datePart.split('-');
      
      // Crear fecha directamente sin interpretación de zona horaria
      const fecha = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      
      // Verificar que la fecha es válida
      if (isNaN(fecha.getTime())) {
        console.error('Fecha inválida:', date);
        return '-';
      }
      
      // Formatear como DD/MM/YYYY
      const dia = fecha.getDate().toString().padStart(2, '0');
      const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
      const año = fecha.getFullYear();
      
      return `${dia}/${mes}/${año}`;
      
    } catch (error) {
      console.error('Error formateando fecha:', error);
      return '-';
    }
  };

  // Memoizar la lista de letras para evitar re-renderizados innecesarios
  const letrasList = useMemo(() => {
    return letras.map((letra, index) => (
      <div 
        key={`${letra.Numero}-${index}`} 
        className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100"
        onClick={() => verDetalle(letra)}
      >
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-sm font-medium text-gray-900 truncate">
                #{letra.Numero}
              </h3>
              <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                getEstadoColor(letra.Estado) === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                getEstadoColor(letra.Estado) === 'success' ? 'bg-green-100 text-green-800' :
                getEstadoColor(letra.Estado) === 'error' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {getEstadoText(letra.Estado)}
              </span>
            </div>
            
            <div className="space-y-1 text-xs text-gray-600">
              <div className="flex justify-between">
                <span className="font-medium">Cliente:</span>
                <span className="text-right">{letra.NombreCliente} ({letra.Codclie})</span>
              </div>
              {letra.CodBanco && (
                <div className="flex justify-between items-center">
                  <span className="font-medium">Código Banco:</span>
                  <button
                    onClick={(e) => copiarCodigoBanco(letra.CodBanco, e)}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full hover:bg-green-200 transition-colors"
                  >
                    <ClipboardDocumentIcon className="h-3 w-3" />
                    {letra.CodBanco}
                  </button>
                </div>
              )}
              <div className="flex justify-between">
                <span className="font-medium">Vencimiento:</span>
                <span className="text-right">{formatDate(letra.FecVen)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-left">Monto:</span>
                <span className="font-medium text-right">{formatCurrency(letra.Monto)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-left">Saldo:</span>
                <span className="font-medium text-right">{formatCurrency(letra.SaldoPendiente)}</span>
              </div>
            </div>
            
            {/* Botón de copiar datos */}
            <div className="mt-2 flex justify-end">
              <button
                onClick={(e) => copiarDatosLetra(letra, e)}
                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded hover:bg-blue-200 transition-colors"
              >
                <ClipboardDocumentIcon className="h-3 w-3" />
                Copiar Datos
              </button>
            </div>
          </div>
        </div>
      </div>
    ));
  }, [letras]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-2 sm:p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="">

      {/* Estadísticas y Filtros Ultra Compactos */}
      {estadisticas && (
        <div className="bg-white rounded-lg shadow p-3 mb-3">
           {/* Estadísticas en grid */}
           <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
             <div className="flex items-center justify-center gap-1 px-2 py-1.5 bg-blue-50 text-blue-700 rounded text-xs">
               <DocumentTextIcon className="h-3 w-3" />
               Total: {estadisticas.TotalLetras || 0}
             </div>
             <button 
               onClick={() => aplicarFiltroEstado(1)}
               className={`flex items-center justify-center gap-1 px-2 py-1.5 rounded text-xs transition-colors ${
                 filtroActivo === 1 
                   ? 'bg-yellow-200 text-yellow-800 border-2 border-yellow-400' 
                   : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
               }`}
             >
               <ChartBarIcon className="h-3 w-3" />
               Pend: {estadisticas.LetrasPendientes || 0}
             </button>
             <button 
               onClick={() => aplicarFiltroEstado(2)}
               className={`flex items-center justify-center gap-1 px-2 py-1.5 rounded text-xs transition-colors ${
                 filtroActivo === 2 
                   ? 'bg-green-200 text-green-800 border-2 border-green-400' 
                   : 'bg-green-50 text-green-700 hover:bg-green-100'
               }`}
             >
               <ChartBarIcon className="h-3 w-3" />
               Pag: {estadisticas.LetrasPagadas || 0}
             </button>
             <button 
               onClick={() => aplicarFiltroEstado(3)}
               className={`flex items-center justify-center gap-1 px-2 py-1.5 rounded text-xs transition-colors ${
                 filtroActivo === 3 
                   ? 'bg-red-200 text-red-800 border-2 border-red-400' 
                   : 'bg-red-50 text-red-700 hover:bg-red-100'
               }`}
             >
               <ChartBarIcon className="h-3 w-3" />
               Ven: {estadisticas.LetrasVencidas || 0}
             </button>
           </div>
          
           {/* Filtros en grid */}
           <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
             <input
               type="date"
               value={filtros.fechaInicio}
               onChange={(e) => setFiltros({...filtros, fechaInicio: e.target.value})}
               className="px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
               placeholder="Desde"
             />
             <input
               type="date"
               value={filtros.fechaFin}
               onChange={(e) => setFiltros({...filtros, fechaFin: e.target.value})}
               className="px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
               placeholder="Hasta"
             />
             <input
               type="text"
               value={filtros.cliente}
               onChange={handleClienteChange}
               className="px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
               placeholder="Buscar cliente..."
             />
             <div className="flex gap-1">
               <button
                 onClick={aplicarFiltros}
                 className="flex-1 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
               >
                 Buscar
               </button>
               <button
                 onClick={limpiarFiltros}
                 className="flex-1 px-2 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600 transition-colors"
               >
                 Limpiar
               </button>
             </div>
           </div>
           
           {/* Botón para filtrar solo con código de banco */}
           <div className="flex items-center justify-center gap-2 mb-3">
             <button
               onClick={toggleFiltroCodigoBanco}
               className={`px-4 py-2 rounded text-xs font-medium transition-colors ${
                 filtroCodigoBanco 
                   ? 'bg-green-500 text-white hover:bg-green-600' 
                   : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
               }`}
             >
               {filtroCodigoBanco ? 'Con Cod Banco' : 'Cod Banco'}
             </button>
           </div>
          
          {/* Resumen financiero ultra compacto */}
          <div className="text-xs text-gray-600 space-y-1">
            <div className="flex justify-between">
              <span className="font-medium text-blue-600">Total:</span>
              <span>{formatCurrency(estadisticas.MontoTotal || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-green-600">Pagado:</span>
              <span>{formatCurrency(estadisticas.MontoPagado || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-yellow-600">Pendiente:</span>
              <span>{formatCurrency(estadisticas.SaldoTotal || 0)}</span>
            </div>
          </div>
        </div>
      )}


      {/* Lista de Letras en formato párrafos */}
      <div className="bg-white rounded-lg shadow">
         <div className="px-3 py-3 border-b border-gray-200">
           <div className="flex items-center justify-between">
             <h2 className="text-lg font-medium text-gray-900">
               Lista de Letras ({letras.length})
             </h2>
           </div>
         </div>
        
        {/* Vista Mobile - Formato párrafos */}
        <div className="sm:hidden">
          <div className="divide-y divide-gray-200">
            {letrasList}
          </div>
        </div>

        {/* Vista Desktop - Tabla compacta */}
        <div className="hidden sm:block">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Número
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Código Banco
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha Inicio
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha Vencimiento
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monto
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Saldo
                  </th>
                  <th className="relative px-3 py-2">
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {letras.map((letra) => (
                  <tr key={letra.Numero} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-sm font-medium text-gray-900">
                      #{letra.Numero}
                    </td>
                    <td className="px-3 py-2">
                      <div className="text-sm text-gray-900">
                        {letra.NombreCliente}
                      </div>
                      <div className="text-xs text-gray-500">
                        {letra.Codclie}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-900">
                      {letra.CodBanco || '-'}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-900">
                      {formatDate(letra.FecIni)}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-900">
                      {formatDate(letra.FecVen)}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-900">
                      {formatCurrency(letra.Monto)}
                    </td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                        getEstadoColor(letra.Estado) === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                        getEstadoColor(letra.Estado) === 'success' ? 'bg-green-100 text-green-800' :
                        getEstadoColor(letra.Estado) === 'error' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {getEstadoText(letra.Estado)}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-900">
                      {formatCurrency(letra.SaldoPendiente)}
                    </td>
                    <td className="px-3 py-2 text-right text-sm font-medium">
                      <button
                        onClick={() => verDetalle(letra)}
                        className="text-blue-600 hover:text-blue-900 text-xs"
                      >
                        Ver Detalle
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal de Filtros */}
      {showFiltros && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Filtros de Búsqueda</h3>
                <button
                  onClick={() => setShowFiltros(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha Inicio
                    </label>
                    <input
                      type="date"
                      value={filtros.fechaInicio}
                      onChange={(e) => setFiltros({...filtros, fechaInicio: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha Fin
                    </label>
                    <input
                      type="date"
                      value={filtros.fechaFin}
                      onChange={(e) => setFiltros({...filtros, fechaFin: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estado
                    </label>
                    <select
                      value={filtros.estado}
                      onChange={(e) => setFiltros({...filtros, estado: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Todos</option>
                      <option value="1">Pendiente</option>
                      <option value="2">Pagado</option>
                      <option value="3">Vencido</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cliente (código o nombre)
                    </label>
                    <input
                      type="text"
                      value={filtros.cliente}
                      onChange={(e) => setFiltros({...filtros, cliente: e.target.value})}
                      placeholder="Buscar cliente..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={limpiarFiltros}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                >
                  Limpiar
                </button>
                <button
                  onClick={() => setShowFiltros(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={aplicarFiltros}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                >
                  Aplicar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalle */}
      {showDetalle && letraSeleccionada && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Detalle de Letra</h3>
                <button
                  onClick={() => setShowDetalle(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Número</label>
                  <p className="text-sm text-gray-900">{letraSeleccionada.Numero}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Cliente</label>
                  <p className="text-sm text-gray-900">{letraSeleccionada.NombreCliente}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Fecha Inicio</label>
                  <p className="text-sm text-gray-900">{formatDate(letraSeleccionada.FecIni)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Fecha Vencimiento</label>
                  <p className="text-sm text-gray-900">{formatDate(letraSeleccionada.FecVen)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Monto</label>
                  <p className="text-sm text-gray-900">{formatCurrency(letraSeleccionada.Monto)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Estado</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    getEstadoColor(letraSeleccionada.Estado) === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                    getEstadoColor(letraSeleccionada.Estado) === 'success' ? 'bg-green-100 text-green-800' :
                    getEstadoColor(letraSeleccionada.Estado) === 'error' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {getEstadoText(letraSeleccionada.Estado)}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Saldo Pendiente</label>
                  <p className="text-sm text-gray-900">{formatCurrency(letraSeleccionada.SaldoPendiente)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Días para Vencer</label>
                  <p className="text-sm text-gray-900">{letraSeleccionada.DiasParaVencer}</p>
                </div>
              </div>
              
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowDetalle(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
         </div>
       )}

       {/* Notificación de copia */}
       {copiado && (
         <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-bounce">
           <div className="flex items-center gap-2">
             <ClipboardDocumentIcon className="h-4 w-4" />
             <span className="text-sm font-medium">¡Datos copiados!</span>
           </div>
         </div>
       )}
     </div>
   );
 };

export default LetrasPage;
