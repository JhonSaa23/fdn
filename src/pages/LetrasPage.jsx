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
  const [letrasFiltradas, setLetrasFiltradas] = useState([]); // Letras filtradas para mostrar
  const [estadisticasCalculadas, setEstadisticasCalculadas] = useState(null); // Estadísticas calculadas del frontend
  
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

  // Función para calcular estadísticas desde los datos del frontend
  const calcularEstadisticas = (letrasData) => {
    const stats = {
      TotalLetras: letrasData.length,
      LetrasGeneradas: letrasData.filter(l => l.Estado === 1).length,
      LetrasCanceladas: letrasData.filter(l => l.Estado === 2).length,
      LetrasProtestadas: letrasData.filter(l => l.Estado === 3).length,
      LetrasAmortizadas: letrasData.filter(l => l.Estado === 4).length,
      LetrasObservadas: letrasData.filter(l => l.Estado === 5).length,
      TotalMonto: letrasData.reduce((sum, l) => sum + (parseFloat(l.Monto) || 0), 0),
      MontoPagado: letrasData.filter(l => l.Estado === 4).reduce((sum, l) => sum + (parseFloat(l.Monto) || 0), 0),
      MontoPendiente: letrasData.filter(l => l.Estado === 1).reduce((sum, l) => sum + (parseFloat(l.Monto) || 0), 0)
    };
    return stats;
  };

  // Cargar datos iniciales
  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      
      // Cargar solo las letras (las estadísticas se calcularán en el frontend)
      const letrasRes = await axiosClient.get('/letras');

      // Guardar todas las letras
      const todasLasLetrasData = letrasRes.data.data || [];
      setTodasLasLetras(todasLasLetrasData);
      
      // Calcular estadísticas desde todos los datos
      const statsCalculadas = calcularEstadisticas(todasLasLetrasData);
      setEstadisticasCalculadas(statsCalculadas);
      
      // Filtrar solo las letras pendientes por defecto
      const letrasPendientes = todasLasLetrasData.filter(letra => letra.Estado === 1);
      setLetras(letrasPendientes);
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
    
    // Recalcular estadísticas con todos los datos (sin filtros)
    const statsCompletas = calcularEstadisticas(todasLasLetras);
    setEstadisticasCalculadas(statsCompletas);
    
    // Volver a mostrar solo pendientes
    const letrasPendientes = todasLasLetras.filter(letra => letra.Estado === 1);
    const letrasLimitadas = letrasPendientes.slice(0, 100);
    setLetras(letrasLimitadas);
    setLetrasFiltradas(letrasPendientes);
  };


  const aplicarFiltroEstado = (estado) => {
    console.log('🔍 [FILTRO] Cambiando estado de', filtroActivo, 'a', estado);
    setFiltroActivo(estado);
    // Aplicar filtros inmediatamente con el nuevo estado
    aplicarFiltrosConEstado(estado);
  };

  const toggleFiltroCodigoBanco = () => {
    const nuevoEstado = !filtroCodigoBanco;
    console.log('Toggle filtro código banco:', nuevoEstado);
    setFiltroCodigoBanco(nuevoEstado);
    aplicarFiltrosReales();
  };

  const aplicarFiltrosConEstado = (estado) => {
    // Empezar con TODAS las letras
    let letrasParaEstadisticas = [...todasLasLetras];
    
    // Aplicar filtros de cliente y código de banco
    if (filtros.cliente) {
      const clienteBusqueda = filtros.cliente.toLowerCase();
      letrasParaEstadisticas = letrasParaEstadisticas.filter(letra => 
        (letra.NombreCliente || '').toLowerCase().includes(clienteBusqueda) ||
        (letra.Codclie || '').toString().toLowerCase().includes(clienteBusqueda)
      );
    }
    
    if (filtroCodigoBanco) {
      letrasParaEstadisticas = letrasParaEstadisticas.filter(letra => letra.CodBanco && letra.CodBanco.trim() !== '');
    }
    
    // Calcular estadísticas con TODOS los datos filtrados (sin filtrar por estado)
    const statsFiltradas = calcularEstadisticas(letrasParaEstadisticas);
    setEstadisticasCalculadas(statsFiltradas);
    
    // Filtrar por estado para mostrar solo las letras del estado especificado
    let letrasFiltradas = letrasParaEstadisticas.filter(letra => letra.Estado === estado);
    
    // Limitar a 100 registros para evitar sobrecargar la web
    const letrasLimitadas = letrasFiltradas.slice(0, 100);
    
    setLetras(letrasLimitadas);
    setLetrasFiltradas(letrasFiltradas);
    
    console.log('🔍 [FILTROS] Estado aplicado:', estado);
    console.log('🔍 [FILTROS] Letras filtradas:', letrasFiltradas.length);
    console.log('🔍 [FILTROS] Letras limitadas:', letrasLimitadas.length);
  };

  const aplicarFiltrosReales = () => {
    aplicarFiltrosConEstado(filtroActivo);
  };

  const handleClienteChange = (e) => {
    const nuevoCliente = e.target.value;
    setFiltros({...filtros, cliente: nuevoCliente});
    
    // Usar la misma lógica que aplicarFiltrosReales
    let letrasParaEstadisticas = [...todasLasLetras];
    
    // Aplicar filtros de cliente y código de banco
    if (nuevoCliente) {
      const clienteBusqueda = nuevoCliente.toLowerCase();
      letrasParaEstadisticas = letrasParaEstadisticas.filter(letra => 
        (letra.NombreCliente || '').toLowerCase().includes(clienteBusqueda) ||
        (letra.Codclie || '').toString().toLowerCase().includes(clienteBusqueda)
      );
    }
    
    if (filtroCodigoBanco) {
      letrasParaEstadisticas = letrasParaEstadisticas.filter(letra => letra.CodBanco && letra.CodBanco.trim() !== '');
    }
    
    // Calcular estadísticas con TODOS los datos filtrados (sin filtrar por estado)
    const statsFiltradas = calcularEstadisticas(letrasParaEstadisticas);
    setEstadisticasCalculadas(statsFiltradas);
    
    // Filtrar por estado para mostrar solo las letras del estado activo
    let letrasFiltradas = letrasParaEstadisticas.filter(letra => letra.Estado === filtroActivo);
    
    // Limitar a 100 registros
    const letrasLimitadas = letrasFiltradas.slice(0, 100);
    
    setLetras(letrasLimitadas);
    setLetrasFiltradas(letrasFiltradas);
    
    console.log('🔍 [CLIENTE] Estado activo:', filtroActivo);
    console.log('🔍 [CLIENTE] Cliente buscado:', nuevoCliente);
    console.log('🔍 [CLIENTE] Letras filtradas:', letrasFiltradas.length);
    console.log('🔍 [CLIENTE] Letras limitadas:', letrasLimitadas.length);
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

  const copiarDatosLetra = async (letra) => {
    try {
      const datos = `Letra: ${letra.Numero}
Cliente: ${letra.NombreCliente}
Código Banco: ${letra.CodBanco || 'N/A'}
Vencimiento: ${formatDate(letra.FecVen)}
Monto: ${formatCurrency(letra.Monto)}
Monto Pagado: ${formatCurrency(letra.MontoPagado)}
Estado: ${getEstadoText(letra.Estado)}
Días por vencer: ${calcularDiasPorVencer(letra.FecVen)}`;

      await navigator.clipboard.writeText(datos);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch (err) {
      console.error('Error al copiar datos de la letra:', err);
    }
  };


  const getEstadoColor = (estado) => {
    switch (estado) {
      case 1: return 'success';   // Generado - Verde
      case 2: return 'error';     // Cancelado - Rojo
      case 3: return 'error';     // Protestado - Rojo
      case 4: return 'warning';   // Amortizado - Amarillo
      case 5: return 'warning';   // Observada - Amarillo
      default: return 'default';
    }
  };

  const getEstadoText = (estado) => {
    switch (estado) {
      case 1: return 'Generado';
      case 2: return 'Cancelado';
      case 3: return 'Protestado';
      case 4: return 'Amortizado';
      case 5: return 'Observada';
      default: return 'Desconocido';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(amount);
  };

  const calcularDiasPorVencer = (fechaVencimiento) => {
    if (!fechaVencimiento) return '-';
    
    try {
      const hoy = new Date();
      const fechaVen = new Date(fechaVencimiento);
      const diffTime = fechaVen - hoy;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) {
        return `Vencido hace ${Math.abs(diffDays)} días`;
      } else if (diffDays === 0) {
        return 'Vence hoy';
      } else {
        return `${diffDays} días`;
      }
    } catch (error) {
      console.error('Error calculando días por vencer:', error);
      return '-';
    }
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
        className="p-3 border-b border-gray-100"
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
                <span className="font-medium text-left">Monto Pagado:</span>
                <span className="font-medium text-right">{formatCurrency(letra.MontoPagado)}</span>
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
      {estadisticasCalculadas && (
        <div className="bg-white rounded-lg shadow p-3 mb-3">
           {/* Estadísticas en grid */}
           <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 mb-3">
             <div className="flex items-center justify-center gap-1 px-2 py-1.5 bg-blue-50 text-blue-700 rounded text-xs">
               <DocumentTextIcon className="h-3 w-3" />
               Total: {estadisticasCalculadas?.TotalLetras || 0}
             </div>
             <button 
               onClick={() => aplicarFiltroEstado(1)}
               className={`flex items-center justify-center gap-1 px-2 py-1.5 rounded text-xs transition-colors ${
                 filtroActivo === 1 
                   ? 'bg-green-200 text-green-800 border-2 border-green-400' 
                   : 'bg-green-50 text-green-700 hover:bg-green-100'
               }`}
             >
               <ChartBarIcon className="h-3 w-3" />
               Gen: {estadisticasCalculadas?.LetrasGeneradas || 0}
             </button>
             <button 
               onClick={() => aplicarFiltroEstado(2)}
               className={`flex items-center justify-center gap-1 px-2 py-1.5 rounded text-xs transition-colors ${
                 filtroActivo === 2 
                   ? 'bg-red-200 text-red-800 border-2 border-red-400' 
                   : 'bg-red-50 text-red-700 hover:bg-red-100'
               }`}
             >
               <ChartBarIcon className="h-3 w-3" />
               Can: {estadisticasCalculadas?.LetrasCanceladas || 0}
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
               Pro: {estadisticasCalculadas?.LetrasProtestadas || 0}
             </button>
          <button
               onClick={() => aplicarFiltroEstado(4)}
               className={`flex items-center justify-center gap-1 px-2 py-1.5 rounded text-xs transition-colors ${
                 filtroActivo === 4 
                   ? 'bg-yellow-200 text-yellow-800 border-2 border-yellow-400' 
                   : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
               }`}
             >
               <ChartBarIcon className="h-3 w-3" />
               Amo: {estadisticasCalculadas?.LetrasAmortizadas || 0}
          </button>
             <button 
               onClick={() => aplicarFiltroEstado(5)}
               className={`flex items-center justify-center gap-1 px-2 py-1.5 rounded text-xs transition-colors ${
                 filtroActivo === 5 
                   ? 'bg-yellow-200 text-yellow-800 border-2 border-yellow-400' 
                   : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
               }`}
             >
               <ChartBarIcon className="h-3 w-3" />
               Obs: {estadisticasCalculadas?.LetrasObservadas || 0}
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
        </div>
      )}


      {/* Lista de Letras en formato párrafos */}
      <div className="bg-white rounded-lg shadow">
         <div className="px-3 py-3 border-b border-gray-200">
           <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">
               Lista de Letras ({letras.length}{letrasFiltradas.length > letras.length ? ` de ${letrasFiltradas.length}` : ''})
          </h2>
        </div>
           {letrasFiltradas.length > 100 && (
             <div className="mt-2 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
               Mostrando los primeros 100 registros. Usa el filtro de cliente para buscar específicamente.
             </div>
           )}
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
                      Acciones
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Código Banco
                </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fechas
                </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monto/Saldo
                </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
               {letras.map((letra) => (
                 <tr key={letra.Numero} className="hover:bg-gray-50">
                    <td className="px-3 py-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copiarDatosLetra(letra);
                        }}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200 transition-colors"
                      >
                        <ClipboardDocumentIcon className="h-3 w-3" />
                        Datos
                      </button>
                    </td>
                    <td className="px-3 py-2">
                      <div className="text-sm text-gray-900">
                        {letra.NombreCliente}
                      </div>
                      <div className="text-xs text-gray-500">
                        #{letra.Numero} - {letra.Codclie}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-900">
                      {letra.CodBanco ? (
                        <div className="flex items-center gap-2">
                          <span>{letra.CodBanco}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              copiarCodigoBanco(letra.CodBanco);
                            }}
                            className="inline-flex items-center justify-center w-6 h-6 bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors"
                            title="Copiar código de banco"
                          >
                            <ClipboardDocumentIcon className="h-3 w-3" />
                          </button>
                        </div>
                      ) : '-'}
                    </td>
                    <td className="px-3 py-2">
                      <div className="text-sm text-gray-900">
                        <span className="text-xs text-gray-500">F.inicio:</span> {formatDate(letra.FecIni)}
                      </div>
                      <div className="text-sm text-gray-900">
                        <span className="text-xs text-gray-500">F.Venc:</span> {formatDate(letra.FecVen)}
                      </div>
                  </td>
                    <td className="px-3 py-2">
                      <div className="text-sm text-gray-900">
                    {formatCurrency(letra.Monto)}
                      </div>
                      <div className="text-xs text-gray-500">
                        Monto Pagado: {formatCurrency(letra.MontoPagado)}
                      </div>
                  </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-col items-start gap-1">
                        <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                      getEstadoColor(letra.Estado) === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                      getEstadoColor(letra.Estado) === 'success' ? 'bg-green-100 text-green-800' :
                      getEstadoColor(letra.Estado) === 'error' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {getEstadoText(letra.Estado)}
                    </span>
                        <div className="text-xs text-gray-500">
                          {calcularDiasPorVencer(letra.FecVen)}
                        </div>
                      </div>
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
                  <label className="block text-sm font-medium text-gray-500 mb-1">Monto Pagado</label>
                  <p className="text-sm text-gray-900">{formatCurrency(letraSeleccionada.MontoPagado)}</p>
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
