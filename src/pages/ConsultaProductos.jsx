import React, { useState, useEffect } from 'react';
import axios from '../services/axiosClient';
import { useNotification } from '../App';
import { obtenerTodosLosProductos } from '../services/api';

const ConsultaProductos = () => {
    const { showNotification } = useNotification();
    const [codProducto, setCodProducto] = useState('');
    const [loading, setLoading] = useState(false);
    const [resultados, setResultados] = useState([]);

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
        // Si ya hay códigos en el input, agregar el nuevo separado por coma
        const codigosExistentes = codProducto.trim();
        let nuevoCodigo;
        
        if (codigosExistentes) {
            // Si hay códigos existentes, agregar coma y el nuevo código
            nuevoCodigo = codigosExistentes + ',' + producto.codpro;
        } else {
            // Si no hay códigos, solo poner el nuevo
            nuevoCodigo = producto.codpro;
        }
        
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

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
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
                        onKeyPress={handleKeyPress}
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
                                            <tr key={saldoIndex} className="hover:bg-gray-50">
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
                                                    {formatDateTime(saldo.vencimiento) || '-'}
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
        </div>
    );
};

export default ConsultaProductos; 