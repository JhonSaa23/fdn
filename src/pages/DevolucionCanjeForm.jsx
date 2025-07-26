import React, { useState, useEffect } from 'react';
import axios from '../services/axiosClient';

const DevolucionCanjeForm = () => {
    // Detectar si es móvil
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Función para formatear fechas de manera consistente
    const formatFechaConsistente = (fecha) => {
        if (!fecha) return '';
        
        try {
            // Si la fecha ya es un string en formato YYYY-MM-DD, devolverla tal como está
            if (typeof fecha === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
                return fecha;
            }
            
            // Crear un objeto Date
            const date = new Date(fecha);
            
            // Si la fecha es UTC (termina en Z), extraer solo la parte de fecha sin conversión de zona horaria
            if (typeof fecha === 'string' && fecha.includes('T') && fecha.endsWith('Z')) {
                const fechaPart = fecha.split('T')[0];
                return fechaPart;
            }
            
            // Para otros casos, usar los métodos locales
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            
            return `${year}-${month}-${day}`;
        } catch (error) {
            console.error('Error formateando fecha:', error);
            return fecha;
        }
    };

    // Función para mostrar fecha en formato DD/MM/YYYY
    const formatFechaDisplay = (fecha) => {
        if (!fecha) return '';
        
        try {
            // Si la fecha es UTC (termina en Z), extraer solo la parte de fecha sin conversión de zona horaria
            if (typeof fecha === 'string' && fecha.includes('T') && fecha.endsWith('Z')) {
                const fechaPart = fecha.split('T')[0];
                const [year, month, day] = fechaPart.split('-');
                return `${day}/${month}/${year}`;
            }
            
            // Si la fecha ya es un string en formato YYYY-MM-DD
            if (typeof fecha === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
                const [year, month, day] = fecha.split('-');
                return `${day}/${month}/${year}`;
            }
            
            // Para otros casos, usar los métodos locales
            const date = new Date(fecha);
            return date.toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } catch (error) {
            console.error('Error formateando fecha para display:', error);
            return fecha;
        }
    };

    // --- ESTADOS DE LA VISTA ---
    const [cabecera, setCabecera] = useState({
        NroGuia: '',
        Fecha: new Date().toISOString().split('T')[0],
        Proveedor: '',
        EmpTrans: '',
        RucTrans: '',
        Placa: '',
        PtoLlegada: '',
        Destinatario: ''
    });

    const [detalles, setDetalles] = useState([]);
    const [currentItemDetalle, setCurrentItemDetalle] = useState({
        NroGuia: '',
        codpro: '',
        Producto: '',
        lote: '',
        Vencimiento: '',
        Cantidad: '',
        GuiaDevo: '',
        Referencia: '',
        TipoDoc: ''
    });
    const [productosADevolver, setProductosADevolver] = useState([]);
    const [laboratorios, setLaboratorios] = useState([]);
    const [selectedLaboratorio, setSelectedLaboratorio] = useState('');
    const [proveedores, setProveedores] = useState([]);
    const [transportistas, setTransportistas] = useState([]);
    const [transportistaSeleccionado, setTransportistaSeleccionado] = useState(null);

    const [showBuscarModal, setShowBuscarModal] = useState(false);
    const [showLaboratorioModal, setShowLaboratorioModal] = useState(false);
    const [guiasCanjeList, setGuiasCanjeList] = useState([]);
    const [selectedGuiaBusqueda, setSelectedGuiaBusqueda] = useState(null);
    const [laboratorioSearchTerm, setLaboratorioSearchTerm] = useState('');

    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);
    const [isConsultaMode, setIsConsultaMode] = useState(false);
    const [showGeneradorModal, setShowGeneradorModal] = useState(false);
    const [numeroGuiaGenerado, setNumeroGuiaGenerado] = useState('');
    const [pesoGuia, setPesoGuia] = useState('');
    const [direccionGuia, setDireccionGuia] = useState('');
    
    // Estados para modal de CabGuias
    const [showCabGuiasModal, setShowCabGuiasModal] = useState(false);
    const [cabGuias, setCabGuias] = useState([]);
    const [loadingCabGuias, setLoadingCabGuias] = useState(false);
    const [ultimoNumeroCabGuia, setUltimoNumeroCabGuia] = useState('');
    const [editandoNumero, setEditandoNumero] = useState(false);
    const [nuevoNumero, setNuevoNumero] = useState('');
    
    // Estados para búsqueda de productos
    const [productoSearchTerm, setProductoSearchTerm] = useState('');
    const [showProductoDropdown, setShowProductoDropdown] = useState(false);
    const [filteredProductos, setFilteredProductos] = useState([]);
    
    // Estados para el modal de productos
    const [showProductosModal, setShowProductosModal] = useState(false);
    const [laboratoriosProductos, setLaboratoriosProductos] = useState([]);
    const [productosPorLaboratorio, setProductosPorLaboratorio] = useState([]);
    const [selectedLaboratorioProductos, setSelectedLaboratorioProductos] = useState('');
    const [productosSearchTerm, setProductosSearchTerm] = useState('');
    const [filteredProductosModal, setFilteredProductosModal] = useState([]);
    const [loadingProductos, setLoadingProductos] = useState(false);
    
    // Estados para el dropdown de laboratorios en modal de productos
    const [showLaboratorioDropdown, setShowLaboratorioDropdown] = useState(false);
    const [filteredLaboratorios, setFilteredLaboratorios] = useState([]);

    // --- FUNCIONES DE CARGA ---
    const fetchLaboratorios = async () => {
        try {
            const response = await axios.get('/laboratorios');
            if (response.data.success) {
                console.log('🔍 Datos de laboratorios recibidos:', response.data.data);
                // Verificar la estructura del primer laboratorio
                if (response.data.data.length > 0) {
                    console.log('🔍 Estructura del primer laboratorio:', response.data.data[0]);
                    console.log('🔍 Campos disponibles:', Object.keys(response.data.data[0]));
                }
                setLaboratorios(response.data.data);
            } else {
                setMessage(`Error al cargar laboratorios: ${response.data.message}`);
                setIsError(true);
            }
        } catch (error) {
            setMessage(`Error de red al cargar laboratorios: ${error.message}`);
            setIsError(true);
        }
    };

    const fetchTransportistas = async () => {
        try {
            const response = await axios.get('/proveedores/transportistas');
            if (response.data.success) {
                console.log('🚛 Transportistas cargados:', response.data.data);
                setTransportistas(response.data.data);
            } else {
                console.log('⚠️ Error al cargar transportistas:', response.data.message);
            }
        } catch (error) {
            console.log('⚠️ Error de red al cargar transportistas:', error.message);
        }
    };

    // --- EFECTOS DE CARGA INICIAL / CAMBIOS DE ESTADO ---
    useEffect(() => {
        fetchLaboratorios();
    }, []);

    // Cargar transportistas al inicio
    useEffect(() => {
        fetchTransportistas();
    }, []);

    // Cerrar dropdowns cuando se hace clic fuera
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showProductoDropdown && !event.target.closest('.producto-dropdown-container')) {
                setShowProductoDropdown(false);
            }
            if (showLaboratorioDropdown && !event.target.closest('.laboratorio-dropdown-container')) {
                setShowLaboratorioDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showProductoDropdown, showLaboratorioDropdown]);

    useEffect(() => {
        if (selectedLaboratorio) {
            const fetchProductosADevolver = async () => {
                setIsLoading(true);
                setMessage('');
                setIsError(false);
                try {
                    // Limpiar espacios en blanco del codlab
                    const cleanCodlab = selectedLaboratorio.trim();
                    console.log('🔍 Cargando productos para laboratorio:', cleanCodlab);
                    const response = await axios.get(`/guias-devolucion/${cleanCodlab}/productos-a-devolver`);
                    if (response.data.success) {
                        setProductosADevolver(response.data.data);
                        setFilteredProductos(response.data.data); // Inicializar productos filtrados
                        console.log('✅ Productos cargados:', response.data.data.length, 'productos');
                        setMessage(`Productos cargados: ${response.data.data.length} productos disponibles para devolución`);
                        setIsError(false);
                    } else {
                        setMessage(`Error al cargar productos a devolver: ${response.data.message}`);
                        setIsError(true);
                        setProductosADevolver([]); // Limpiar si hay error
                        setFilteredProductos([]); // Limpiar productos filtrados
                    }
                } catch (error) {
                    setMessage(`Error de red al cargar productos a devolver: ${error.message}`);
                    setIsError(true);
                    setProductosADevolver([]); // Limpiar si hay error
                    setFilteredProductos([]); // Limpiar productos filtrados
                } finally {
                    setIsLoading(false);
                }
            };
            fetchProductosADevolver();
        } else {
            // Si no hay laboratorio seleccionado, limpia la lista de productos a devolver
            setProductosADevolver([]);
            setFilteredProductos([]); // Limpiar productos filtrados
        }
    }, [selectedLaboratorio]);

    // --- MANEJADORES DE CAMBIO DE INPUTS ---
    const handleCabeceraChange = (e) => {
        const { name, value } = e.target;
        setCabecera(prev => ({ ...prev, [name]: value }));
    };

    // Función para filtrar productos por código
    const handleProductoSearch = (searchTerm) => {
        setProductoSearchTerm(searchTerm);
        
        if (!searchTerm.trim()) {
            // Si no hay término de búsqueda, mostrar todos los productos
            setFilteredProductos(productosADevolver);
            setShowProductoDropdown(true);
        } else {
            // Filtrar productos que coincidan con el código
            const filtered = productosADevolver.filter(prod => 
                prod.Codpro && prod.Codpro.trim().toLowerCase().includes(searchTerm.trim().toLowerCase())
            );
            setFilteredProductos(filtered);
            setShowProductoDropdown(true);
        }
    };

    // Función para seleccionar producto del dropdown
    const handleSelectProducto = (producto) => {
        setCurrentItemDetalle(prev => ({
            ...prev,
            codpro: producto.Codpro,
            Producto: producto.Nombre,
            lote: producto.Lote,
            Vencimiento: producto.Vencimiento ? new Date(producto.Vencimiento).toISOString().split('T')[0] : '',
            GuiaDevo: producto.NroGuia,
            Referencia: producto.Referencia,
            TipoDoc: producto.tipodoc
        }));
        setProductoSearchTerm(producto.Codpro);
        setShowProductoDropdown(false);
    };

    const handleDetalleChange = (e) => {
        const { name, value } = e.target;
        setCurrentItemDetalle(prev => ({ ...prev, [name]: value }));
        
        // Si se está seleccionando un producto, cargar todos sus datos
        if (name === 'codpro' && value) {
            const productoSeleccionado = productosADevolver.find(p => p.codpro === value);
            
            if (productoSeleccionado) {
                setCurrentItemDetalle(prev => ({
                    ...prev,
                    Producto: productoSeleccionado.Nombre || productoSeleccionado.Producto,
                    lote: productoSeleccionado.lote || productoSeleccionado.Lote,
                    Vencimiento: productoSeleccionado.Vencimiento,
                    GuiaDevo: productoSeleccionado.NroGuia || productoSeleccionado.GuiaDevo,
                    Referencia: productoSeleccionado.Referencia,
                    tipodoc: productoSeleccionado.tipodoc
                }));
            }
        }
    };

    // Función para manejar la tecla Enter
    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault(); // Prevenir el comportamiento por defecto
            // Solo agregar si hay producto y cantidad válida
            if (currentItemDetalle.codpro && currentItemDetalle.Cantidad && currentItemDetalle.Cantidad > 0) {
                handleAddDetalle();
            }
        }
    };

    // Función para cargar datos del transportista seleccionado
    const handleTransportistaChange = async (e) => {
        const { value } = e.target;
        setCabecera(prev => ({ ...prev, EmpTrans: value }));
        
        if (value) {
            try {
                // Buscar el transportista seleccionado para obtener su código
                const transportista = transportistas.find(t => t.Razon === value);
                if (transportista) {
                    const codProv = transportista.Codprov ? transportista.Codprov.trim() : '';
                    console.log('🚛 Cargando datos del transportista:', codProv);
                    
                    // Si hay código válido, buscar por código
                    if (codProv && codProv !== '') {
                        const response = await axios.get(`/proveedores/detalle/${codProv}`);
                        if (response.data.success) {
                            const datosTransportista = response.data.data;
                            console.log('✅ Datos del transportista cargados por código:', datosTransportista);
                            setTransportistaSeleccionado(datosTransportista);
                            
                            // Auto-completar el RUC
                            setCabecera(prev => ({
                                ...prev,
                                RucTrans: datosTransportista.Documento || ''
                            }));
                        } else {
                            console.log('⚠️ Error al cargar datos del transportista por código:', response.data.message);
                        }
                    } else {
                        // Si no hay código, buscar por razón
                        console.log('🔍 Transportista sin código, buscando por razón:', transportista.Razon);
                        try {
                            const response = await axios.get(`/proveedores/detalle-razon/${encodeURIComponent(transportista.Razon.trim())}`);
                            if (response.data.success) {
                                const datosTransportista = response.data.data;
                                console.log('✅ Datos del transportista cargados por razón:', datosTransportista);
                                setTransportistaSeleccionado(datosTransportista);
                                
                                // Auto-completar el RUC
                                setCabecera(prev => ({
                                    ...prev,
                                    RucTrans: datosTransportista.Documento || ''
                                }));
                            } else {
                                console.log('⚠️ Error al cargar datos del transportista por razón:', response.data.message);
                                setCabecera(prev => ({ ...prev, RucTrans: '' }));
                                setTransportistaSeleccionado(null);
                            }
                        } catch (error) {
                            console.log('⚠️ Error al buscar transportista por razón:', error.message);
                            setCabecera(prev => ({ ...prev, RucTrans: '' }));
                            setTransportistaSeleccionado(null);
                        }
                    }
                }
            } catch (error) {
                console.log('⚠️ Error de red al cargar datos del transportista:', error.message);
                // En caso de error, limpiar RUC
                setCabecera(prev => ({ ...prev, RucTrans: '' }));
                setTransportistaSeleccionado(null);
            }
        } else {
            // Si no hay transportista seleccionado, limpiar RUC
            setCabecera(prev => ({ ...prev, RucTrans: '' }));
            setTransportistaSeleccionado(null);
        }
    };



    const handleSeleccionarLaboratorio = async (laboratorio) => {
        console.log('🏥 Laboratorio seleccionado:', laboratorio);
        
        // Ahora todos los laboratorios que llegan del backend son válidos (Mantiene=1)
        console.log('✅ Laboratorio válido para guías de canjes');
        const cleanCodlab = laboratorio.codlab.trim();
        console.log('🧹 Codlab limpio:', cleanCodlab);
        setSelectedLaboratorio(cleanCodlab);
        setShowLaboratorioModal(false);
        setLaboratorioSearchTerm('');
        setMessage(`Laboratorio seleccionado: ${laboratorio.Descripcion}. Cargando datos...`);
        setIsError(false);
        
        try {
            // Cargar proveedores del laboratorio
            console.log('🔍 Cargando proveedores para laboratorio:', cleanCodlab);
            const proveedoresResponse = await axios.get(`/proveedores/laboratorio/${cleanCodlab}`);
            if (proveedoresResponse.data.success) {
                setProveedores(proveedoresResponse.data.data);
                console.log('✅ Proveedores cargados:', proveedoresResponse.data.data.length);
            } else {
                console.log('⚠️ Error al cargar proveedores:', proveedoresResponse.data.message);
                setProveedores([]);
            }

            // Auto-completar campos
            setCabecera(prev => ({
                ...prev,
                Destinatario: 'DISTRIBUIDORA FARMACOS DEL NORTE',
                Placa: 'DISPONIBLE'
            }));

            setMessage(`Laboratorio seleccionado: ${laboratorio.Descripcion}. Datos cargados correctamente.`);
        } catch (error) {
            console.log('⚠️ Error al cargar datos del laboratorio:', error.message);
            setMessage(`Laboratorio seleccionado: ${laboratorio.Descripcion}. Error al cargar algunos datos.`);
            setIsError(true);
        }
        
        // Los productos se cargarán automáticamente por el useEffect
        // que monitorea selectedLaboratorio
    };

    // --- FUNCIONALIDAD DE BOTONES ---
    const handleNuevo = async () => {
        console.log('🔵 Botón Nuevo clickeado - Iniciando limpieza del formulario');
        setIsLoading(true);
        setMessage('');
        setIsError(false);
        
        // Limpiar todos los estados
        setCabecera({
            NroGuia: '',
            Fecha: new Date().toISOString().split('T')[0],
            Proveedor: '',
            EmpTrans: '',
            RucTrans: '',
            Placa: '',
            PtoLlegada: '',
            Destinatario: ''
        });
        setDetalles([]);
        setCurrentItemDetalle({
            NroGuia: '',
            codpro: '',
            Producto: '',
            lote: '',
            Vencimiento: '',
            Cantidad: '',
            GuiaDevo: '',
            Referencia: '',
            TipoDoc: ''
        });
        setSelectedLaboratorio('');
        setProductosADevolver([]);
        setFilteredProductos([]);
        setProductoSearchTerm('');
        setShowProductoDropdown(false);
        setSelectedGuiaBusqueda(null);
        setLaboratorioSearchTerm('');
        setIsConsultaMode(false); // Desactivar modo consulta
        
        try {
            // LLAMADA CLAVE: Obtener el siguiente número de documento
            const nextNumResponse = await axios.get('/guias-canje/next-number');
            if (nextNumResponse.data.success && nextNumResponse.data.nextNumber) {
                setCabecera(prev => ({ ...prev, NroGuia: nextNumResponse.data.nextNumber }));
                console.log('🔢 Número de documento obtenido:', nextNumResponse.data.nextNumber);
            } else {
                setMessage(`Advertencia: No se pudo obtener el siguiente número de documento. ${nextNumResponse.data.message || ''}`);
                setIsError(true);
            }

            // LLAMADA CLAVE: Cargar laboratorios y abrir modal
            const labResponse = await axios.get('/laboratorios');
            if (labResponse.data.success) {
                setLaboratorios(labResponse.data.data);
                setShowLaboratorioModal(true);
                setMessage('Seleccione un laboratorio para continuar');
                setIsError(false);
            } else {
                setMessage(`Error al cargar laboratorios: ${labResponse.data.message}`);
                setIsError(true);
            }
        } catch (error) {
            setMessage(`Error de red al inicializar formulario: ${error.message}`);
            setIsError(true);
        } finally {
            setIsLoading(false);
            console.log('🔵 Botón Nuevo completado - Formulario limpio, número obtenido y modal de laboratorios abierto');
        }
    };

    const handleBuscarClick = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get('/guias-canje');
            if (response.data.success) {
                setGuiasCanjeList(response.data.data);
                setShowBuscarModal(true);
            } else {
                setMessage(`Error al cargar guías para búsqueda: ${response.data.message}`);
                setIsError(true);
            }
        } catch (error) {
            setMessage(`Error de red al buscar guías: ${error.message}`);
            setIsError(true);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSeleccionarGuiaBusqueda = async (guia) => {
        setSelectedGuiaBusqueda(guia);
        setShowBuscarModal(false);
        setIsConsultaMode(true); // Activar modo consulta

        setIsLoading(true);
        setMessage('');
        setIsError(false);
        try {
            // Asegurar que los datos estén cargados antes de continuar
            if (proveedores.length === 0) {
                console.log('🔄 Cargando proveedores...');
                await fetchLaboratorios();
            }
            if (transportistas.length === 0) {
                console.log('🔄 Cargando transportistas...');
                await fetchTransportistas();
            }
            
            // Cargar cabecera
            const cabeceraResponse = await axios.get(`/guias-canje/${guia.NroGuia}/cabecera`);
            if (cabeceraResponse.data.success && cabeceraResponse.data.data) {
                const fetchedCabecera = cabeceraResponse.data.data;
                console.log('🔍 Datos de cabecera recibidos:', fetchedCabecera);
                console.log('🔍 Proveedor código:', fetchedCabecera.Proveedor);
                console.log('🔍 Proveedor nombre:', fetchedCabecera.ProveedorNombre);
                
                // Limpiar espacios en blanco de los datos recibidos
                const cleanCabecera = {
                    NroGuia: fetchedCabecera.NroGuia?.trim(),
                    Fecha: formatFechaConsistente(fetchedCabecera.Fecha),
                    Proveedor: fetchedCabecera.Proveedor?.trim(),
                    ProveedorNombre: fetchedCabecera.ProveedorNombre?.trim(),
                    EmpTrans: fetchedCabecera.EmpTrans?.trim(),
                    RucTrans: fetchedCabecera.RucTrans?.trim(),
                    Placa: fetchedCabecera.Placa?.trim(),
                    PtoLlegada: fetchedCabecera.PtoLlegada?.trim(),
                    Destinatario: fetchedCabecera.Destinatario?.trim()
                };
                
                setCabecera(cleanCabecera);
                
                // Establecer el laboratorio seleccionado y cargar proveedores
                if (fetchedCabecera.laboratorio) {
                    const laboratorioCode = fetchedCabecera.laboratorio.trim();
                    setSelectedLaboratorio(laboratorioCode);
                    
                    // Cargar proveedores del laboratorio
                    try {
                        console.log('🔍 Cargando proveedores para laboratorio:', laboratorioCode);
                        const proveedoresResponse = await axios.get(`/proveedores/laboratorio/${laboratorioCode}`);
                        if (proveedoresResponse.data.success) {
                            const proveedoresCargados = proveedoresResponse.data.data;
                            setProveedores(proveedoresCargados);
                            console.log('✅ Proveedores cargados para laboratorio:', proveedoresCargados.length);
                            
                            // Buscar y establecer el proveedor después de cargar los datos
                            if (cleanCabecera.Proveedor && proveedoresCargados.length > 0) {
                                // Primero intentar buscar por código
                                let proveedorEncontrado = proveedoresCargados.find(prov => 
                                    prov.proveedor === cleanCabecera.Proveedor
                                );
                                
                                // Si no se encuentra por código, buscar por nombre (si está disponible)
                                if (!proveedorEncontrado && fetchedCabecera.ProveedorNombre) {
                                    proveedorEncontrado = proveedoresCargados.find(prov => 
                                        prov.razon === fetchedCabecera.ProveedorNombre.trim()
                                    );
                                }
                                
                                if (proveedorEncontrado) {
                                    console.log('✅ Proveedor encontrado y establecido:', proveedorEncontrado.razon);
                                } else {
                                    console.log('⚠️ Proveedor no encontrado en la lista:', cleanCabecera.Proveedor);
                                    console.log('Nombre del proveedor recibido:', fetchedCabecera.ProveedorNombre);
                                    console.log('Proveedores disponibles:', proveedoresCargados.map(p => `${p.proveedor} - ${p.razon}`));
                                }
                            }
                        } else {
                            console.log('⚠️ Error al cargar proveedores:', proveedoresResponse.data.message);
                            setProveedores([]);
                        }
                    } catch (error) {
                        console.log('⚠️ Error al cargar proveedores del laboratorio:', error.message);
                        setProveedores([]);
                    }
                }
                

                
                // Buscar y establecer la empresa de transporte seleccionada
                if (cleanCabecera.EmpTrans && transportistas.length > 0) {
                    const transportistaEncontrado = transportistas.find(trans => 
                        trans.Razon === cleanCabecera.EmpTrans
                    );
                    if (transportistaEncontrado) {
                        // Actualizar el RUC del transportista si no está establecido
                        if (!cleanCabecera.RucTrans || cleanCabecera.RucTrans === '') {
                            setCabecera(prev => ({
                                ...prev,
                                RucTrans: transportistaEncontrado.Ruc || ''
                            }));
                        }
                        console.log('✅ Transportista encontrado y establecido:', transportistaEncontrado.Razon);
                    } else {
                        console.log('⚠️ Transportista no encontrado en la lista:', cleanCabecera.EmpTrans);
                        console.log('Transportistas disponibles:', transportistas.map(t => t.Razon));
                    }
                } else {
                    console.log('⚠️ No hay transportistas cargados o transportista vacío');
                }
                
                console.log('🔍 Cabecera establecida:', cleanCabecera);
                
                // Esperar un poco para que los datos se establezcan y luego verificar los selects
                setTimeout(() => {
                    console.log('🔍 Verificando selects después de establecer cabecera:');
                    console.log('Cabecera actual:', cabecera);
                    console.log('Proveedores cargados:', proveedores.length);
                    console.log('Transportistas cargados:', transportistas.length);
                }, 100);
            } else {
                setMessage(`Error al cargar cabecera de guía: ${cabeceraResponse.data.message}`);
                setIsError(true);
            }

            // Cargar detalles
            const detallesResponse = await axios.get(`/guias-canje/${guia.NroGuia}/detalles`);
            if (detallesResponse.data.success) {
                setDetalles(detallesResponse.data.data.map(d => ({
                    ...d,
                    Vencimiento: d.Vencimiento ? new Date(d.Vencimiento).toISOString().split('T')[0] : ''
                })));
            } else {
                setMessage(`Error al cargar detalles de guía: ${detallesResponse.data.message}`);
                setIsError(true);
            }
        } catch (error) {
            setMessage(`Error de red al seleccionar guía: ${error.message}`);
            setIsError(true);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegistrar = async () => {
        if (!cabecera.NroGuia || !cabecera.Fecha || detalles.length === 0) {
            setMessage('Por favor, complete todos los campos de cabecera y añada al menos un detalle.');
            setIsError(true);
            return;
        }

        setIsLoading(true);
        setMessage('');
        setIsError(false);
        
        try {
            console.log('🚀 Iniciando proceso de registro de guía de canje...');
            
            // Paso 1: Verificación de saldos de productos
            console.log('📊 Paso 1: Verificando saldos de productos...');
            for (const detalle of detalles) {
                const saldosResponse = await axios.post('/productos/verificar-saldos', {
                    cod: detalle.codpro,
                    lote: detalle.lote,
                    alma: 3 // Almacén por defecto
                });
                
                if (!saldosResponse.data.success) {
                    throw new Error(`Error al verificar saldos del producto ${detalle.codpro}: ${saldosResponse.data.message}`);
                }
                
                console.log(`✅ Saldos verificados para producto ${detalle.codpro}`);
            }
            
            // Paso 2: Búsqueda de guía de canje existente
            console.log('🔍 Paso 2: Verificando si la guía ya existe...');
            const busquedaResponse = await axios.get(`/guias-canje/buscar/${cabecera.NroGuia}`);
            
            if (busquedaResponse.data.success && busquedaResponse.data.data) {
                throw new Error(`La guía ${cabecera.NroGuia} ya existe en el sistema.`);
            }
            
            console.log('✅ Guía no existe, procediendo con el registro...');
            
            // Paso 3: Inserción de nueva guía de canje
            console.log('📝 Paso 3: Insertando cabecera de guía de canje...');
            const cabeceraData = {
                docu: cabecera.NroGuia,
                feca: new Date(cabecera.Fecha),
                Prov: cabecera.Proveedor,
                empresa: cabecera.EmpTrans,
                ruc: cabecera.RucTrans,
                placa: cabecera.Placa,
                punto: cabecera.PtoLlegada,
                destino: cabecera.Destinatario
            };
            
            console.log('📋 Datos de cabecera a enviar:', cabeceraData);
            console.log('📋 Estado actual de cabecera:', cabecera);
            
            // Validar que todos los campos requeridos estén presentes
            const camposRequeridos = ['docu', 'feca', 'Prov', 'empresa', 'ruc', 'placa', 'punto', 'destino'];
            const camposFaltantes = camposRequeridos.filter(campo => !cabeceraData[campo] || cabeceraData[campo] === '');
            
            if (camposFaltantes.length > 0) {
                throw new Error(`Campos faltantes: ${camposFaltantes.join(', ')}`);
            }
            
            const cabeceraResponse = await axios.post('/guias-canje/insertar-cabecera', cabeceraData);
            
            if (!cabeceraResponse.data.success) {
                throw new Error(`Error al insertar cabecera: ${cabeceraResponse.data.message}`);
            }
            
            console.log('✅ Cabecera insertada correctamente');
            
            // Paso 4: Inserción de detalles de la guía de canje
            console.log('📋 Paso 4: Insertando detalles de la guía...');
            for (const detalle of detalles) {
                const detalleData = {
                    num: cabecera.NroGuia,
                    idpro: detalle.codpro,
                    lote: detalle.lote,
                    vence: detalle.Vencimiento ? new Date(detalle.Vencimiento) : null,
                    cantidad: detalle.Cantidad,
                    guia: detalle.GuiaDevo || 'SIN REF',
                    referencia: detalle.Referencia || 'SIN REF',
                    tipodoc: detalle.tipodoc || 'NN'
                };
                
                const detalleResponse = await axios.post('/guias-canje/insertar-detalle', detalleData);
                
                if (!detalleResponse.data.success) {
                    throw new Error(`Error al insertar detalle del producto ${detalle.codpro}: ${detalleResponse.data.message}`);
                }
                
                console.log(`✅ Detalle insertado para producto ${detalle.codpro}`);
            }
            
            console.log('✅ Todos los detalles insertados correctamente');
            
            // Paso 5: Actualizar contador de guía de devolución para proveedor
            console.log('🔢 Paso 5: Actualizando contador de guía de devolución...');
            const actualizarContadorDevolucionResponse = await axios.post('/guias-canje/actualizar-contador-devolucion', {
                numero: cabecera.NroGuia
            });
            
            if (!actualizarContadorDevolucionResponse.data.success) {
                throw new Error(`Error al actualizar contador de devolución: ${actualizarContadorDevolucionResponse.data.message}`);
            }
            
            console.log('✅ Contador de devolución actualizado correctamente');
            
            // Paso 6: Obtener número de guía de remisión electrónica
            console.log('🔢 Paso 6: Obteniendo número de guía de remisión...');
            const numeroGuiaResponse = await axios.get('/guias-venta/siguiente-numero');
            
            if (!numeroGuiaResponse.data.success) {
                throw new Error(`Error al obtener número de guía: ${numeroGuiaResponse.data.message}`);
            }
            
            const numeroGuia = numeroGuiaResponse.data.numero;
            setNumeroGuiaGenerado(numeroGuia);
            setPesoGuia('0.00');
            setDireccionGuia('');
            
            console.log(`✅ Número de guía obtenido: ${numeroGuia}`);
            
            // Mostrar modal del generador
            setShowGeneradorModal(true);
            setIsLoading(false);
            
            setMessage('✅ Guía de canje registrada. Complete los datos de la guía de remisión.');
            setIsError(false);
            
        } catch (error) {
            console.error('❌ Error en el proceso de registro:', error);
            setMessage(`Error al registrar guía: ${error.message}`);
            setIsError(true);
            setIsLoading(false);
        }
    };

    const handleEliminar = async () => {
        if (!cabecera.NroGuia || !window.confirm(`¿Estás seguro de eliminar la guía ${cabecera.NroGuia}?\n\n⚠️ Esta acción devolverá todos los productos al inventario y no se puede deshacer.`)) {
            return;
        }

        setIsLoading(true);
        setMessage('');
        setIsError(false);
        
        try {
            console.log('🗑️ Iniciando eliminación completa de guía de canje:', cabecera.NroGuia);
            
            const response = await axios.delete(`/guias-canje/${cabecera.NroGuia}/completa`);
            
            if (response.data.success) {
                console.log('✅ Eliminación completada exitosamente');
                setMessage(response.data.message);
                setIsError(false);
                handleNuevo();
            } else {
                console.error('❌ Error en respuesta del servidor:', response.data.message);
                setMessage(`Error al eliminar guía: ${response.data.message}`);
                setIsError(true);
            }
        } catch (error) {
            console.error('❌ Error de red al eliminar guía:', error);
            setMessage(`Error de red al eliminar guía: ${error.message}`);
            setIsError(true);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancelar = () => {
        if (window.confirm('¿Desea descartar los cambios no guardados?')) {
            handleNuevo();
        }
    };

    // Funciones para CabGuias
    const handleCabGuiasClick = async () => {
        setShowCabGuiasModal(true);
        await cargarCabGuias();
        await cargarUltimoNumeroCabGuia();
    };

    const cargarCabGuias = async () => {
        setLoadingCabGuias(true);
        try {
            console.log('🔍 Cargando cabeceras de guías...');
            const response = await axios.get('/cab-guias');
            if (response.data.success) {
                setCabGuias(response.data.data);
                console.log(`✅ Se cargaron ${response.data.data.length} cabeceras de guías`);
            } else {
                setMessage(`Error al cargar cabeceras: ${response.data.message}`);
                setIsError(true);
            }
        } catch (error) {
            console.error('❌ Error al cargar cabeceras:', error);
            setMessage(`Error de red al cargar cabeceras: ${error.message}`);
            setIsError(true);
        } finally {
            setLoadingCabGuias(false);
        }
    };

    const cargarUltimoNumeroCabGuia = async () => {
        try {
            console.log('🔢 Cargando último número de cabecera de guía...');
            const response = await axios.get('/cab-guias/ultimo-numero');
            if (response.data.success) {
                setUltimoNumeroCabGuia(response.data.ultimoNumero);
                setNuevoNumero(response.data.ultimoNumero);
                console.log('✅ Último número cargado:', response.data.ultimoNumero);
            } else {
                console.error('❌ Error al cargar último número:', response.data.message);
            }
        } catch (error) {
            console.error('❌ Error de red al cargar último número:', error);
        }
    };

    const handleEliminarCabGuia = async (numero) => {
        if (!window.confirm(`¿Estás seguro de eliminar la cabecera de guía ${numero}?`)) {
            return;
        }

        try {
            console.log(`🗑️ Eliminando cabecera de guía: ${numero}`);
            const response = await axios.delete(`/cab-guias/${numero}`);
            
            if (response.data.success) {
                console.log('✅ Cabecera eliminada correctamente');
                setMessage(response.data.message);
                setIsError(false);
                await cargarCabGuias(); // Recargar la lista
            } else {
                setMessage(`Error al eliminar: ${response.data.message}`);
                setIsError(true);
            }
        } catch (error) {
            console.error('❌ Error al eliminar cabecera:', error);
            setMessage(`Error de red al eliminar: ${error.message}`);
            setIsError(true);
        }
    };

    const handleActualizarUltimoNumero = async () => {
        if (!nuevoNumero.trim()) {
            setMessage('El número no puede estar vacío');
            setIsError(true);
            return;
        }

        try {
            console.log(`🔢 Actualizando último número a: ${nuevoNumero}`);
            const response = await axios.put('/cab-guias/ultimo-numero', {
                nuevoNumero: nuevoNumero.trim()
            });
            
            if (response.data.success) {
                console.log('✅ Último número actualizado correctamente');
                setMessage(response.data.message);
                setIsError(false);
                setUltimoNumeroCabGuia(nuevoNumero.trim());
                setEditandoNumero(false);
            } else {
                setMessage(`Error al actualizar: ${response.data.message}`);
                setIsError(true);
            }
        } catch (error) {
            console.error('❌ Error al actualizar último número:', error);
            setMessage(`Error de red al actualizar: ${error.message}`);
            setIsError(true);
        }
    };

    const handleRetornarModal = async () => {
        if (!numeroGuiaGenerado) {
            setMessage('Error: No se ha generado un número de guía válido.');
            setIsError(true);
            return;
        }

        setIsLoading(true);
        setMessage('');
        setIsError(false);

        try {
            console.log('🔄 Iniciando proceso de retorno del modal...');
            
            // Paso 7: Búsqueda de guía de venta existente
            console.log('🔍 Paso 7: Verificando si la guía de venta ya existe...');
            const busquedaGuiaVentaResponse = await axios.get(`/guias-venta/buscar/${numeroGuiaGenerado}`);
            
            if (busquedaGuiaVentaResponse.data.success && busquedaGuiaVentaResponse.data.data) {
                throw new Error(`La guía de venta ${numeroGuiaGenerado} ya existe en el sistema.`);
            }
            
            console.log('✅ Guía de venta no existe, procediendo con el registro...');
            
            // Paso 8: Inserción de la cabecera de la guía de venta
            console.log('📝 Paso 8: Insertando cabecera de guía de venta...');
            const guiaVentaData = {
                nro: numeroGuiaGenerado,
                Venta: cabecera.NroGuia, // Número de la guía de canje original
                tipodoc: 12, // Tipo de documento para guía de remisión
                fec: new Date(cabecera.Fecha),
                emp: cabecera.EmpTrans,
                ruc: cabecera.RucTrans,
                placa: cabecera.Placa,
                pto: cabecera.PtoLlegada,
                destino: cabecera.Destinatario,
                peso: parseFloat(pesoGuia) || 0.00
            };
            
            const guiaVentaResponse = await axios.post('/guias-venta/insertar', guiaVentaData);
            
            if (!guiaVentaResponse.data.success) {
                throw new Error(`Error al insertar guía de venta: ${guiaVentaResponse.data.message}`);
            }
            
            console.log('✅ Cabecera de guía de venta insertada correctamente');
            
            // Paso 9: Preparación de datos para impresión
            console.log('🖨️ Paso 9: Preparando datos para impresión...');
            const impresionResponse = await axios.post('/guias-venta/preparar-impresion', {
                doc: numeroGuiaGenerado
            });
            
            if (!impresionResponse.data.success) {
                throw new Error(`Error al preparar datos para impresión: ${impresionResponse.data.message}`);
            }
            
            console.log('✅ Datos preparados para impresión');
            
            // Paso 10: Actualización del contador de guías
            console.log('🔢 Paso 10: Actualizando contador de guías...');
            const actualizarContadorResponse = await axios.post('/guias-venta/actualizar-contador', {
                numero: numeroGuiaGenerado
            });
            
            if (!actualizarContadorResponse.data.success) {
                throw new Error(`Error al actualizar contador: ${actualizarContadorResponse.data.message}`);
            }
            
            console.log('✅ Contador actualizado correctamente');
            
            // Cerrar modal y limpiar formulario
            setShowGeneradorModal(false);
            setNumeroGuiaGenerado('');
            setPesoGuia('');
            setDireccionGuia('');
            
            // Limpiar formulario principal
            handleNuevo();
            
            setMessage(`✅ Proceso completado exitosamente. Guía de remisión ${numeroGuiaGenerado} generada.`);
            setIsError(false);
            
        } catch (error) {
            console.error('❌ Error en el proceso de retorno:', error);
            setMessage(`Error al completar el proceso: ${error.message}`);
            setIsError(true);
        } finally {
            setIsLoading(false);
        }
    };

    // Funciones para el modal de productos
    const handleProductosClick = async () => {
        setShowProductosModal(true);
        setLaboratorioSearchTerm('');
        setShowLaboratorioDropdown(false);
        await cargarLaboratoriosProductos();
    };

    const cargarLaboratoriosProductos = async () => {
        setLoadingProductos(true);
        try {
            console.log('🔍 Cargando laboratorios para productos...');
            const response = await axios.get('/productos/laboratorios');
            if (response.data.success) {
                setLaboratoriosProductos(response.data.data);
                setFilteredLaboratorios(response.data.data); // Inicializar filtrado
                console.log(`✅ Se cargaron ${response.data.data.length} laboratorios`);
            } else {
                setMessage(`Error al cargar laboratorios: ${response.data.message}`);
                setIsError(true);
                setFilteredLaboratorios([]);
            }
        } catch (error) {
            console.error('❌ Error al cargar laboratorios:', error);
            setMessage(`Error de red al cargar laboratorios: ${error.message}`);
            setIsError(true);
            setFilteredLaboratorios([]);
        } finally {
            setLoadingProductos(false);
        }
    };

    const handleLaboratorioProductosChange = async (codlab) => {
        setSelectedLaboratorioProductos(codlab);
        setProductosSearchTerm('');
        setFilteredProductosModal([]);
        
        if (codlab) {
            await cargarProductosPorLaboratorio(codlab);
        } else {
            setProductosPorLaboratorio([]);
        }
    };

    const cargarProductosPorLaboratorio = async (codlab) => {
        setLoadingProductos(true);
        try {
            console.log('🔍 Cargando productos para laboratorio:', codlab);
            const response = await axios.get(`/productos/laboratorio/${codlab}`);
            if (response.data.success) {
                setProductosPorLaboratorio(response.data.data);
                setFilteredProductosModal(response.data.data);
                console.log(`✅ Se cargaron ${response.data.data.length} productos`);
            } else {
                setMessage(`Error al cargar productos: ${response.data.message}`);
                setIsError(true);
                setProductosPorLaboratorio([]);
                setFilteredProductosModal([]);
            }
        } catch (error) {
            console.error('❌ Error al cargar productos:', error);
            setMessage(`Error de red al cargar productos: ${error.message}`);
            setIsError(true);
            setProductosPorLaboratorio([]);
            setFilteredProductosModal([]);
        } finally {
            setLoadingProductos(false);
        }
    };

    const handleProductosSearch = (searchTerm) => {
        setProductosSearchTerm(searchTerm);
        
        if (!searchTerm.trim()) {
            setFilteredProductosModal(productosPorLaboratorio);
            return;
        }
        
        const filtered = productosPorLaboratorio.filter(producto => 
            (producto.codpro && producto.codpro.toString().toLowerCase().includes(searchTerm.toLowerCase())) ||
            (producto.nombre && producto.nombre.toString().toLowerCase().includes(searchTerm.toLowerCase())) ||
            (producto.lote && producto.lote.toString().toLowerCase().includes(searchTerm.toLowerCase()))
        );
        
        setFilteredProductosModal(filtered);
    };

    // Funciones para el autocompletado de laboratorios en el modal
    const handleLaboratorioSearch = (searchTerm) => {
        setLaboratorioSearchTerm(searchTerm);
        setShowLaboratorioDropdown(true);
        
        if (!searchTerm.trim()) {
            setFilteredLaboratorios(laboratoriosProductos);
            return;
        }
        
        const filtered = laboratoriosProductos.filter(lab => 
            (lab.codlab && lab.codlab.toString().toLowerCase().includes(searchTerm.toLowerCase())) ||
            (lab.Descripcion && lab.Descripcion.toString().toLowerCase().includes(searchTerm.toLowerCase()))
        );
        
        setFilteredLaboratorios(filtered);
    };

    const handleLaboratorioInputClick = () => {
        setShowLaboratorioDropdown(true);
        setFilteredLaboratorios(laboratoriosProductos);
    };

    const handleSelectLaboratorio = (laboratorio) => {
        setSelectedLaboratorioProductos(laboratorio.codlab);
        setLaboratorioSearchTerm(`${laboratorio.codlab} - ${laboratorio.Descripcion}`);
        setShowLaboratorioDropdown(false);
        cargarProductosPorLaboratorio(laboratorio.codlab);
    };

        // --- Lógica para añadir/modificar/eliminar ítems de detalle en la grilla ---
    const handleAddDetalle = () => {
        if (!currentItemDetalle.codpro || !currentItemDetalle.Cantidad) {
            setMessage('Debe seleccionar un producto y especificar la cantidad para el detalle.');
            setIsError(true);
            return;
        }
        setMessage('');
        setIsError(false);

        const selectedProductInfo = productosADevolver.find(p =>
            p.Codpro === currentItemDetalle.codpro &&
            p.Lote === currentItemDetalle.lote &&
            p.Vencimiento === currentItemDetalle.Vencimiento
        );

        const newDetail = {
            ...currentItemDetalle,
            NroGuia: cabecera.NroGuia,
            Producto: selectedProductInfo ? selectedProductInfo.Nombre : currentItemDetalle.Producto,
            Vencimiento: currentItemDetalle.Vencimiento,
            // Asegurar que se incluyan todos los campos del producto seleccionado
            tipodoc: selectedProductInfo ? selectedProductInfo.tipodoc : (currentItemDetalle.tipodoc || currentItemDetalle.TipoDoc),
            Referencia: selectedProductInfo ? selectedProductInfo.Referencia : currentItemDetalle.Referencia,
            GuiaDevo: selectedProductInfo ? selectedProductInfo.NroGuia : currentItemDetalle.GuiaDevo
        };

        // Verificar si ya existe un producto igual en los detalles
        const existingIndex = detalles.findIndex(detalle => 
            detalle.codpro === newDetail.codpro && 
            detalle.lote === newDetail.lote && 
            detalle.Vencimiento === newDetail.Vencimiento
        );

        if (existingIndex !== -1) {
            // Si existe, sumar la cantidad
            const existingDetail = detalles[existingIndex];
            const newQuantity = parseFloat(existingDetail.Cantidad || 0) + parseFloat(newDetail.Cantidad || 0);
            
            setDetalles(prev => prev.map((detalle, index) => 
                index === existingIndex 
                    ? { ...detalle, Cantidad: newQuantity.toString() }
                    : detalle
            ));
            
            setMessage(`✅ Cantidad actualizada para ${newDetail.Producto}. Nueva cantidad: ${newQuantity}`);
            setIsError(false);
        } else {
            // Si no existe, agregar nuevo detalle
            setDetalles(prev => [...prev, newDetail]);
            setMessage(`✅ Producto agregado: ${newDetail.Producto}`);
            setIsError(false);
        }

        setCurrentItemDetalle({
            NroGuia: '', codpro: '', Producto: '', lote: '', Vencimiento: '', Cantidad: '',
            GuiaDevo: '', Referencia: '', tipodoc: ''
        });
        setProductoSearchTerm('');
        setShowProductoDropdown(false);
    };

    const handleRemoveDetalle = (indexToRemove) => {
        setDetalles(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    // Función para editar cantidad directamente en la tabla
    const handleEditCantidad = (index, newCantidad) => {
        const cantidad = parseFloat(newCantidad);
        
        if (newCantidad === '' || cantidad >= 0) {
            setDetalles(prev => prev.map((detalle, i) => 
                i === index 
                    ? { ...detalle, Cantidad: newCantidad }
                    : detalle
            ));
        }
    };

    // Estilos comunes para inputs responsivos - basado en Saldos.jsx
    const inputStyles = {
        padding: '8px 12px',
        border: '1px solid #d1d5db',
        borderRadius: '6px',
        fontSize: '14px',
        transition: 'border-color 0.3s ease',
        width: '100%',
        boxSizing: 'border-box',
        outline: 'none'
    };

    const selectStyles = {
        ...inputStyles,
        backgroundColor: 'white',
        cursor: 'pointer'
    };

    // Función helper para estilos responsivos
    const getResponsiveStyles = (baseStyles) => ({
        ...baseStyles,
        padding: isMobile ? '14px 12px' : baseStyles.padding,
        fontSize: isMobile ? '16px' : baseStyles.fontSize
    });

    // Estilos responsivos para contenedores
    const gridContainerStyles = {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '15px',
        width: '100%'
    };

    const mobileGridStyles = {
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '12px',
        width: '100%',
        padding: '0'
    };

    // --- RENDERIZADO DE LA UI ---
    return (
        <div style={{ 
            fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif', 
            backgroundColor: '#f8f9fa',
            maxWidth: '100%',
            overflowX: 'hidden',
        }}>
            
            {/* Estilos CSS para animación de recarga */}
            <style>
                {`
                    @keyframes spin {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }
                `}
            </style>

            {isLoading && (
                <div style={{
                    textAlign: 'center',
                    padding: '20px',
                    backgroundColor: '#e3f2fd',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    color: '#1976d2',
                    fontWeight: '500'
                }}>
                    ⏳ Cargando...
                </div>
            )}
            
            {message && (
                <div style={{ 
                    color: isError ? '#d32f2f' : '#2e7d32', 
                    fontWeight: '500', 
                    marginBottom: '15px',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    backgroundColor: isError ? '#ffebee' : '#e8f5e9',
                    border: `1px solid ${isError ? '#ffcdd2' : '#c8e6c9'}`,
                    fontSize: '14px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                    {message}
                </div>
            )}

            {/* Cabecera del Documento - Estilo moderno */}
            <div style={{ 
                backgroundColor: 'white', 
                padding: isMobile ? '15px' : '15px', 
                marginBottom: '15px', 
                borderRadius: '12px', 
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                border: '1px solid #e0e0e0'
            }}>
                <div style={{ 
                    display: 'flex', 
                    flexDirection: isMobile ? 'column' : 'row',
                    justifyContent: isMobile ? 'flex-start' : 'space-between', 
                    alignItems: isMobile ? 'stretch' : 'center',
                    marginBottom: isMobile ? '25px' : '20px',
                    borderBottom: '2px solid #3498db',
                    paddingBottom: '10px',
                    gap: isMobile ? '20px' : '0'
                }}>
                    <h3 style={{ 
                        fontWeight: '600', 
                        color: '#2c3e50', 
                        fontSize: isMobile ? '16px' : '18px',
                        margin: '0',
                        textAlign: isMobile ? 'center' : 'left'
                    }}>
                        Cabecera del Documento
                    </h3>
                    
                    {/* Botones de Acción */}
                    <div style={{ 
                        display: 'flex', 
                        gap: isMobile ? '12px' : '8px',
                        flexWrap: isMobile ? 'wrap' : 'nowrap',
                        justifyContent: isMobile ? 'center' : 'flex-end',
                        width: isMobile ? '100%' : 'auto'
                    }}>
                        <button onClick={handleNuevo} style={{ 
                            backgroundColor: '#2196f3', 
                            color: 'white', 
                            border: 'none', 
                            padding: isMobile ? '12px 16px' : '8px 16px', 
                            cursor: 'pointer', 
                            borderRadius: '6px',
                            fontWeight: '600',
                            fontSize: isMobile ? '14px' : '12px',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 2px 4px rgba(33,150,243,0.3)',
                            flex: isMobile ? '1' : 'none',
                            minWidth: isMobile ? '80px' : 'auto'
                        }}
                        onMouseOver={(e) => {
                            e.target.style.transform = 'translateY(-1px)';
                            e.target.style.boxShadow = '0 4px 8px rgba(33,150,243,0.4)';
                        }}
                        onMouseOut={(e) => {
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = '0 2px 4px rgba(33,150,243,0.3)';
                        }}
                        >Nuevo</button>
                        <button onClick={handleBuscarClick} style={{ 
                            backgroundColor: '#4caf50', 
                            color: 'white', 
                            border: 'none', 
                            padding: isMobile ? '12px 16px' : '8px 16px', 
                            cursor: 'pointer', 
                            borderRadius: '6px',
                            fontWeight: '600',
                            fontSize: isMobile ? '14px' : '12px',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 2px 4px rgba(76,175,80,0.3)',
                            flex: isMobile ? '1' : 'none',
                            minWidth: isMobile ? '80px' : 'auto'
                        }}
                        onMouseOver={(e) => {
                            e.target.style.transform = 'translateY(-1px)';
                            e.target.style.boxShadow = '0 4px 8px rgba(76,175,80,0.4)';
                        }}
                        onMouseOut={(e) => {
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = '0 2px 4px rgba(76,175,80,0.3)';
                        }}
                        >Busca</button>
                        
                        <button 
                            onClick={handleCabGuiasClick}
                            style={{ 
                                backgroundColor: '#9b59b6', 
                                color: 'white', 
                                border: 'none', 
                                padding: isMobile ? '12px 16px' : '8px 16px', 
                                cursor: 'pointer', 
                                borderRadius: '6px',
                                fontWeight: '600',
                                fontSize: isMobile ? '14px' : '12px',
                                transition: 'all 0.3s ease',
                                boxShadow: '0 2px 4px rgba(155,89,182,0.3)',
                                flex: isMobile ? '1' : 'none',
                                minWidth: isMobile ? '80px' : 'auto'
                            }}
                        onMouseOver={(e) => {
                            e.target.style.transform = 'translateY(-1px)';
                            e.target.style.boxShadow = '0 4px 8px rgba(155,89,182,0.4)';
                        }}
                        onMouseOut={(e) => {
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = '0 2px 4px rgba(155,89,182,0.3)';
                        }}
                        >CabGuias</button>
                        
                        <button 
                            onClick={handleEliminar} 
                            disabled={!isConsultaMode}
                            style={{ 
                                backgroundColor: !isConsultaMode ? '#bdc3c7' : '#f44336', 
                                color: 'white', 
                                border: 'none', 
                                padding: isMobile ? '12px 16px' : '8px 16px', 
                                cursor: !isConsultaMode ? 'not-allowed' : 'pointer', 
                                borderRadius: '6px',
                                fontWeight: '600',
                                fontSize: isMobile ? '14px' : '12px',
                                transition: 'all 0.3s ease',
                                boxShadow: !isConsultaMode ? 'none' : '0 2px 4px rgba(244,67,54,0.3)',
                                flex: isMobile ? '1' : 'none',
                                minWidth: isMobile ? '80px' : 'auto'
                            }}
                        onMouseOver={(e) => {
                            if (isConsultaMode) {
                                e.target.style.transform = 'translateY(-1px)';
                                e.target.style.boxShadow = '0 4px 8px rgba(244,67,54,0.4)';
                            }
                        }}
                        onMouseOut={(e) => {
                            if (isConsultaMode) {
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = '0 2px 4px rgba(244,67,54,0.3)';
                            }
                        }}
                        >Eliminar</button>
                        
                        <button 
                            onClick={handleProductosClick}
                            style={{ 
                                backgroundColor: '#ff9800', 
                                color: 'white', 
                                border: 'none', 
                                padding: isMobile ? '12px 16px' : '8px 16px', 
                                cursor: 'pointer', 
                                borderRadius: '6px',
                                fontWeight: '600',
                                fontSize: isMobile ? '14px' : '12px',
                                transition: 'all 0.3s ease',
                                boxShadow: '0 2px 4px rgba(255,152,0,0.3)',
                                flex: isMobile ? '1' : 'none',
                                minWidth: isMobile ? '80px' : 'auto'
                            }}
                        onMouseOver={(e) => {
                            e.target.style.transform = 'translateY(-1px)';
                            e.target.style.boxShadow = '0 4px 8px rgba(255,152,0,0.4)';
                        }}
                        onMouseOut={(e) => {
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = '0 2px 4px rgba(255,152,0,0.3)';
                        }}
                        >Productos</button>
                    </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4">
                    <input 
                        type="text" 
                        name="NroGuia" 
                        value={cabecera.NroGuia} 
                        onChange={handleCabeceraChange} 
                        readOnly={true}
                        placeholder="Nro Docum"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-100 text-gray-600 cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-gray-500"
                    />
                    
                    <input 
                        type="date" 
                        name="Fecha" 
                        value={formatFechaConsistente(cabecera.Fecha)} 
                        onChange={handleCabeceraChange}
                        disabled={true}
                        placeholder="Fecha Emisión"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-100 text-gray-600 cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-gray-500"
                    />
                    
                    <select 
                        name="Proveedor" 
                        value={cabecera.Proveedor} 
                        onChange={handleCabeceraChange}
                        disabled={isConsultaMode}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            isConsultaMode 
                                ? 'bg-gray-100 text-gray-600 cursor-not-allowed' 
                                : 'bg-white text-gray-900 cursor-pointer'
                        }`}
                    >
                        <option value="">Proveedor</option>
                        {proveedores.map(prov => (
                            <option key={prov.proveedor} value={prov.proveedor}>
                                {prov.razon}
                            </option>
                        ))}
                    </select>
                    
                    <select 
                        name="EmpTrans" 
                        value={cabecera.EmpTrans} 
                        onChange={handleTransportistaChange}
                        disabled={isConsultaMode}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            isConsultaMode 
                                ? 'bg-gray-100 text-gray-600 cursor-not-allowed' 
                                : 'bg-white text-gray-900 cursor-pointer'
                        }`}
                    >
                        <option value="">Empresa Transporte</option>
                        {transportistas.map(trans => (
                            <option key={trans.Codprov || `empty-${trans.Razon}`} value={trans.Razon}>
                                {trans.Razon} {!trans.Codprov || trans.Codprov.trim() === '' ? '' : ''}
                            </option>
                        ))}
                    </select>
                    
                    <input 
                        type="text" 
                        name="RucTrans" 
                        value={cabecera.RucTrans} 
                        onChange={handleCabeceraChange}
                        readOnly
                        placeholder="RUC Transportista"
                        style={{
                            padding: '8px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: '14px',
                            transition: 'border-color 0.3s ease',
                            backgroundColor: '#f8f9fa',
                            color: '#495057',
                            width: '100%',
                            boxSizing: 'border-box',
                            outline: 'none'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#3498db'}
                        onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                    />
                    
                    <input 
                        type="text" 
                        name="Placa" 
                        value={cabecera.Placa} 
                        onChange={handleCabeceraChange}
                        disabled={isConsultaMode}
                        placeholder="Placa Vehículo"
                        style={{
                            padding: '12px',
                            border: '2px solid #e0e0e0',
                            borderRadius: '8px',
                            fontSize: '14px',
                            transition: 'border-color 0.3s ease',
                            backgroundColor: isConsultaMode ? '#f5f5f5' : 'white',
                            cursor: isConsultaMode ? 'not-allowed' : 'auto'
                        }}
                        onFocus={(e) => !isConsultaMode && (e.target.style.borderColor = '#3498db')}
                        onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                    />
                    
                    <input 
                        type="text" 
                        name="PtoLlegada" 
                        value={cabecera.PtoLlegada} 
                        onChange={handleCabeceraChange}
                        disabled={isConsultaMode}
                        placeholder="Punto de llegada"
                        style={{
                            padding: '12px',
                            border: '2px solid #e0e0e0',
                            borderRadius: '8px',
                            fontSize: '14px',
                            transition: 'border-color 0.3s ease',
                            backgroundColor: isConsultaMode ? '#f5f5f5' : 'white',
                            cursor: isConsultaMode ? 'not-allowed' : 'auto'
                        }}
                        onFocus={(e) => !isConsultaMode && (e.target.style.borderColor = '#3498db')}
                        onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                    />
                    
                    <input 
                        type="text" 
                        name="Destinatario" 
                        value={cabecera.Destinatario} 
                        onChange={handleCabeceraChange}
                        disabled={isConsultaMode}
                        placeholder="Destinatario"
                        style={{
                            padding: '12px',
                            border: '2px solid #e0e0e0',
                            borderRadius: '8px',
                            fontSize: '14px',
                            transition: 'border-color 0.3s ease',
                            backgroundColor: isConsultaMode ? '#f5f5f5' : 'white',
                            cursor: isConsultaMode ? 'not-allowed' : 'auto'
                        }}
                        onFocus={(e) => !isConsultaMode && (e.target.style.borderColor = '#3498db')}
                        onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                    />
                </div>
            </div>

            {/* Detalles de la Guia (para añadir/editar un item) - Estilo moderno */}
            <div style={{ 
                backgroundColor: 'white', 
                padding: '15px', 
                marginBottom: '15px', 
                borderRadius: '12px', 
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                border: '1px solid #e0e0e0'
            }}>
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '20px',
                    borderBottom: '2px solid #e74c3c',
                    paddingBottom: '10px'
                }}>
                    <h3 style={{ 
                        fontWeight: '600', 
                        color: '#2c3e50', 
                        fontSize: '18px',
                        margin: '0'
                    }}>
                        ➕ Detalles de la Guía (Agregar Item)
                    </h3>
                    <button 
                        onClick={handleAddDetalle}
                        disabled={isConsultaMode || !currentItemDetalle.codpro || !currentItemDetalle.Cantidad || currentItemDetalle.Cantidad <= 0}
                        style={{
                            backgroundColor: (isConsultaMode || !currentItemDetalle.codpro || !currentItemDetalle.Cantidad || currentItemDetalle.Cantidad <= 0) ? '#bdc3c7' : '#e74c3c',
                            color: 'white',
                            border: 'none',
                            padding: '10px 20px',
                            cursor: (isConsultaMode || !currentItemDetalle.codpro || !currentItemDetalle.Cantidad || currentItemDetalle.Cantidad <= 0) ? 'not-allowed' : 'pointer',
                            borderRadius: '6px',
                            fontWeight: '600',
                            fontSize: '13px',
                            transition: 'all 0.3s ease',
                            boxShadow: (!currentItemDetalle.codpro || !currentItemDetalle.Cantidad || currentItemDetalle.Cantidad <= 0) ? 'none' : '0 2px 8px rgba(231,76,60,0.3)'
                        }}
                        onMouseOver={(e) => {
                            if (!isConsultaMode && currentItemDetalle.codpro && currentItemDetalle.Cantidad && currentItemDetalle.Cantidad > 0) {
                                e.target.style.transform = 'translateY(-2px)';
                                e.target.style.boxShadow = '0 4px 12px rgba(231,76,60,0.4)';
                            }
                        }}
                        onMouseOut={(e) => {
                            if (!isConsultaMode && currentItemDetalle.codpro && currentItemDetalle.Cantidad && currentItemDetalle.Cantidad > 0) {
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = '0 2px 8px rgba(231,76,60,0.3)';
                            }
                        }}
                    >
                        ➕ Agregar Detalle
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Input de búsqueda de productos con autocompletado */}
                    <div style={{ position: 'relative' }} className="producto-dropdown-container">
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <input 
                                type="text" 
                                value={productoSearchTerm}
                                onChange={(e) => handleProductoSearch(e.target.value)}
                                onFocus={() => setShowProductoDropdown(true)}
                                onKeyDown={handleKeyDown}
                                disabled={isConsultaMode || !selectedLaboratorio || productosADevolver.length === 0}
                                placeholder={
                                    !selectedLaboratorio 
                                        ? 'Seleccione un laboratorio primero' 
                                        : productosADevolver.length === 0 
                                            ? 'No hay productos disponibles' 
                                            : 'Buscar por código de producto...'
                                }
                                className={`w-full px-3 py-2 pr-10 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500 h-10 ${
                                    (isConsultaMode || !selectedLaboratorio || productosADevolver.length === 0)
                                        ? 'bg-gray-100 text-gray-600 cursor-not-allowed opacity-60' 
                                        : 'bg-white text-gray-900'
                                }`}
                            />
                            
                            {/* Botón de recarga */}
                            {selectedLaboratorio && !isConsultaMode && (
                                <button
                                    onClick={async () => {
                                        try {
                                            setIsLoading(true);
                                            setMessage('');
                                            setIsError(false);
                                            
                                            const cleanCodlab = selectedLaboratorio.trim();
                                            console.log('🔄 Recargando productos para laboratorio:', cleanCodlab);
                                            
                                            const response = await axios.get(`/guias-devolucion/${cleanCodlab}/productos-a-devolver`);
                                            if (response.data.success) {
                                                setProductosADevolver(response.data.data);
                                                setFilteredProductos(response.data.data);
                                                setProductoSearchTerm('');
                                                setShowProductoDropdown(false);
                                                
                                                console.log('✅ Productos recargados:', response.data.data.length, 'productos');
                                                setMessage(`✅ Productos actualizados: ${response.data.data.length} productos disponibles`);
                                                setIsError(false);
                                            } else {
                                                setMessage(`❌ Error al recargar productos: ${response.data.message}`);
                                                setIsError(true);
                                            }
                                        } catch (error) {
                                            console.error('❌ Error al recargar productos:', error);
                                            setMessage(`❌ Error de red al recargar productos: ${error.message}`);
                                            setIsError(true);
                                        } finally {
                                            setIsLoading(false);
                                        }
                                    }}
                                    disabled={isLoading}
                                    style={{
                                        position: 'absolute',
                                        right: '8px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        backgroundColor: 'transparent',
                                        border: 'none',
                                        cursor: isLoading ? 'not-allowed' : 'pointer',
                                        padding: '4px',
                                        borderRadius: '4px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'all 0.2s ease',
                                        opacity: isLoading ? 0.5 : 1
                                    }}
                                    onMouseOver={(e) => {
                                        if (!isLoading) {
                                            e.target.style.backgroundColor = '#f3f4f6';
                                        }
                                    }}
                                    onMouseOut={(e) => {
                                        e.target.style.backgroundColor = 'transparent';
                                    }}
                                    title="Recargar productos disponibles"
                                >
                                    <svg 
                                        width="16" 
                                        height="16" 
                                        viewBox="0 0 24 24" 
                                        fill="none" 
                                        stroke="currentColor" 
                                        strokeWidth="2" 
                                        strokeLinecap="round" 
                                        strokeLinejoin="round"
                                        style={{
                                            color: '#6b7280',
                                            animation: isLoading ? 'spin 1s linear infinite' : 'none'
                                        }}
                                    >
                                        <path d="M23 4v6h-6"/>
                                        <path d="M1 20v-6h6"/>
                                        <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
                                    </svg>
                                </button>
                            )}
                        </div>
                        
                        {/* Dropdown de productos filtrados */}
                        {showProductoDropdown && !isConsultaMode && selectedLaboratorio && filteredProductos.length > 0 && (
                            <div style={{
                                position: 'absolute',
                                top: '100%',
                                left: 0,
                                right: 0,
                                backgroundColor: 'white',
                                border: '1px solid #d1d5db',
                                borderRadius: '6px',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                                zIndex: 1000,
                                maxHeight: '200px',
                                overflowY: 'auto'
                            }}>
                                {filteredProductos.map((prod, index) => (
                                    <div
                                        key={`${prod.Codpro}-${prod.Lote}-${prod.NroGuia}-${index}`}
                                        onClick={() => handleSelectProducto(prod)}
                                        style={{
                                            padding: '8px 12px',
                                            cursor: 'pointer',
                                            borderBottom: '1px solid #f3f4f6',
                                            fontSize: '12px',
                                            transition: 'background-color 0.2s ease',
                                            backgroundColor: 'white'
                                        }}
                                        onMouseOver={(e) => {
                                            e.currentTarget.style.backgroundColor = '#f3f4f6';
                                        }}
                                        onMouseOut={(e) => {
                                            e.currentTarget.style.backgroundColor = 'white';
                                        }}
                                    >
                                        <div style={{ fontWeight: '600', color: '#374151' }}>
                                            {prod.Codpro} - {prod.Nombre}
                                        </div>
                                        <div style={{ color: '#6b7280', fontSize: '11px' }}>
                                            Lote: {prod.Lote} | Cant: {prod.Cantidad}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <input 
                        type="number" 
                        name="Cantidad" 
                        value={currentItemDetalle.Cantidad} 
                        onChange={handleDetalleChange}
                        onKeyDown={handleKeyDown}
                        disabled={isConsultaMode}
                        placeholder="Unidades"
                        className={`w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500 h-10 ${
                            isConsultaMode 
                                ? 'bg-gray-100 text-gray-600 cursor-not-allowed' 
                                : 'bg-white text-gray-900'
                        }`}
                    />
                    <input 
                        type="text" 
                        name="lote" 
                        value={currentItemDetalle.lote} 
                        onChange={handleDetalleChange} 
                        readOnly
                        placeholder="Lote"
                        style={{
                            padding: '8px 12px',
                            border: '2px solid #e0e0e0',
                            borderRadius: '8px',
                            fontSize: '14px',
                            backgroundColor: '#f5f5f5',
                            color: '#666',
                            height: '40px'
                        }}
                    />
                    
                    <input 
                        type="date" 
                        name="Vencimiento" 
                        value={formatFechaConsistente(currentItemDetalle.Vencimiento)} 
                        onChange={handleDetalleChange} 
                        readOnly
                        placeholder="Vencimiento"
                        style={{
                            padding: '8px 12px',
                            border: '2px solid #e0e0e0',
                            borderRadius: '8px',
                            fontSize: '14px',
                            backgroundColor: '#f5f5f5',
                            color: '#666',
                            height: '40px'
                        }}
                    />
                    
                   
                </div>
            </div>

            {/* Grilla de Detalles de la Guia - Estilo moderno */}
            <div style={{ 
                backgroundColor: 'white', 
                padding: '15px', 
                marginBottom: '15px', 
                borderRadius: '12px', 
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                border: '1px solid #e0e0e0'
            }}>
                <h3 style={{ 
                    fontWeight: '600', 
                    color: '#2c3e50', 
                    marginBottom: '20px',
                    fontSize: '18px',
                    borderBottom: '2px solid #9b59b6',
                    paddingBottom: '10px'
                }}>
                    📋 Detalles de la Guía Actual
                </h3>
                {detalles.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        padding: '40px',
                        color: '#7f8c8d',
                        fontSize: '16px',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '8px',
                        border: '2px dashed #bdc3c7'
                    }}>
                        📝 No hay detalles agregados.
                    </div>
                ) : (
                    <div style={{
                        overflowX: 'auto',
                        borderRadius: '8px',
                        border: '1px solid #e0e0e0'
                    }}>
                        <table style={{ 
                            width: '100%', 
                            borderCollapse: 'collapse',
                            fontSize: '14px'
                        }}>
                            <thead>
                                <tr style={{ 
                                    backgroundColor: '#9b59b6', 
                                    color: 'white',
                                    fontWeight: '600'
                                }}>
                                    <th style={{ 
                                        padding: '15px 12px', 
                                        border: '1px solid #8e44ad',
                                        textAlign: 'left',
                                        fontSize: '13px'
                                    }}>NroGuia (Devo)</th>
                                    <th style={{ 
                                        padding: '15px 12px', 
                                        border: '1px solid #8e44ad',
                                        textAlign: 'left',
                                        fontSize: '13px'
                                    }}>CodPro</th>
                                    <th style={{ 
                                        padding: '15px 12px', 
                                        border: '1px solid #8e44ad',
                                        textAlign: 'left',
                                        fontSize: '13px'
                                    }}>Producto</th>
                                    <th style={{ 
                                        padding: '15px 12px', 
                                        border: '1px solid #8e44ad',
                                        textAlign: 'left',
                                        fontSize: '13px'
                                    }}>Lote</th>
                                    <th style={{ 
                                        padding: '15px 12px', 
                                        border: '1px solid #8e44ad',
                                        textAlign: 'left',
                                        fontSize: '13px'
                                    }}>Vencimiento</th>
                                    <th style={{ 
                                        padding: '15px 12px', 
                                        border: '1px solid #8e44ad',
                                        textAlign: 'left',
                                        fontSize: '13px'
                                    }}>Cantidad</th>
                                    <th style={{ 
                                        padding: '15px 12px', 
                                        border: '1px solid #8e44ad',
                                        textAlign: 'left',
                                        fontSize: '13px'
                                    }}>Referencia</th>
                                    <th style={{ 
                                        padding: '15px 12px', 
                                        border: '1px solid #8e44ad',
                                        textAlign: 'left',
                                        fontSize: '13px'
                                    }}>Tipo Doc</th>
                                    <th style={{ 
                                        padding: '15px 12px', 
                                        border: '1px solid #8e44ad',
                                        textAlign: 'center',
                                        fontSize: '13px'
                                    }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {detalles.map((item, index) => (
                                    <tr key={index} style={{ 
                                        backgroundColor: index % 2 === 0 ? '#f8f9fa' : '#ffffff',
                                        transition: 'background-color 0.2s ease'
                                    }}
                                    onMouseOver={(e) => e.target.parentElement.style.backgroundColor = '#e8f4fd'}
                                    onMouseOut={(e) => e.target.parentElement.style.backgroundColor = index % 2 === 0 ? '#f8f9fa' : '#ffffff'}
                                    >
                                        <td style={{ 
                                            padding: '12px', 
                                            border: '1px solid #e0e0e0',
                                            fontSize: '13px',
                                            fontWeight: '500'
                                        }}>{item.GuiaDevo}</td>
                                        <td style={{ 
                                            padding: '12px', 
                                            border: '1px solid #e0e0e0',
                                            fontSize: '13px',
                                            fontWeight: '500'
                                        }}>{item.codpro}</td>
                                        <td style={{ 
                                            padding: '12px', 
                                            border: '1px solid #e0e0e0',
                                            fontSize: '13px'
                                        }}>{item.Producto}</td>
                                        <td style={{ 
                                            padding: '12px', 
                                            border: '1px solid #e0e0e0',
                                            fontSize: '13px',
                                            fontWeight: '500'
                                        }}>{item.lote}</td>
                                        <td style={{ 
                                            padding: '12px', 
                                            border: '1px solid #e0e0e0',
                                            fontSize: '13px'
                                        }}>{formatFechaDisplay(item.Vencimiento)}</td>
                                        <td style={{ 
                                            padding: '12px', 
                                            border: '1px solid #e0e0e0',
                                            fontSize: '13px',
                                            fontWeight: '600',
                                            textAlign: 'center'
                                        }}>
                                            <input
                                                type="number"
                                                value={item.Cantidad}
                                                onChange={(e) => handleEditCantidad(index, e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.target.blur();
                                                    }
                                                }}
                                                disabled={isConsultaMode}
                                                min="0"
                                                step="1"
                                                style={{
                                                    width: '60px',
                                                    padding: '4px 8px',
                                                    border: '1px solid #ddd',
                                                    borderRadius: '4px',
                                                    fontSize: '12px',
                                                    textAlign: 'center',
                                                    backgroundColor: isConsultaMode ? '#f5f5f5' : 'white',
                                                    cursor: isConsultaMode ? 'not-allowed' : 'pointer'
                                                }}
                                                title="Haz clic para editar la cantidad"
                                                onFocus={(e) => !isConsultaMode && (e.target.style.borderColor = '#3498db')}
                                                onBlur={(e) => e.target.style.borderColor = '#ddd'}
                                            />
                                        </td>
                                        <td style={{ 
                                            padding: '12px', 
                                            border: '1px solid #e0e0e0',
                                            fontSize: '13px',
                                            fontWeight: '500'
                                        }}>{item.Referencia || ''}</td>
                                        <td style={{ 
                                            padding: '12px', 
                                            border: '1px solid #e0e0e0',
                                            fontSize: '13px',
                                            fontWeight: '500'
                                        }}>{item.tipodoc || item.TipoDoc || ''}</td>
                                        <td style={{ 
                                            padding: '12px', 
                                            border: '1px solid #e0e0e0',
                                            textAlign: 'center'
                                        }}>
                                            <button 
                                                onClick={() => handleRemoveDetalle(index)} 
                                                disabled={isConsultaMode}
                                                style={{ 
                                                    backgroundColor: isConsultaMode ? '#bdc3c7' : '#e74c3c', 
                                                    color: 'white', 
                                                    border: 'none', 
                                                    padding: '8px 16px', 
                                                    cursor: isConsultaMode ? 'not-allowed' : 'pointer', 
                                                    borderRadius: '6px',
                                                    fontSize: '12px',
                                                    fontWeight: '600',
                                                    transition: 'all 0.3s ease',
                                                    boxShadow: isConsultaMode ? 'none' : '0 2px 4px rgba(231,76,60,0.3)'
                                                }}
                                                onMouseOver={(e) => {
                                                    if (!isConsultaMode) {
                                                        e.target.style.transform = 'translateY(-1px)';
                                                        e.target.style.boxShadow = '0 4px 8px rgba(231,76,60,0.4)';
                                                    }
                                                }}
                                                onMouseOut={(e) => {
                                                    if (!isConsultaMode) {
                                                        e.target.style.transform = 'translateY(0)';
                                                        e.target.style.boxShadow = '0 2px 4px rgba(231,76,60,0.3)';
                                                    }
                                                }}
                                            >
                                                🗑️ Eliminar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Panel de Botones Inferiores - Estilo moderno */}
            <div style={{ 
                display: 'flex', 
                justifyContent: 'flex-end', 
                gap: '15px',
                padding: '10px',
                borderRadius: '12px',
                marginTop: '15px',
                marginBottom: '15px'
            }}>
                <button 
                    onClick={handleRegistrar} 
                    disabled={isConsultaMode}
                    style={{ 
                        backgroundColor: isConsultaMode ? '#bdc3c7' : '#27ae60', 
                        color: 'white',
                        border: 'none',
                        padding: '15px 30px',
                        cursor: isConsultaMode ? 'not-allowed' : 'pointer',
                        borderRadius: '8px',
                        fontWeight: '600',
                        fontSize: '15px',
                        transition: 'all 0.3s ease',
                        boxShadow: isConsultaMode ? 'none' : '0 2px 8px rgba(39,174,96,0.3)'
                    }}
                    onMouseOver={(e) => {
                        if (!isConsultaMode) {
                            e.target.style.transform = 'translateY(-2px)';
                            e.target.style.boxShadow = '0 4px 12px rgba(39,174,96,0.4)';
                        }
                    }}
                    onMouseOut={(e) => {
                        if (!isConsultaMode) {
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = '0 2px 8px rgba(39,174,96,0.3)';
                        }
                    }}
                >
                    💾 Registrar
                </button>
                <button 
                    onClick={handleCancelar} 
                    style={{ 
                        backgroundColor: '#f39c12', 
                        color: 'white',
                        border: 'none',
                        padding: '15px 30px',
                        cursor: 'pointer',
                        borderRadius: '8px',
                        fontWeight: '600',
                        fontSize: '15px',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 2px 8px rgba(243,156,18,0.3)'
                    }}
                    onMouseOver={(e) => {
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = '0 4px 12px rgba(243,156,18,0.4)';
                    }}
                    onMouseOut={(e) => {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 2px 8px rgba(243,156,18,0.3)';
                    }}
                >
                    ❌ Cancelar
                </button>
                
            </div>

            {/* Modal de Búsqueda de Guías de Canje - Estilo moderno */}
            {showBuscarModal && (
                <div 
                    style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                        backdropFilter: 'blur(5px)'
                    }}
                    onClick={() => setShowBuscarModal(false)}
                >
                    <div 
                        style={{
                            backgroundColor: 'white', 
                            padding: isMobile ? '20px' : '30px', 
                            borderRadius: '16px',
                            width: isMobile ? '95%' : '90%', 
                            maxWidth: '1200px', 
                            maxHeight: isMobile ? '90%' : '85%', 
                            overflowY: 'auto',
                            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                            border: '1px solid #e0e0e0',
                            position: 'relative'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header con título y botón cerrar */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '25px',
                            borderBottom: '3px solid #27ae60',
                            paddingBottom: '15px'
                        }}>
                            <h3 style={{ 
                                color: '#2c3e50',
                                fontSize: isMobile ? '20px' : '24px',
                                fontWeight: '600',
                                margin: '0',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px'
                            }}>
                                📋 Seleccionar Guía de Canje
                                <span style={{
                                    fontSize: '14px',
                                    color: '#7f8c8d',
                                    fontWeight: '400'
                                }}>
                                    (FF01 - Junio 2025 en adelante)
                                </span>
                            </h3>
                            <button 
                                onClick={() => setShowBuscarModal(false)}
                                style={{
                                    backgroundColor: '#e74c3c',
                                    color: 'white',
                                    border: 'none',
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    cursor: 'pointer',
                                    fontSize: '16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.3s ease'
                                }}
                                onMouseOver={(e) => e.target.style.backgroundColor = '#c0392b'}
                                onMouseOut={(e) => e.target.style.backgroundColor = '#e74c3c'}
                            >
                                ✕
                            </button>
                        </div>

                        {/* Contenido del modal */}
                        {guiasCanjeList.length === 0 ? (
                            <div style={{
                                textAlign: 'center',
                                padding: '40px 20px',
                                color: '#7f8c8d'
                            }}>
                                <div style={{ fontSize: '48px', marginBottom: '20px' }}>📭</div>
                                <h4 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>No hay guías disponibles</h4>
                                <p style={{ margin: '0', fontSize: '14px' }}>
                                    No se encontraron guías FF01 del mes de junio 2025 en adelante.
                                </p>
                            </div>
                        ) : (
                            <div style={{
                                maxHeight: '59vh',
                                overflowY: 'auto',
                                border: '1px solid #e0e0e0',
                                borderRadius: '8px'
                            }}>
                                <table style={{ 
                                    width: '100%', 
                                    borderCollapse: 'collapse',
                                    fontSize: isMobile ? '12px' : '14px'
                                }}>
                                    <thead>
                                        <tr style={{ 
                                            backgroundColor: '#27ae60', 
                                            color: 'white',
                                            position: 'sticky',
                                            top: 0,
                                            zIndex: 10
                                        }}>
                                            <th style={{ 
                                                padding: isMobile ? '12px 8px' : '15px 12px', 
                                                border: '1px solid #1e8449',
                                                textAlign: 'left',
                                                fontWeight: '600',
                                                fontSize: isMobile ? '11px' : '13px'
                                            }}>
                                                📄 Nro Guía
                                            </th>
                                            <th style={{ 
                                                padding: isMobile ? '12px 8px' : '15px 12px', 
                                                border: '1px solid #1e8449',
                                                textAlign: 'left',
                                                fontWeight: '600',
                                                fontSize: isMobile ? '11px' : '13px'
                                            }}>
                                                📅 Fecha
                                            </th>
                                            <th style={{ 
                                                padding: isMobile ? '12px 8px' : '15px 12px', 
                                                border: '1px solid #1e8449',
                                                textAlign: 'left',
                                                fontWeight: '600',
                                                fontSize: isMobile ? '11px' : '13px'
                                            }}>
                                                🏢 Proveedor
                                            </th>
                                            <th style={{ 
                                                padding: isMobile ? '12px 8px' : '15px 12px', 
                                                border: '1px solid #1e8449',
                                                textAlign: 'center',
                                                fontWeight: '600',
                                                fontSize: isMobile ? '11px' : '13px'
                                            }}>
                                                ⚡ Acción
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {guiasCanjeList.map((guia, index) => (
                                            <tr 
                                                key={index} 
                                                style={{ 
                                                    backgroundColor: index % 2 === 0 ? '#f8f9fa' : '#ffffff',
                                                    transition: 'background-color 0.2s ease'
                                                }}
                                                onMouseOver={(e) => e.target.parentElement.style.backgroundColor = '#e8f5e8'}
                                                onMouseOut={(e) => e.target.parentElement.style.backgroundColor = index % 2 === 0 ? '#f8f9fa' : '#ffffff'}
                                            >
                                                <td style={{ 
                                                    padding: isMobile ? '10px 8px' : '12px 10px', 
                                                    border: '1px solid #e0e0e0',
                                                    fontWeight: '600',
                                                    color: '#2c3e50',
                                                    fontSize: isMobile ? '11px' : '12px'
                                                }}>
                                                    {guia.NroGuia}
                                                </td>
                                                <td style={{ 
                                                    padding: isMobile ? '10px 8px' : '12px 10px', 
                                                    border: '1px solid #e0e0e0',
                                                    color: '#34495e'
                                                }}>
                                                    {formatFechaDisplay(guia.Fecha)}
                                                </td>
                                                <td style={{ 
                                                    padding: isMobile ? '10px 8px' : '12px 10px', 
                                                    border: '1px solid #e0e0e0',
                                                    color: '#34495e',
                                                    maxWidth: isMobile ? '150px' : '300px',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap'
                                                }}
                                                title={guia.Razon}
                                                >
                                                    {guia.Razon}
                                                </td>
                                                <td style={{ 
                                                    padding: isMobile ? '10px 8px' : '12px 10px', 
                                                    border: '1px solid #e0e0e0',
                                                    textAlign: 'center'
                                                }}>
                                                    <button 
                                                        onClick={() => handleSeleccionarGuiaBusqueda(guia)} 
                                                        style={{ 
                                                            backgroundColor: '#3498db', 
                                                            color: 'white', 
                                                            border: 'none', 
                                                            padding: isMobile ? '6px 12px' : '8px 16px', 
                                                            cursor: 'pointer', 
                                                            borderRadius: '6px',
                                                            fontSize: isMobile ? '11px' : '12px',
                                                            fontWeight: '500',
                                                            transition: 'all 0.3s ease',
                                                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                                        }}
                                                        onMouseOver={(e) => {
                                                            e.target.style.backgroundColor = '#2980b9';
                                                            e.target.style.transform = 'translateY(-1px)';
                                                            e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
                                                        }}
                                                        onMouseOut={(e) => {
                                                            e.target.style.backgroundColor = '#3498db';
                                                            e.target.style.transform = 'translateY(0)';
                                                            e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                                                        }}
                                                    >
                                                        ✅ Seleccionar
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Footer con información */}
                        <div style={{
                            marginTop: '20px',
                            padding: '15px',
                            backgroundColor: '#f8f9fa',
                            borderRadius: '8px',
                            border: '1px solid #e9ecef',
                            fontSize: '12px',
                            color: '#6c757d',
                            textAlign: 'center'
                        }}>
                            <strong>Total de guías encontradas:</strong> {guiasCanjeList.length} | 
                            <strong> Filtro aplicado:</strong> FF01 - Junio 2025 en adelante
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Selección de Laboratorio - Estilo moderno */}
            {showLaboratorioModal && (
                <div 
                    style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                        backdropFilter: 'blur(5px)'
                    }}
                    onClick={() => setShowLaboratorioModal(false)}
                >
                    <div 
                        style={{
                            backgroundColor: 'white', 
                            padding: isMobile ? '20px' : '30px', 
                            borderRadius: '16px',
                            width: isMobile ? '95%' : '90%', 
                            maxWidth: '1000px', 
                            maxHeight: isMobile ? '90%' : '85%', 
                            overflowY: 'auto',
                            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                            border: '1px solid #e0e0e0',
                            position: 'relative'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header con título y botón cerrar */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '25px',
                            borderBottom: '3px solid #3498db',
                            paddingBottom: '15px'
                        }}>
                            <h3 style={{ 
                                color: '#2c3e50',
                                fontSize: isMobile ? '20px' : '24px',
                                fontWeight: '600',
                                margin: '0'
                            }}>
                                🏥 Selección de Laboratorio
                            </h3>
                            <button 
                                onClick={() => setShowLaboratorioModal(false)}
                                style={{
                                    backgroundColor: '#e74c3c',
                                    color: 'white',
                                    border: 'none',
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    cursor: 'pointer',
                                    fontSize: '16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.3s ease',
                                    boxShadow: '0 2px 4px rgba(231,76,60,0.3)'
                                }}
                                onMouseOver={(e) => {
                                    e.target.style.transform = 'scale(1.1)';
                                    e.target.style.boxShadow = '0 4px 8px rgba(231,76,60,0.4)';
                                }}
                                onMouseOut={(e) => {
                                    e.target.style.transform = 'scale(1)';
                                    e.target.style.boxShadow = '0 2px 4px rgba(231,76,60,0.3)';
                                }}
                                title="Cerrar modal"
                            >
                                ✕
                            </button>
                        </div>
                        
                        {/* Campo de búsqueda */}
                        <div style={{ marginBottom: '20px' }}>
                            <input
                                type="text"
                                placeholder="🔍 Buscar laboratorio por nombre o código..."
                                value={laboratorioSearchTerm}
                                onChange={(e) => setLaboratorioSearchTerm(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: isMobile ? '12px' : '15px',
                                    border: '2px solid #e0e0e0',
                                    borderRadius: '10px',
                                    fontSize: isMobile ? '14px' : '16px',
                                    transition: 'border-color 0.3s ease',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                    boxSizing: 'border-box'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#3498db'}
                                onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                            />
                        </div>

                        {/* Tabla de laboratorios */}
                        {laboratorios.length === 0 ? (
                            <div style={{
                                textAlign: 'center',
                                padding: isMobile ? '30px' : '40px',
                                color: '#7f8c8d',
                                fontSize: isMobile ? '14px' : '16px',
                                backgroundColor: '#f8f9fa',
                                borderRadius: '10px',
                                border: '2px dashed #bdc3c7'
                            }}>
                                📋 No hay laboratorios disponibles.
                            </div>
                        ) : (
                            <div style={{
                                maxHeight: isMobile ? '300px' : '400px',
                                overflowY: 'auto',
                                overflowX: 'auto',
                                borderRadius: '10px',
                                border: '1px solid #e0e0e0',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                                backgroundColor: 'white'
                            }}>
                                <table style={{ 
                                    width: '100%', 
                                    borderCollapse: 'collapse',
                                    fontSize: isMobile ? '12px' : '14px',
                                    minWidth: isMobile ? '600px' : 'auto'
                                }}>
                                    <thead>
                                        <tr style={{ 
                                            backgroundColor: '#3498db', 
                                            color: 'white',
                                            fontWeight: '600',
                                            position: 'sticky',
                                            top: '0',
                                            zIndex: '1'
                                        }}>
                                            <th style={{ 
                                                padding: isMobile ? '10px 8px' : '15px 12px', 
                                                border: '1px solid #2980b9',
                                                textAlign: 'left',
                                                fontSize: isMobile ? '12px' : '14px',
                                                minWidth: isMobile ? '80px' : 'auto'
                                            }}>Codlab</th>
                                            <th style={{ 
                                                padding: isMobile ? '10px 8px' : '15px 12px', 
                                                border: '1px solid #2980b9',
                                                textAlign: 'left',
                                                fontSize: isMobile ? '12px' : '14px',
                                                minWidth: isMobile ? '200px' : 'auto'
                                            }}>Descripción</th>
                                            <th style={{ 
                                                padding: isMobile ? '10px 8px' : '15px 12px', 
                                                border: '1px solid #2980b9',
                                                textAlign: 'center',
                                                fontSize: isMobile ? '12px' : '14px',
                                                minWidth: isMobile ? '100px' : 'auto'
                                            }}>Estado</th>
                                            <th style={{ 
                                                padding: isMobile ? '10px 8px' : '15px 12px', 
                                                border: '1px solid #2980b9',
                                                textAlign: 'center',
                                                fontSize: isMobile ? '12px' : '14px',
                                                minWidth: isMobile ? '120px' : 'auto'
                                            }}>Acción</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {laboratorios
                                            .filter(lab => 
                                                lab.Descripcion.toLowerCase().includes(laboratorioSearchTerm.toLowerCase()) ||
                                                lab.codlab.toString().includes(laboratorioSearchTerm)
                                            )
                                            .map((laboratorio, index) => (
                                                <tr key={laboratorio.codlab} style={{ 
                                                    backgroundColor: index % 2 === 0 ? '#f8f9fa' : '#ffffff',
                                                    transition: 'background-color 0.2s ease'
                                                }}
                                                onMouseOver={(e) => e.target.parentElement.style.backgroundColor = '#e8f4fd'}
                                                onMouseOut={(e) => e.target.parentElement.style.backgroundColor = index % 2 === 0 ? '#f8f9fa' : '#ffffff'}
                                                >
                                                    <td style={{ 
                                                        padding: isMobile ? '8px 6px' : '12px', 
                                                        border: '1px solid #e0e0e0',
                                                        fontSize: isMobile ? '11px' : '13px',
                                                        fontWeight: '600',
                                                        whiteSpace: 'nowrap'
                                                    }}>{laboratorio.codlab}</td>
                                                    <td style={{ 
                                                        padding: isMobile ? '8px 6px' : '12px', 
                                                        border: '1px solid #e0e0e0',
                                                        fontSize: isMobile ? '11px' : '13px',
                                                        wordBreak: 'break-word',
                                                        maxWidth: isMobile ? '180px' : 'auto'
                                                    }}>{laboratorio.Descripcion}</td>
                                                    <td style={{ 
                                                        padding: isMobile ? '8px 6px' : '12px', 
                                                        border: '1px solid #e0e0e0',
                                                        fontSize: isMobile ? '11px' : '13px',
                                                        textAlign: 'center',
                                                        fontWeight: '600',
                                                        whiteSpace: 'nowrap'
                                                    }}>
                                                        <span style={{ 
                                                            color: '#27ae60', 
                                                            backgroundColor: '#d5f4e6',
                                                            padding: isMobile ? '2px 4px' : '4px 8px',
                                                            borderRadius: '4px',
                                                            fontSize: isMobile ? '10px' : '12px'
                                                        }}>
                                                            ✅ Disponible
                                                        </span>
                                                    </td>
                                                    <td style={{ 
                                                        padding: isMobile ? '8px 6px' : '12px', 
                                                        border: '1px solid #e0e0e0',
                                                        textAlign: 'center',
                                                        whiteSpace: 'nowrap'
                                                    }}>
                                                        <button 
                                                            onClick={() => handleSeleccionarLaboratorio(laboratorio)} 
                                                            style={{ 
                                                                backgroundColor: '#27ae60', 
                                                                color: 'white', 
                                                                border: 'none', 
                                                                padding: '10px 20px', 
                                                                cursor: 'pointer', 
                                                                borderRadius: '8px',
                                                                fontWeight: '600',
                                                                fontSize: '13px',
                                                                transition: 'all 0.3s ease',
                                                                boxShadow: '0 2px 4px rgba(39,174,96,0.3)'
                                                            }}
                                                            onMouseOver={(e) => {
                                                                e.target.style.transform = 'translateY(-1px)';
                                                                e.target.style.boxShadow = '0 4px 8px rgba(39,174,96,0.4)';
                                                            }}
                                                            onMouseOut={(e) => {
                                                                e.target.style.transform = 'translateY(0)';
                                                                e.target.style.boxShadow = '0 2px 4px rgba(39,174,96,0.3)';
                                                            }}
                                                            title="Seleccionar laboratorio"
                                                        >
                                                            ✅ Seleccionar
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Modal del Generador del Número de Guía */}
            {showGeneradorModal && (
                <div 
                    style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                        backdropFilter: 'blur(5px)'
                    }}
                    // NO se puede cerrar haciendo clic fuera - solo con botones
                >
                    <div 
                        style={{
                            backgroundColor: 'white', 
                            padding: isMobile ? '20px' : '30px', 
                            borderRadius: '16px',
                            width: isMobile ? '95%' : '500px', 
                            maxHeight: isMobile ? '90%' : 'auto', 
                            overflowY: 'auto',
                            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                            border: '1px solid #e0e0e0',
                            position: 'relative'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header con título y botón cerrar */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '25px',
                            borderBottom: '3px solid #9b59b6',
                            paddingBottom: '15px'
                        }}>
                            <h3 style={{ 
                                color: '#2c3e50',
                                fontSize: isMobile ? '20px' : '24px',
                                fontWeight: '600',
                                margin: '0',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px'
                            }}>
                                🔢 Generador del Número de Guía
                            </h3>
                            <button 
                                onClick={() => setShowGeneradorModal(false)}
                                style={{
                                    backgroundColor: '#e74c3c',
                                    color: 'white',
                                    border: 'none',
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    cursor: 'pointer',
                                    fontSize: '16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.3s ease'
                                }}
                                onMouseOver={(e) => e.target.style.backgroundColor = '#c0392b'}
                                onMouseOut={(e) => e.target.style.backgroundColor = '#e74c3c'}
                            >
                                ✕
                            </button>
                        </div>

                        {/* Contenido del modal */}
                        <div style={{ marginBottom: '25px' }}>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '8px',
                                    fontWeight: '600',
                                    color: '#2c3e50',
                                    fontSize: '14px'
                                }}>
                                    📄 Nro Docum
                                </label>
                                <input
                                    type="text"
                                    value={numeroGuiaGenerado}
                                    readOnly
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        border: '2px solid #e0e0e0',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        backgroundColor: '#f8f9fa',
                                        color: '#495057',
                                        fontWeight: '600'
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '8px',
                                    fontWeight: '600',
                                    color: '#2c3e50',
                                    fontSize: '14px'
                                }}>
                                    📍 Dirección
                                </label>
                                <input
                                    type="text"
                                    value={direccionGuia}
                                    onChange={(e) => setDireccionGuia(e.target.value)}
                                    placeholder="Dirección (opcional)"
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        border: '2px solid #e0e0e0',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        transition: 'border-color 0.3s ease'
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = '#9b59b6'}
                                    onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                                />
                            </div>

                            <div style={{ marginBottom: '25px' }}>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '8px',
                                    fontWeight: '600',
                                    color: '#2c3e50',
                                    fontSize: '14px'
                                }}>
                                    ⚖️ Peso
                                </label>
                                <input
                                    type="number"
                                    value={pesoGuia}
                                    onChange={(e) => setPesoGuia(e.target.value)}
                                    placeholder="0.00"
                                    step="0.01"
                                    min="0"
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        border: '2px solid #e0e0e0',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        transition: 'border-color 0.3s ease'
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = '#9b59b6'}
                                    onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                                />
                            </div>
                        </div>

                        {/* Botones de acción */}
                        <div style={{
                            display: 'flex',
                            gap: '15px',
                            justifyContent: 'flex-end'
                        }}>
                            <button 
                                onClick={() => setShowGeneradorModal(false)}
                                style={{ 
                                    backgroundColor: '#95a5a6', 
                                    color: 'white',
                                    border: 'none',
                                    padding: '12px 24px',
                                    cursor: 'pointer',
                                    borderRadius: '8px',
                                    fontWeight: '600',
                                    fontSize: '14px',
                                    transition: 'all 0.3s ease',
                                    boxShadow: '0 2px 4px rgba(149,165,166,0.3)'
                                }}
                                onMouseOver={(e) => {
                                    e.target.style.transform = 'translateY(-1px)';
                                    e.target.style.boxShadow = '0 4px 8px rgba(149,165,166,0.4)';
                                }}
                                onMouseOut={(e) => {
                                    e.target.style.transform = 'translateY(0)';
                                    e.target.style.boxShadow = '0 2px 4px rgba(149,165,166,0.3)';
                                }}
                            >
                                ❌ Cancelar
                            </button>
                            <button 
                                onClick={handleRetornarModal}
                                disabled={isLoading}
                                style={{ 
                                    backgroundColor: isLoading ? '#bdc3c7' : '#9b59b6', 
                                    color: 'white',
                                    border: 'none',
                                    padding: '12px 24px',
                                    cursor: isLoading ? 'not-allowed' : 'pointer',
                                    borderRadius: '8px',
                                    fontWeight: '600',
                                    fontSize: '14px',
                                    transition: 'all 0.3s ease',
                                    boxShadow: isLoading ? 'none' : '0 2px 4px rgba(155,89,182,0.3)'
                                }}
                                onMouseOver={(e) => {
                                    if (!isLoading) {
                                        e.target.style.transform = 'translateY(-1px)';
                                        e.target.style.boxShadow = '0 4px 8px rgba(155,89,182,0.4)';
                                    }
                                }}
                                onMouseOut={(e) => {
                                    if (!isLoading) {
                                        e.target.style.transform = 'translateY(0)';
                                        e.target.style.boxShadow = '0 2px 4px rgba(155,89,182,0.3)';
                                    }
                                }}
                            >
                                {isLoading ? '⏳ Procesando...' : '🔄 Retornar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de CabGuias */}
            {showCabGuiasModal && (
                <div 
                    style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                        backdropFilter: 'blur(5px)'
                    }}
                >
                    <div 
                        style={{
                            backgroundColor: 'white', 
                            padding: isMobile ? '20px' : '30px', 
                            borderRadius: '16px',
                            width: isMobile ? '95%' : '90%', 
                            maxWidth: '1200px',
                            maxHeight: isMobile ? '90%' : '85%', 
                            overflowY: 'auto',
                            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                            border: '1px solid #e0e0e0',
                            position: 'relative'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '25px',
                            borderBottom: '3px solid #9b59b6',
                            paddingBottom: '15px'
                        }}>
                            <h3 style={{ 
                                color: '#2c3e50',
                                fontSize: isMobile ? '20px' : '24px',
                                fontWeight: '600',
                                margin: '0',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px'
                            }}>
                                📋 Cabeceras de Guías (DoccabGuia)
                            </h3>
                            <button 
                                onClick={() => setShowCabGuiasModal(false)}
                                style={{
                                    backgroundColor: '#e74c3c',
                                    color: 'white',
                                    border: 'none',
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    cursor: 'pointer',
                                    fontSize: '16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.3s ease'
                                }}
                                onMouseOver={(e) => e.target.style.backgroundColor = '#c0392b'}
                                onMouseOut={(e) => e.target.style.backgroundColor = '#e74c3c'}
                            >
                                ✕
                            </button>
                        </div>

                        {/* Sección de Último Número */}
                        <div style={{
                            backgroundColor: '#f8f9fa',
                            padding: '20px',
                            borderRadius: '12px',
                            marginBottom: '25px',
                            border: '2px solid #e9ecef'
                        }}>
                            <h4 style={{
                                color: '#2c3e50',
                                fontSize: '18px',
                                fontWeight: '600',
                                margin: '0 0 15px 0',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                🔢 Último Número de Cabecera de Guía
                            </h4>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '15px',
                                flexWrap: 'wrap'
                            }}>
                                <div style={{ flex: '1', minWidth: '200px' }}>
                                    {editandoNumero ? (
                                        <input
                                            type="text"
                                            value={nuevoNumero}
                                            onChange={(e) => setNuevoNumero(e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '10px',
                                                border: '2px solid #9b59b6',
                                                borderRadius: '8px',
                                                fontSize: '14px',
                                                fontWeight: '600'
                                            }}
                                            placeholder="Ej: T002-000703"
                                        />
                                    ) : (
                                        <div style={{
                                            padding: '10px',
                                            backgroundColor: 'white',
                                            border: '2px solid #e0e0e0',
                                            borderRadius: '8px',
                                            fontSize: '14px',
                                            fontWeight: '600',
                                            color: '#2c3e50'
                                        }}>
                                            {ultimoNumeroCabGuia || 'No disponible'}
                                        </div>
                                    )}
                                </div>
                                <div style={{
                                    display: 'flex',
                                    gap: '10px',
                                    flexWrap: 'wrap'
                                }}>
                                    {editandoNumero ? (
                                        <>
                                            <button
                                                onClick={handleActualizarUltimoNumero}
                                                style={{
                                                    backgroundColor: '#27ae60',
                                                    color: 'white',
                                                    border: 'none',
                                                    padding: '8px 16px',
                                                    borderRadius: '6px',
                                                    cursor: 'pointer',
                                                    fontWeight: '600',
                                                    fontSize: '12px'
                                                }}
                                            >
                                                ✅ Guardar
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setEditandoNumero(false);
                                                    setNuevoNumero(ultimoNumeroCabGuia);
                                                }}
                                                style={{
                                                    backgroundColor: '#95a5a6',
                                                    color: 'white',
                                                    border: 'none',
                                                    padding: '8px 16px',
                                                    borderRadius: '6px',
                                                    cursor: 'pointer',
                                                    fontWeight: '600',
                                                    fontSize: '12px'
                                                }}
                                            >
                                                ❌ Cancelar
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            onClick={() => setEditandoNumero(true)}
                                            style={{
                                                backgroundColor: '#3498db',
                                                color: 'white',
                                                border: 'none',
                                                padding: '8px 16px',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                fontWeight: '600',
                                                fontSize: '12px'
                                            }}
                                        >
                                            ✏️ Editar
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Tabla de Cabeceras */}
                        <div style={{
                            backgroundColor: 'white',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            border: '2px solid #e9ecef'
                        }}>
                            <div style={{
                                backgroundColor: '#9b59b6',
                                color: 'white',
                                padding: '15px 20px',
                                fontWeight: '600',
                                fontSize: '16px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <span>📊 Lista de Cabeceras de Guías ({cabGuias.length} registros)</span>
                                <button
                                    onClick={cargarCabGuias}
                                    disabled={loadingCabGuias}
                                    style={{
                                        backgroundColor: 'rgba(255,255,255,0.2)',
                                        color: 'white',
                                        border: 'none',
                                        padding: '6px 12px',
                                        borderRadius: '6px',
                                        cursor: loadingCabGuias ? 'not-allowed' : 'pointer',
                                        fontSize: '12px',
                                        fontWeight: '600'
                                    }}
                                >
                                    {loadingCabGuias ? '⏳ Cargando...' : '🔄 Actualizar'}
                                </button>
                            </div>
                            
                            {loadingCabGuias ? (
                                <div style={{
                                    padding: '40px',
                                    textAlign: 'center',
                                    color: '#7f8c8d'
                                }}>
                                    ⏳ Cargando cabeceras de guías...
                                </div>
                            ) : cabGuias.length === 0 ? (
                                <div style={{
                                    padding: '40px',
                                    textAlign: 'center',
                                    color: '#7f8c8d'
                                }}>
                                    📭 No se encontraron cabeceras de guías
                                </div>
                            ) : (
                                <div style={{
                                    maxHeight: '325px',
                                    overflowY: 'auto'
                                }}>
                                    <table style={{
                                        width: '100%',
                                        borderCollapse: 'collapse'
                                    }}>
                                        <thead style={{
                                            backgroundColor: '#f8f9fa',
                                            position: 'sticky',
                                            top: 0
                                        }}>
                                            <tr>
                                                <th style={{
                                                    padding: '12px',
                                                    textAlign: 'left',
                                                    borderBottom: '2px solid #e9ecef',
                                                    fontWeight: '600',
                                                    fontSize: '14px',
                                                    color: '#2c3e50'
                                                }}>Número</th>
                                                <th style={{
                                                    padding: '12px',
                                                    textAlign: 'left',
                                                    borderBottom: '2px solid #e9ecef',
                                                    fontWeight: '600',
                                                    fontSize: '14px',
                                                    color: '#2c3e50'
                                                }}>Doc. Venta</th>
                                                <th style={{
                                                    padding: '12px',
                                                    textAlign: 'left',
                                                    borderBottom: '2px solid #e9ecef',
                                                    fontWeight: '600',
                                                    fontSize: '14px',
                                                    color: '#2c3e50'
                                                }}>Fecha</th>
                                                <th style={{
                                                    padding: '12px',
                                                    textAlign: 'left',
                                                    borderBottom: '2px solid #e9ecef',
                                                    fontWeight: '600',
                                                    fontSize: '14px',
                                                    color: '#2c3e50'
                                                }}>Empresa</th>
                                                <th style={{
                                                    padding: '12px',
                                                    textAlign: 'left',
                                                    borderBottom: '2px solid #e9ecef',
                                                    fontWeight: '600',
                                                    fontSize: '14px',
                                                    color: '#2c3e50'
                                                }}>Pto. Llegada</th>
                                                <th style={{
                                                    padding: '12px',
                                                    textAlign: 'center',
                                                    borderBottom: '2px solid #e9ecef',
                                                    fontWeight: '600',
                                                    fontSize: '14px',
                                                    color: '#2c3e50'
                                                }}>Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {cabGuias.map((guia, index) => (
                                                <tr key={index} style={{
                                                    backgroundColor: index % 2 === 0 ? 'white' : '#f8f9fa',
                                                    borderBottom: '1px solid #e9ecef'
                                                }}>
                                                    <td style={{
                                                        padding: '12px',
                                                        fontWeight: '600',
                                                        color: '#2c3e50',
                                                        fontSize: '14px'
                                                    }}>
                                                        {guia.Numero}
                                                    </td>
                                                    <td style={{
                                                        padding: '12px',
                                                        color: '#7f8c8d',
                                                        fontSize: '14px'
                                                    }}>
                                                        {guia.Docventa || 'N/A'}
                                                    </td>
                                                    <td style={{
                                                        padding: '12px',
                                                        color: '#7f8c8d',
                                                        fontSize: '14px'
                                                    }}>
                                                        {formatFechaDisplay(guia.Fecha)}
                                                    </td>
                                                    <td style={{
                                                        padding: '12px',
                                                        color: '#2c3e50',
                                                        fontSize: '14px'
                                                    }}>
                                                        {guia.Empresa || 'N/A'}
                                                    </td>
                                                    <td style={{
                                                        padding: '12px',
                                                        color: '#7f8c8d',
                                                        fontSize: '14px'
                                                    }}>
                                                        {guia.PtoLLegada || 'N/A'}
                                                    </td>
                                                    <td style={{
                                                        padding: '12px',
                                                        textAlign: 'center'
                                                    }}>
                                                        <button
                                                            onClick={() => handleEliminarCabGuia(guia.Numero)}
                                                            style={{
                                                                backgroundColor: '#e74c3c',
                                                                color: 'white',
                                                                border: 'none',
                                                                padding: '6px 12px',
                                                                borderRadius: '6px',
                                                                cursor: 'pointer',
                                                                fontSize: '12px',
                                                                fontWeight: '600',
                                                                transition: 'all 0.3s ease'
                                                            }}
                                                            onMouseOver={(e) => e.target.style.backgroundColor = '#c0392b'}
                                                            onMouseOut={(e) => e.target.style.backgroundColor = '#e74c3c'}
                                                        >
                                                            🗑️ Eliminar
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Productos - Minimalista */}
            {showProductosModal && (
                <div 
                    style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', zIndex: 1000
                    }}
                >
                    <div 
                        style={{
                            backgroundColor: 'white', 
                            padding: '10px', 
                            borderRadius: '8px',
                            width: isMobile ? '95%' : '85%', 
                            maxWidth: '1200px',
                            height: isMobile ? '90vh' : '80vh',
                            display: 'flex',
                            flexDirection: 'column',
                            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                            border: '1px solid #ddd',
                            position: 'relative',
                            zIndex: 1000
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header Minimalista */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '15px',
                            borderBottom: '2px solid #ff9800',
                            paddingBottom: '10px',
                            flexShrink: 0
                        }}>
                            <h3 style={{ 
                                color: '#333',
                                fontSize: '18px',
                                fontWeight: '600',
                                margin: '0'
                            }}>
                                Productos por Laboratorio
                            </h3>
                            <button 
                                onClick={() => setShowProductosModal(false)}
                                style={{
                                    backgroundColor: '#e74c3c',
                                    color: 'white',
                                    border: 'none',
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '50%',
                                    cursor: 'pointer',
                                    fontSize: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                ✕
                            </button>
                        </div>

                        {/* Controles Compactos */}
                        <div style={{
                            display: 'flex',
                            gap: '15px',
                            marginBottom: '15px',
                            flexWrap: 'wrap',
                            flexShrink: 0
                        }}>
                            {/* Selector de Laboratorio con Autocompletado */}
                            <div style={{ flex: '1', minWidth: '200px', position: 'relative', zIndex: 9998 }} className="laboratorio-dropdown-container">
                                <label style={{
                                    display: 'block',
                                    fontSize: '12px',
                                    color: '#666',
                                    marginBottom: '5px',
                                    fontWeight: '500'
                                }}>
                                    Laboratorio
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <input 
                                        type="text"
                                        value={laboratorioSearchTerm}
                                        onChange={(e) => handleLaboratorioSearch(e.target.value)}
                                        onClick={handleLaboratorioInputClick}
                                        placeholder="Buscar por código o descripción..."
                                        disabled={loadingProductos}
                                        style={{
                                            width: '100%',
                                            padding: '8px 12px',
                                            border: '1px solid #ddd',
                                            borderRadius: '4px',
                                            fontSize: '14px',
                                            backgroundColor: loadingProductos ? '#f5f5f5' : 'white',
                                            cursor: 'text'
                                        }}
                                    />
                                    
                                    {/* Dropdown de Laboratorios */}
                                    {showLaboratorioDropdown && filteredLaboratorios.length > 0 && (
                                        <div style={{
                                            position: 'absolute',
                                            top: '100%',
                                            left: 0,
                                            right: 0,
                                            backgroundColor: 'white',
                                            border: '1px solid #ddd',
                                            borderRadius: '4px',
                                            maxHeight: '200px',
                                            overflowY: 'auto',
                                            zIndex: 9999,
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                            marginTop: '2px'
                                        }}>
                                            {filteredLaboratorios.map((lab, index) => (
                                                <div
                                                    key={index}
                                                    onClick={() => handleSelectLaboratorio(lab)}
                                                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f0f8ff'}
                                                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
                                                    style={{
                                                        padding: '10px 12px',
                                                        cursor: 'pointer',
                                                        borderBottom: '1px solid #eee',
                                                        fontSize: '13px',
                                                        transition: 'background-color 0.2s ease'
                                                    }}
                                                >
                                                    <div style={{ fontWeight: '600', color: '#333', marginBottom: '2px' }}>
                                                        {lab.codlab}
                                                    </div>
                                                    <div style={{ color: '#666', fontSize: '12px' }}>
                                                        {lab.Descripcion}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Búsqueda de Productos */}
                            {selectedLaboratorioProductos && productosPorLaboratorio.length > 0 && (
                                <div style={{ flex: '1', minWidth: '200px' }}>
                                    <label style={{
                                        display: 'block',
                                        fontSize: '12px',
                                        color: '#666',
                                        marginBottom: '5px',
                                        fontWeight: '500'
                                    }}>
                                        Buscar
                                    </label>
                                    <input 
                                        type="text"
                                        value={productosSearchTerm}
                                        onChange={(e) => handleProductosSearch(e.target.value)}
                                        placeholder="Código, nombre o lote..."
                                        style={{
                                            width: '100%',
                                            padding: '8px 12px',
                                            border: '1px solid #ddd',
                                            borderRadius: '4px',
                                            fontSize: '14px'
                                        }}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Lista de Productos Compacta */}
                        {selectedLaboratorioProductos && productosPorLaboratorio.length > 0 && (
                            <div style={{
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                overflow: 'hidden',
                                flex: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                minHeight: 0
                            }}>
                                <div style={{
                                    backgroundColor: '#ff9800',
                                    color: 'white',
                                    padding: '10px 15px',
                                    fontWeight: '600',
                                    fontSize: '14px',
                                    flexShrink: 0
                                }}>
                                    Productos ({filteredProductosModal.length})
                                </div>
                                
                                {loadingProductos ? (
                                    <div style={{
                                        flex: 1,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#666',
                                        fontSize: '14px'
                                    }}>
                                        Cargando productos...
                                    </div>
                                ) : filteredProductosModal.length === 0 ? (
                                    <div style={{
                                        flex: 1,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#666',
                                        fontSize: '14px',
                                        backgroundColor: '#f9f9f9'
                                    }}>
                                        No se encontraron productos
                                    </div>
                                ) : (
                                    <div style={{
                                        flex: 1,
                                        overflowY: 'auto',
                                        minHeight: 0
                                    }}>
                                        <div style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '8px'
                                        }}>
                                            {filteredProductosModal.map((producto, index) => (
                                                <div key={index} style={{
                                                    backgroundColor: index % 2 === 0 ? 'white' : '#f9f9f9',
                                                    border: '1px solid #eee',
                                                    borderRadius: '6px',
                                                    padding: '12px',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s ease'
                                                }}
                                                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f0f8ff'}
                                                onMouseOut={(e) => e.currentTarget.style.backgroundColor = index % 2 === 0 ? 'white' : '#f9f9f9'}
                                                >
                                                    {/* Primer renglón: Nombre completo */}
                                                    <div style={{
                                                        fontSize: '13px',
                                                        fontWeight: '600',
                                                        color: '#333',
                                                        marginBottom: '6px',
                                                        lineHeight: '1.3'
                                                    }}>
                                                        {producto.nombre}
                                                    </div>
                                                    
                                                    {/* Segundo renglón: Detalles */}
                                                    <div style={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        fontSize: '11px',
                                                        color: '#666',
                                                        flexWrap: 'wrap',
                                                        gap: '8px'
                                                    }}>
                                                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                                            <span style={{ fontWeight: '600', color: '#333' }}>
                                                                Código: {producto.codpro}
                                                            </span>
                                                            <span>
                                                                Lote: {producto.lote || '-'}
                                                            </span>
                                                            <span style={{ fontWeight: '600', color: '#ff6b35' }}>
                                                                Unidades: {producto.unidades}
                                                            </span>
                                                        </div>
                                                        
                                                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                                            <span>
                                                                Venc: {producto.vencimiento ? formatFechaDisplay(producto.vencimiento) : '-'}
                                                            </span>
                                                            <span>
                                                                Fecha: {producto.Fecha ? formatFechaDisplay(producto.Fecha) : '-'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default DevolucionCanjeForm; 