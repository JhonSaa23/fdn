import React, { useState, useEffect } from 'react';
import axios from '../services/axiosClient';
import { useNotification } from '../App';
import { obtenerTodosLosProductos } from '../services/api';

const ConsultaProductos = () => {
    const { showNotification } = useNotification();
    const [codProducto, setCodProducto] = useState('');
    const [loading, setLoading] = useState(false);
    const [resultados, setResultados] = useState([]);
    const [modalAbierto, setModalAbierto] = useState(false);
    const [detalleSaldo, setDetalleSaldo] = useState(null);
    const [cargandoDetalle, setCargandoDetalle] = useState(false);

    // Estados para el autocompletado de productos
    const [busquedaProducto, setBusquedaProducto] = useState('');
    const [todosLosProductos, setTodosLosProductos] = useState([]);
    const [productosFiltrados, setProductosFiltrados] = useState([]);
    const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
    const [cargandoProductos, setCargandoProductos] = useState(false);

    // Función para cargar todos los productos
    const cargarTodosLosProductos = async () => {
        try {
            setCargandoProductos(true);
            const productos = await obtenerTodosLosProductos();
            setTodosLosProductos(productos);
            
            if (productos.length === 0) {
                showNotification('No se encontraron productos en la base de datos', 'warning');
            }
        } catch (error) {
            console.error('Error al cargar productos:', error);
            let mensaje = 'Error al cargar la lista de productos';
            
            if (error.response?.data) {
                const { type, details } = error.response.data;
                if (type === 'CONNECTION_ERROR') {
                    mensaje = 'Error de conexión con la base de datos. Por favor, intente nuevamente.';
                } else {
                    mensaje = `Error al cargar productos: ${details}`;
                }
            }
            
            showNotification(mensaje, 'error');
            setTodosLosProductos([]);
        } finally {
            setCargandoProductos(false);
        }
    };

    // Función para filtrar productos localmente
    const filtrarProductos = (busqueda) => {
        if (!busqueda) {
            setProductosFiltrados([]);
            return;
        }

        const busquedaLower = busqueda.toLowerCase();
        const resultados = todosLosProductos.filter(producto => 
            producto.codpro.toLowerCase().includes(busquedaLower) ||
            producto.nombre.toLowerCase().includes(busquedaLower)
        ).slice(0, 50); // Limitamos a 50 resultados

        setProductosFiltrados(resultados);
    };

    // Efecto para filtrar productos cuando cambia la búsqueda
    useEffect(() => {
        filtrarProductos(busquedaProducto);
    }, [busquedaProducto, todosLosProductos]);

    // Efecto para cerrar las sugerencias al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (event) => {
            const sugerenciasElement = document.querySelector('.sugerencias-productos');
            const inputElement = document.querySelector('.input-producto');
            
            if (sugerenciasElement && inputElement) {
                if (!sugerenciasElement.contains(event.target) && !inputElement.contains(event.target)) {
                    setMostrarSugerencias(false);
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSeleccionarProducto = (producto) => {
        // Obtener el input actual
        const inputActual = codProducto.trim();
        
        // Dividir por comas para obtener los códigos existentes
        const codigosArray = inputActual.split(',').map(codigo => codigo.trim());
        
        // Quitar el último elemento (que es la búsqueda actual) y agregar el nuevo código
        codigosArray.pop();
        codigosArray.push(producto.codpro);
        
        // Crear el nuevo valor con coma al final para seguir escribiendo
        const nuevoCodigo = codigosArray.join(',') + ',';
        
        setCodProducto(nuevoCodigo);
        setBusquedaProducto(''); // Limpiar búsqueda
        setMostrarSugerencias(false);
    };

    const handleInputChange = (e) => {
        const value = e.target.value;
        setCodProducto(value);
        
        // Obtener la última parte después de la última coma para la búsqueda
        const ultimoCodigo = value.split(',').pop().trim();
        setBusquedaProducto(ultimoCodigo);
        
        if (ultimoCodigo.length > 0) {
            setMostrarSugerencias(true);
            // Cargar productos si no están cargados
            if (todosLosProductos.length === 0 && !cargandoProductos) {
                cargarTodosLosProductos();
            }
        } else {
            setMostrarSugerencias(false);
        }
    };

    const handleConsultar = async () => {
        if (!codProducto.trim()) {
            showNotification('Ingrese al menos un código de producto', 'error');
            return;
        }

        try {
            setLoading(true);
            const response = await axios.get(`/productos/consulta/${codProducto.trim()}`);
            setResultados(response.data);
        } catch (error) {
            console.error('Error al consultar productos:', error);
            showNotification(
                error.response?.data?.message || 'Error al consultar productos',
                'error'
            );
            setResultados([]);
        } finally {
            setLoading(false);
        }
    };

    const handleVerDetalle = async (saldo, producto) => {
        try {
            setCargandoDetalle(true);
            const response = await axios.get(
                `/productos/saldo-detalle/${producto.CodPro}/${saldo.lote}/${saldo.vencimiento}`
            );
            
            if (response.data.success) {
                setDetalleSaldo(response.data.data);
                setModalAbierto(true);
            } else {
                showNotification('No se pudo obtener la información detallada', 'error');
            }
        } catch (error) {
            console.error('Error al obtener detalle del saldo:', error);
            showNotification(
                error.response?.data?.message || 'Error al obtener información detallada',
                'error'
            );
        } finally {
            setCargandoDetalle(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            // Si hay sugerencias visibles y hay al menos una, seleccionar la primera
            if (mostrarSugerencias && productosFiltrados.length > 0) {
                handleSeleccionarProducto(productosFiltrados[0]);
            } else {
                handleConsultar();
            }
        }
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;

        const formatNumber = (num) => num.toString().padStart(2, '0');

        const year = date.getFullYear();
        const month = formatNumber(date.getMonth() + 1);
        const day = formatNumber(date.getDate());

        return `${year}-${month}-${day}`;
    };

    const totalUbicaciones = resultados.reduce((total, r) => total + r.saldos.length, 0);

    return (
        <div className="bg-white rounded-lg shadow ">
            {/* Formulario de consulta */}
            <div className="p-2 border-b bg-gray-50">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-medium text-gray-700">Consulta de Productos</h3>
                    <button
                        onClick={handleConsultar}
                        disabled={loading}
                        className="inline-flex items-center px-4 py-1 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
                            'Consultar'
                        )}
                    </button>
                </div>

                <div className="relative">
                    <input
                        type="text"
                        value={codProducto}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyPress}
                        className="w-full px-3 py-1 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 input-producto"
                        placeholder="Códigos de productos separados por comas (ej: 001,002,003) - Escriba para buscar"
                    />
                    
                    {/* Lista de sugerencias */}
                    {mostrarSugerencias && (busquedaProducto || cargandoProductos) && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto sugerencias-productos">
                            {cargandoProductos ? (
                                <div className="p-2 text-gray-500">
                                    <div className="flex items-center justify-center">
                                        <svg className="animate-spin h-5 w-5 mr-2 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Cargando productos...
                                    </div>
                                </div>
                            ) : productosFiltrados.length > 0 ? (
                                productosFiltrados.map((producto) => (
                                    <div
                                        key={producto.codpro}
                                        onClick={() => handleSeleccionarProducto(producto)}
                                        className="p-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                                    >
                                        <div className="font-medium text-blue-600">{producto.codpro}</div>
                                        <div className="text-sm text-gray-600">{producto.nombre}</div>
                                    </div>
                                ))
                            ) : busquedaProducto ? (
                                <div className="p-2 text-gray-500">No se encontraron productos</div>
                            ) : todosLosProductos.length === 0 ? (
                                <div className="p-2 text-gray-500">No hay productos disponibles</div>
                            ) : null}
                        </div>
                    )}
                </div>
            </div>

            {/* Resultados */}
            <div className="divide-y divide-gray-200 max-h-[calc(100vh-120px)] overflow-y-auto">
                {resultados.map((resultado, index) => (
                    <div key={index} className="">
                        <div className="border-b border-gray-200">
                            <div className="p-4">
                                <h4 className="mb-1 text-sm font-medium text-gray-900">
                                    {resultado.producto.Nombre}
                                </h4>
                                <div className='flex items-center justify-between'>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Código: {resultado.producto.CodPro}
                                    </p>
                                    <div className="bg-blue-50 text-blue-600 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                        {resultado.saldos.length} ubicaciones
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="pl-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Almacén
                                        </th>
                                        <th scope="col" className="pl-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Saldo
                                        </th>
                                        <th scope="col" className="pl-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Lote
                                        </th>
                                        <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Vencimiento
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {resultado.saldos.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" className="px-3 py-4 text-sm text-center text-gray-500">
                                                No se encontraron saldos para este producto
                                            </td>
                                        </tr>
                                    ) : (
                                        resultado.saldos.map((saldo, saldoIndex) => (
                                            <tr 
                                                key={saldoIndex} 
                                                onClick={() => handleVerDetalle(saldo, resultado.producto)}
                                                className={`hover:bg-blue-50 cursor-pointer transition-colors duration-150 ${cargandoDetalle ? 'opacity-50' : ''}`}
                                            >
                                                <td className="pl-3 py-2 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">{saldo.nombreAlmacen}</div>
                                                    <div className="text-xs text-gray-500">#{saldo.numeroAlmacen}</div>
                                                </td>
                                                <td className="pl-3 py-2 whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${saldo.saldo > 0
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-red-100 text-red-800'
                                                        }`}>
                                                        {saldo.saldo}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                                                    {saldo.lote || '-'}
                                                </td>
                                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                                                    <div className="flex items-center justify-between">
                                                        <span>{formatDateTime(saldo.vencimiento) || '-'}</span>
                                                        <svg className="h-4 w-4 text-gray-400 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                        </svg>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal de información detallada */}
            {modalAbierto && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                            <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={() => setModalAbierto(false)}></div>
                        </div>

                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="sm:flex sm:items-start">
                                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                                            Información Detallada del Saldo
                                        </h3>
                                        
                                        {detalleSaldo && (
                                            <div className="space-y-4">
                                                
                                                {/* Facturas de compra */}
                                                <div>
                                                    
                                                    {detalleSaldo.facturas && detalleSaldo.facturas.length > 0 ? (
                                                        <div className="space-y-3">
                                                            {detalleSaldo.facturas.map((factura, index) => (
                                                                <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                                                    <div className="flex items-center justify-between mb-2">
                                                                        <h5 className="text-sm font-medium text-blue-900">
                                                                            Factura: {factura.numero}
                                                                        </h5>
                                                                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                                                            #{index + 1}
                                                                        </span>
                                                                    </div>
                                                                    
                                                                    <div className="grid grid-cols-2 gap-3 text-xs">
                                                                        <div>
                                                                            <label className="block font-medium text-gray-700">Cantidad</label>
                                                                            <p className="text-gray-900">{factura.cantidad || '-'}</p>
                                                                        </div>
                                                                        <div>
                                                                            <label className="block font-medium text-gray-700">Precio</label>
                                                                            <p className="text-gray-900">S/ {factura.precio || '-'}</p>
                                                                        </div>
                                                                        <div>
                                                                            <label className="block font-medium text-gray-700">Subtotal</label>
                                                                            <p className="text-gray-900">S/ {factura.subtotal || '-'}</p>
                                                                        </div>
                                                                        <div>
                                                                            <label className="block font-medium text-gray-700">F. Ingreso</label>
                                                                            <p className="text-gray-900">
                                                                                {factura.fechaIngreso ? formatDateTime(factura.fechaIngreso) : '-'}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                    
                                                                    <div className="mt-3 pt-2 border-t border-blue-200">
                                                                        <div className="grid grid-cols-3 gap-3 text-xs">
                                                                            <div>
                                                                                <label className="block font-medium text-gray-700">Faltan</label>
                                                                                <p className="text-red-600 font-medium">{factura.faltan || '0'}</p>
                                                                            </div>
                                                                            <div>
                                                                                <label className="block font-medium text-gray-700">Sobran</label>
                                                                                <p className="text-green-600 font-medium">{factura.sobran || '0'}</p>
                                                                            </div>
                                                                            <div>
                                                                                <label className="block font-medium text-gray-700">Mal</label>
                                                                                <p className="text-orange-600 font-medium">{factura.mal || '0'}</p>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="text-center py-4 text-gray-500">
                                                            No se encontraron facturas de compra
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                <button
                                    type="button"
                                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                                    onClick={() => setModalAbierto(false)}
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ConsultaProductos; 
