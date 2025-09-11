import { useState, useEffect } from 'react';
import { useNotification } from '../App';
import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  XMarkIcon,
  TrashIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import axiosClient from '../services/axiosClient';

const Movimientos = () => {
  const { showNotification } = useNotification();
  
  // Estados principales
  const [loading, setLoading] = useState(false);
  const [numeroMovimiento, setNumeroMovimiento] = useState('');
  const [fechaMovimiento, setFechaMovimiento] = useState(() => {
    const hoy = new Date();
    const año = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const dia = String(hoy.getDate()).padStart(2, '0');
    return `${año}-${mes}-${dia}`;
  });
  
  // Estados para modales
  const [showOpcionesSalida, setShowOpcionesSalida] = useState(false);
  const [showModalSaldos, setShowModalSaldos] = useState(false);
  const [showModalProducto, setShowModalProducto] = useState(false);
  
  // Estados para datos
  const [opcionesSalida, setOpcionesSalida] = useState([]);
  const [opcionSeleccionada, setOpcionSeleccionada] = useState(null);
  const [tipoMovimiento, setTipoMovimiento] = useState('entrada');
  const [productoBuscado, setProductoBuscado] = useState('');
  const [productoEncontrado, setProductoEncontrado] = useState(null);
  const [saldosProducto, setSaldosProducto] = useState([]);
  const [saldoSeleccionado, setSaldoSeleccionado] = useState(null);
  
  // Estados para el formulario de movimiento
  const [formularioMovimiento, setFormularioMovimiento] = useState({
    codpro: '',
    nombre: '',
    lote: '',
    stock: 0,
    pCosto: 0,
    precioReal: 0,
    fechaVencimiento: '',
    almacen: '',
    cantidad: 0
  });
  
  // Estados para la grilla de productos
  const [productosAgregados, setProductosAgregados] = useState([]);
  
  // Función para generar nuevo número de movimiento
  const handleNuevo = async () => {
    try {
      setLoading(true);
      
      const response = await axiosClient.post('/movimientos/generar-numero');
      
      if (response.data.success) {
        const numero = response.data.numero;
        
        setNumeroMovimiento(numero);
        const hoy = new Date();
        const año = hoy.getFullYear();
        const mes = String(hoy.getMonth() + 1).padStart(2, '0');
        const dia = String(hoy.getDate()).padStart(2, '0');
        setFechaMovimiento(`${año}-${mes}-${dia}`);
        // NO limpiar productosAgregados - mantener los productos ya agregados
        setOpcionSeleccionada(null);
        setProductoEncontrado(null);
        setSaldoSeleccionado(null);
        
        showNotification('success', `Nuevo movimiento creado: ${numero}`);
      } else {
        showNotification('error', response.data.message || 'Error al generar número de movimiento');
      }
    } catch (error) {
      console.error('❌ Error al generar número:', error);
      console.error('❌ Error response:', error.response?.data);
      showNotification('error', error.response?.data?.message || 'Error al generar número de movimiento');
    } finally {
      setLoading(false);
    }
  };
  
  // Función para cargar opciones según el tipo de movimiento
  const cargarOpcionesTipo = async (tipo) => {
    try {
      setLoading(true);
      const codigo = tipo === 'entrada' ? 8 : 9;
      const response = await axiosClient.get(`/movimientos/opciones-tipo/${codigo}`);
      
      if (response.data.success) {
        setOpcionesSalida(response.data.data);
      } else {
        showNotification('error', response.data.message || `Error al cargar opciones de ${tipo}`);
      }
    } catch (error) {
      console.error(`❌ Error al cargar opciones de ${tipo}:`, error);
      console.error('❌ Error response:', error.response?.data);
      showNotification('error', error.response?.data?.message || `Error al cargar opciones de ${tipo}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Función para seleccionar opción de salida
  const seleccionarOpcionSalida = (opcion) => {
    setOpcionSeleccionada(opcion);
    showNotification('success', `Tipo seleccionado: ${opcion.c_describe}`);
  };

  // Cargar opciones de entrada por defecto al montar el componente
  useEffect(() => {
    cargarOpcionesTipo('entrada');
  }, []);
  
  // Función para buscar producto
  const buscarProducto = async () => {
    if (!productoBuscado.trim()) {
      showNotification('warning', 'Ingrese un código de producto');
      return;
    }
    
    try {
      setLoading(true);
      // Cerrar modales previos
      setShowModalSaldos(false);
      setShowModalProducto(false);
      const response = await axiosClient.get(`/movimientos/buscar-producto/${productoBuscado.trim()}`);
      
      if (response.data.success) {
        // Verificar bloqueo del producto
        const bloqueoResponse = await axiosClient.get(`/movimientos/verificar-bloqueo-producto/${productoBuscado.trim()}`);
        
        if (bloqueoResponse.data.success && bloqueoResponse.data.bloqueado) {
          showNotification('error', 'El producto está bloqueado y no se puede usar');
          setProductoEncontrado(null);
          return;
        }
        
        setProductoEncontrado(response.data.data);
        
        // Actualizar el formulario con los datos del producto encontrado
        setFormularioMovimiento(prev => ({
          ...prev,
          codpro: response.data.data.codpro,
          nombre: response.data.data.nombre,
          pCosto: response.data.data.costo,
          precioReal: response.data.data.pventaMa
        }));
        
        // Si hay saldos, mostrarlos en el modal
        if (response.data.saldos && response.data.saldos.length > 0) {
          setSaldosProducto(response.data.saldos);
          setShowModalSaldos(true);
        } else {
          showNotification('warning', 'Producto encontrado pero sin saldos disponibles');
        }
        
        showNotification('success', 'Producto encontrado');
      } else {
        showNotification('error', response.data.message || 'Producto no encontrado');
        setProductoEncontrado(null);
      }
    } catch (error) {
      console.error('❌ Error al buscar producto:', error);
      console.error('❌ Error response:', error.response?.data);
      showNotification('error', error.response?.data?.message || 'Error al buscar producto');
    } finally {
      setLoading(false);
    }
  };
  
  // Función para cargar saldos del producto
  const cargarSaldosProducto = async (codpro) => {
    try {
      const response = await axiosClient.get(`/movimientos/saldos-producto/${codpro}`);
      if (response.data.success) {
        setSaldosProducto(response.data.data);
        setShowModalSaldos(true);
      } else {
        showNotification('error', 'Error al cargar saldos del producto');
      }
    } catch (error) {
      console.error('Error al cargar saldos:', error);
      showNotification('error', 'Error al cargar saldos del producto');
    }
  };
  
  // Función para obtener el nombre del almacén basado en el número
  const obtenerNombreAlmacen = (numeroAlmacen) => {
    if (!numeroAlmacen || !saldosProducto || saldosProducto.length === 0) {
      return '';
    }
    
    const saldoEncontrado = saldosProducto.find(saldo => saldo.almacenNumero === numeroAlmacen);
    return saldoEncontrado ? saldoEncontrado.almacen : '';
  };

  // Función para seleccionar saldo
  const seleccionarSaldo = (saldo) => {
    
    // Formatear la fecha para el input de tipo date
    let fechaFormateada = '';
    if (saldo.fechaVencimiento) {
      try {
        const fecha = new Date(saldo.fechaVencimiento);
        fechaFormateada = fecha.toISOString().split('T')[0];
      } catch (error) {
        console.error('❌ Error al formatear fecha:', error);
      }
    }
    
    setSaldoSeleccionado(saldo);
    setFormularioMovimiento(prev => ({
      ...prev,
      lote: saldo.lote,
      stock: saldo.stock,
      fechaVencimiento: fechaFormateada, // Usar la fecha formateada
      almacen: saldo.almacen,
      almacenNumero: saldo.almacenNumero,
      cantidad: 0
    }));
    setShowModalSaldos(false);
    setShowModalProducto(false);
    
    showNotification('success', `Saldo seleccionado: ${saldo.almacen} - ${saldo.stock} unidades`);
  };
  
  // Función para agregar producto a la grilla
  const agregarProducto = async () => {
    if (formularioMovimiento.cantidad <= 0) {
      showNotification('warning', 'Ingrese una cantidad válida');
      return;
    }
    
    if (formularioMovimiento.cantidad > formularioMovimiento.stock) {
      showNotification('warning', 'La cantidad no puede ser mayor al stock disponible');
      return;
    }
    
    if (!opcionSeleccionada) {
      showNotification('warning', 'Debe seleccionar un tipo de movimiento');
      return;
    }
    
    // Verificar bloqueo del producto antes de agregar
    try {
      const bloqueoResponse = await axiosClient.get(`/movimientos/verificar-bloqueo-producto/${formularioMovimiento.codpro}`);
      
      if (bloqueoResponse.data.success && bloqueoResponse.data.bloqueado) {
        showNotification('error', 'El producto está bloqueado y no se puede agregar');
        return;
      }
    } catch (error) {
      console.error('❌ Error al verificar bloqueo:', error);
      showNotification('error', 'Error al verificar bloqueo del producto');
      return;
    }
    
    const nuevoProducto = {
      ...formularioMovimiento,
      movin: tipoMovimiento === 'entrada' ? 1 : 2, // 1 para Entrada, 2 para Salida
      clase: opcionSeleccionada ? opcionSeleccionada.n_numero : 0, // n_numero de la opción seleccionada
      id: Date.now() // ID temporal para la grilla
    };
    
    
    setProductosAgregados(prev => [...prev, nuevoProducto]);
    
    // Limpiar formulario
    setFormularioMovimiento({
      codpro: '',
      nombre: '',
      lote: '',
      stock: 0,
      pCosto: 0,
      precioReal: 0,
      fechaVencimiento: '',
      almacen: '',
      cantidad: 0
    });
    setSaldoSeleccionado(null);
    
    showNotification('success', 'Producto agregado a la grilla');
  };
  
  // Función para eliminar producto de la grilla
  const eliminarProducto = (id) => {
    setProductosAgregados(prev => prev.filter(p => p.id !== id));
    showNotification('success', 'Producto eliminado de la grilla');
  };
  
  // Función para registrar movimiento
  const registrarMovimiento = async () => {
    if (productosAgregados.length === 0) {
      showNotification('warning', 'Debe agregar al menos un producto');
      return;
    }
    
    if (!numeroMovimiento) {
      showNotification('warning', 'Debe generar un número de movimiento');
      return;
    }
    
    if (!opcionSeleccionada) {
      showNotification('warning', 'Debe seleccionar un tipo de movimiento');
      return;
    }
    
    try {
      setLoading(true);
      const data = {
        numeroMovimiento,
        fechaMovimiento,
        tipoMovimiento, // Incluir el tipo de movimiento (entrada/salida)
        opcionSalida: opcionSeleccionada,
        productos: productosAgregados
      };
      
      
      const response = await axiosClient.post('/movimientos/registrar', data);
      if (response.data.success) {
        showNotification('success', 'Movimiento registrado correctamente');
        // Limpiar formulario
        setProductosAgregados([]);
        setNumeroMovimiento('');
        setOpcionSeleccionada(null);
      } else {
        showNotification('error', response.data.message || 'Error al registrar movimiento');
      }
    } catch (error) {
      console.error('Error al registrar movimiento:', error);
      showNotification('error', 'Error al registrar movimiento');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <>
    <div className="flex h-screen bg-gray-100">
      {/* Contenido Principal */}
      <div className="flex-1 p-4">
        

        {/* Sección de Documento */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ingrese observaciones..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Documento</label>
              <input
                type="text"
                value={numeroMovimiento}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                placeholder="Número de documento"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
              <input
                type="date"
                value={fechaMovimiento}
                onChange={(e) => setFechaMovimiento(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  defaultChecked
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Considera Vencidos</span>
              </label>
            </div>
          </div>
        </div>

        {/* Línea Separadora */}
        <div className="border-t border-gray-300 my-4"></div>
        
        {/* Sección de Movimiento y Producto */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-4">
          {/* Radio Buttons para Entrada/Salida */}
          <div className="flex items-center gap-6 mb-4">
            <div className="flex items-center gap-2">
              <input
                type="radio"
                id="entrada"
                name="tipoMovimiento"
                value="entrada"
                checked={tipoMovimiento === 'entrada'}
                onChange={(e) => {
                  setTipoMovimiento('entrada');
                  setOpcionSeleccionada(null);
                  cargarOpcionesTipo('entrada');
                }}
                className="text-blue-600"
              />
              <label htmlFor="entrada" className="text-sm font-medium text-gray-700">Entrada</label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="radio"
                id="salida"
                name="tipoMovimiento"
                value="salida"
                checked={tipoMovimiento === 'salida'}
                onChange={(e) => {
                  setTipoMovimiento('salida');
                  setOpcionSeleccionada(null);
                  cargarOpcionesTipo('salida');
                }}
                className="text-blue-600"
              />
              <label htmlFor="salida" className="text-sm font-medium text-gray-700">Salida</label>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Tipo:</label>
              <select
                className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={opcionSeleccionada ? opcionSeleccionada.n_numero : ''}
                onChange={(e) => {
                  const opcionId = parseInt(e.target.value);
                  const opcion = opcionesSalida.find(o => o.n_numero === opcionId);
                  if (opcion) {
                    seleccionarOpcionSalida(opcion);
                  }
                }}
              >
                <option value="">Seleccionar tipo...</option>
                {opcionesSalida.map((opcion) => (
                  <option key={opcion.n_numero} value={opcion.n_numero}>
                    {opcion.c_describe}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Campos de Producto */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Producto</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={productoBuscado}
                  onChange={(e) => setProductoBuscado(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && buscarProducto()}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Código de producto"
                />
                <button
                  onClick={buscarProducto}
                  disabled={loading}
                  className="px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
                >
                  ...
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Producto</label>
              <input
                type="text"
                value={productoEncontrado?.nombre || ''}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                placeholder="Nombre del producto"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
              <input
                type="number"
                value={formularioMovimiento.stock}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                placeholder="Stock disponible"
              />
            </div>
          </div>

          {/* Segunda fila de campos */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lote</label>
              <input
                type="text"
                value={formularioMovimiento.lote}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                placeholder="Número de lote"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Vencimiento</label>
              <input
                type="date"
                value={formularioMovimiento.fechaVencimiento ? new Date(formularioMovimiento.fechaVencimiento).toISOString().split('T')[0] : ''}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                placeholder="dd/mm/aaaa"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Almacén</label>
              <input
                type="number"
                value={formularioMovimiento.almacenNumero || ''}
                onChange={(e) => {
                  const numeroAlmacen = parseInt(e.target.value);
                  setFormularioMovimiento(prev => ({
                    ...prev,
                    almacenNumero: numeroAlmacen,
                    almacen: obtenerNombreAlmacen(numeroAlmacen)
                  }));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Número de almacén"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">_________</label>
              <input
                type="text"
                value={formularioMovimiento.almacen || ''}
                readOnly
                className="w-full px-3 py-2 border border-red-300 rounded-md bg-red-50 text-red-700"
                placeholder="Nombre del almacén"
              />
            </div>
          </div>

          {/* Tercera fila de campos */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
              <input
                type="number"
                value={formularioMovimiento.cantidad}
                onChange={(e) => setFormularioMovimiento(prev => ({
                  ...prev,
                  cantidad: parseFloat(e.target.value) || 0
                }))}
                min="0"
                max={formularioMovimiento.stock}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Cantidad a mover"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">P. Costo</label>
              <input
                type="number"
                value={formularioMovimiento.pCosto}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                placeholder="Precio de costo"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Precio</label>
              <input
                type="number"
                value={formularioMovimiento.precioReal}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                placeholder="Precio real"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={agregarProducto}
                disabled={!saldoSeleccionado}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Agrega
              </button>
            </div>
          </div>
        </div>
        
        {/* Grilla de Productos */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-[65px_2fr_120px_100px_60px_60px_80px_80px] gap-2 mb-4">
            <div className="bg-gray-100 p-2 rounded text-center text-sm font-medium">Codpro</div>
            <div className="bg-gray-100 p-2 rounded text-center text-sm font-medium">Producto</div>
            <div className="bg-gray-100 p-2 rounded text-center text-sm font-medium">Lote</div>
            <div className="bg-gray-100 p-2 rounded text-center text-sm font-medium">FechaV</div>
            <div className="bg-gray-100 p-2 rounded text-center text-sm font-medium">Movin</div>
            <div className="bg-gray-100 p-2 rounded text-center text-sm font-medium">Clase</div>
            <div className="bg-gray-100 p-2 rounded text-center text-sm font-medium">Cantida</div>
            <div className="bg-gray-100 p-2 rounded text-center text-sm font-medium">Costo</div>
          </div>
          
          {productosAgregados.length > 0 ? (
            productosAgregados.map((producto) => (
              <div key={producto.id} className="grid grid-cols-[65px_2fr_120px_100px_60px_60px_80px_80px] gap-2 mb-2 p-2 border border-gray-200 rounded bg-green-50">
                <div className="text-sm text-center truncate" title={producto.codpro}>{producto.codpro}</div>
                <div className="text-sm text-left truncate px-1" title={producto.nombre}>{producto.nombre}</div>
                <div className="text-sm text-center truncate" title={producto.lote}>{producto.lote}</div>
                <div className="text-sm text-center truncate" title={producto.fechaVencimiento ? new Date(producto.fechaVencimiento).toLocaleDateString('es-ES') : ''}>
                  {producto.fechaVencimiento ? new Date(producto.fechaVencimiento).toLocaleDateString('es-ES') : ''}
                </div>
                <div className="text-sm text-center">{producto.movin}</div>
                <div className="text-sm text-center">{producto.clase}</div>
                <div className="text-sm text-center">{producto.cantidad}</div>
                <div className="text-sm text-center">{producto.pCosto}</div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 py-8">
              No hay productos agregados
            </div>
          )}
        </div>
      </div>

      {/* Sidebar de Botones */}
      <div className="w-48 bg-white border-l border-gray-200 p-4 flex flex-col gap-2">
        <button
          onClick={handleNuevo}
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Nuevo
        </button>
        
        <button
          disabled={true}
          className="w-full px-4 py-2 bg-gray-300 text-gray-500 rounded-md cursor-not-allowed"
        >
          Detalles
        </button>
        
        <button
          onClick={() => setShowModalProducto(true)}
          className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
        >
          Busca
        </button>
        
        <button
          disabled={true}
          className="w-full px-4 py-2 bg-gray-300 text-gray-500 rounded-md cursor-not-allowed"
        >
          Eliminar
        </button>
        
        <button
          disabled={true}
          className="w-full px-4 py-2 bg-gray-300 text-gray-500 rounded-md cursor-not-allowed"
        >
          Imprimir
        </button>
        
        <div className="border-t border-gray-300 my-2"></div>
        
        <button
          onClick={registrarMovimiento}
          disabled={loading || productosAgregados.length === 0 || !numeroMovimiento}
          className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title={
            !numeroMovimiento 
              ? "Debe generar un número de movimiento primero" 
              : productosAgregados.length === 0 
                ? "Debe agregar al menos un producto" 
                : "Registrar movimiento"
          }
        >
          Registrar
        </button>
        
        <button
          onClick={() => {
            setProductosAgregados([]);
            setNumeroMovimiento('');
            setOpcionSeleccionada(null);
            setProductoEncontrado(null);
            setSaldoSeleccionado(null);
          }}
          className="w-full px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
        >
          Cancelar
        </button>
        
        <button
          onClick={() => window.history.back()}
          className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
        >
          Salir
        </button>
      </div>
    </div>
      
      {/* Modal de Opciones de Salida */}
      {showOpcionesSalida && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Opciones de Salida</h3>
                <button
                  onClick={() => setShowOpcionesSalida(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-2">
                {opcionesSalida.map((opcion) => (
                  <button
                    key={opcion.n_numero}
                    onClick={() => seleccionarOpcionSalida(opcion)}
                    className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="font-medium text-gray-900">{opcion.c_describe}</div>
                    {opcion.conversion && (
                      <div className="text-sm text-gray-500">Conversión: {opcion.conversion}</div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* Modal de Saldos */}
        {showModalSaldos && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
              {/* Header con campos de producto */}
              <div className="bg-gray-50 p-4 border-b">
                <div className="flex items-center gap-4 mb-2">
                  <label className="text-sm font-medium text-gray-700">Codigo Producto:</label>
                  <input
                    type="text"
                    value={productoEncontrado?.codpro || ''}
                    readOnly
                    className="px-3 py-1 border border-gray-300 rounded bg-gray-100 text-sm"
                  />
                  <input
                    type="text"
                    value={productoEncontrado?.nombre || ''}
                    readOnly
                    className="flex-1 px-3 py-1 border border-gray-300 rounded bg-gray-100 text-sm"
                  />
                </div>
              </div>
              
              {/* Título del modal */}
              <div className="p-4 text-center">
                <h3 className="text-lg font-semibold text-gray-900">
                  ESCOJA EL ALMACEN A DESCARGAR
                </h3>
              </div>
              
              {/* Tabla de saldos */}
              <div className="px-4 pb-4">
                <div className="bg-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-300">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-r border-gray-400">
                          Nro
                        </th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-r border-gray-400">
                          Almacén
                        </th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-r border-gray-400">
                          Saldo
                        </th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-r border-gray-400">
                          Lote
                        </th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                          Vencimiento
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {saldosProducto && saldosProducto.length > 0 ? (
                        saldosProducto.map((saldo, index) => (
                          <tr 
                            key={index} 
                            className="hover:bg-yellow-100 cursor-pointer border-b border-gray-200"
                            onClick={() => seleccionarSaldo(saldo)}
                          >
                            <td className="px-4 py-2 text-sm text-gray-900 border-r border-gray-200">
                              {saldo.almacenNumero}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-900 border-r border-gray-200">
                              {saldo.almacen}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-900 border-r border-gray-200">
                              {saldo.stock}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-900 border-r border-gray-200">
                              {saldo.lote}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-900">
                              {saldo.fechaVencimiento ? new Date(saldo.fechaVencimiento).toLocaleDateString() : ''}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                            No hay saldos disponibles para este producto
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              
              {/* Botón cerrar */}
              <div className="flex justify-end p-4 border-t">
                <button
                  onClick={() => setShowModalSaldos(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
    </>
  );
};

export default Movimientos;
