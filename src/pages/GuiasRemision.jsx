import React, { useState, useEffect } from 'react';
import axiosClient from '../services/axiosClient';
import Card from '../components/Card';
import Button from '../components/Button';
import {
    FunnelIcon,
    EyeIcon,
    PaperAirplaneIcon,
    DocumentTextIcon,
    CloudIcon,
    XMarkIcon,
    CheckCircleIcon,
    InformationCircleIcon,
    XCircleIcon
} from '@heroicons/react/24/outline';

const GuiasRemision = () => {
    const [guias, setGuias] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filtros, setFiltros] = useState({
        doc_electronico: '',
        procesado: ''
    });

    // Modals
    const [showModal, setShowModal] = useState(false);
    const [guiaSeleccionada, setGuiaSeleccionada] = useState(null);
    const [cargandoDetalle, setCargandoDetalle] = useState(false);

    const [enviandoGuia, setEnviandoGuia] = useState(null); // Doc_electronico being sent

    // Respuesta Nubefact Modal
    const [showRespuestaModal, setShowRespuestaModal] = useState(false);
    const [respuestaNubefact, setRespuestaNubefact] = useState(null);

    // Consulta Manual State
    const [showModalManual, setShowModalManual] = useState(false);
    const [manualData, setManualData] = useState({ serie: '', numero: '' });

    // Envío Masivo State
    const [isMassProcessing, setIsMassProcessing] = useState(false);
    const [massProgress, setMassProgress] = useState({ current: 0, total: 0, successes: 0, errors: 0 });
    const [massResults, setMassResults] = useState([]);
    const [showMassModal, setShowMassModal] = useState(false);

    // Selección
    const [selectedDocs, setSelectedDocs] = useState([]);

    const toggleSelectAll = (e) => {
        if (e.target.checked) {
            const pendingDocs = guias.filter(g => g.Procesado !== 1 && g.Procesado !== '1').map(g => g.Doc_electronico);
            setSelectedDocs(pendingDocs);
        } else {
            setSelectedDocs([]);
        }
    };

    const toggleSelectOne = (docId) => {
        if (selectedDocs.includes(docId)) {
            setSelectedDocs(selectedDocs.filter(id => id !== docId));
        } else {
            setSelectedDocs([...selectedDocs, docId]);
        }
    };

    const handleEnviarMasivo = async () => {
        // 1. Filtrar pendientes (Seleccionados O Todos los pendientes)
        const pendientes = selectedDocs.length > 0
            ? guias.filter(g => selectedDocs.includes(g.Doc_electronico))
            : guias.filter(g => g.Procesado !== 1 && g.Procesado !== '1');

        if (pendientes.length === 0) {
            alert('No hay guías pendientes de envío.');
            return;
        }

        const msg = selectedDocs.length > 0
            ? `¿Deseas enviar las ${pendientes.length} guías seleccionadas a Nubefact?`
            : `Se encontraron ${pendientes.length} guías pendientes. ¿Deseas enviarlas masivamente a Nubefact?`;

        if (!window.confirm(msg)) {
            return;
        }

        // 2. Iniciar proceso
        setIsMassProcessing(true);
        setShowMassModal(true);
        setMassProgress({ current: 0, total: pendientes.length, successes: 0, errors: 0 });
        setMassResults([]);

        let successes = 0;
        let errors = 0;
        const results = [];

        // 3. Loop
        for (let i = 0; i < pendientes.length; i++) {
            const doc = pendientes[i];
            setMassProgress(prev => ({ ...prev, current: i + 1 }));

            try {
                const docLimpio = doc.Doc_electronico.trim();
                const response = await axiosClient.post(`/guias-remision/${encodeURIComponent(docLimpio)}/enviar`);
                const data = response.data;

                if (data.success) {
                    const nubefactData = data.data || {};
                    const sunatDesc = nubefactData.sunat_description || 'Enviado correctamente';

                    successes++;
                    results.push({
                        doc: docLimpio,
                        status: 'success',
                        message: sunatDesc
                    });

                    setGuias(prev => prev.map(g => g.Doc_electronico === doc.Doc_electronico ? { ...g, Procesado: 1 } : g));
                } else {
                    errors++;
                    const errorMsg = data.error || data.details || 'Error desconocido';
                    results.push({
                        doc: docLimpio,
                        status: 'error',
                        message: typeof errorMsg === 'object' ? JSON.stringify(errorMsg) : errorMsg
                    });
                }

            } catch (error) {
                errors++;
                const errMsg = error.response?.data?.error || error.response?.data?.details || error.message;
                results.push({ doc: doc.Doc_electronico, status: 'error', message: typeof errMsg === 'object' ? JSON.stringify(errMsg) : errMsg });
            }

            setMassProgress(prev => ({ ...prev, successes, errors }));
            setMassResults([...results]);

            await new Promise(r => setTimeout(r, 200));
        }

        setIsMassProcessing(false);
        if (selectedDocs.length > 0) setSelectedDocs([]);
        cargarGuias();
    };

    const handleConsultaManual = async (e) => {
        e.preventDefault();
        setLoading(true); // Reuse loading or custom? Custom better to not block table.
        // Actually reuse setEnviandoGuia for spinner logic in modal button
        const loadingKey = 'manual-consult';
        setEnviandoGuia(loadingKey);

        try {
            const payload = {
                ...manualData,
                serie: manualData.serie.trim(),
                numero: manualData.numero.toString().trim()
            };
            const response = await axiosClient.post('/guias-remision/consultar-manual', payload);
            const data = response.data.data;

            // Close manual modal
            setShowModalManual(false);

            // Show result modal
            setRespuestaNubefact({
                ...data,
                doc_electronico: `${manualData.serie}-${manualData.numero}`,
                error: !!data.errors
            });
            setShowRespuestaModal(true);

        } catch (error) {
            console.error('Error consulta manual:', error);
            alert('Error al consultar');
        } finally {
            setEnviandoGuia(null);
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarGuias();
    }, []);

    const cargarGuias = async () => {
        setLoading(true);
        try {
            // Build query params
            const params = new URLSearchParams();
            if (filtros.doc_electronico) params.append('doc_electronico', filtros.doc_electronico);
            if (filtros.procesado) params.append('procesado', filtros.procesado);

            const response = await axiosClient.get(`/guias-remision?${params.toString()}`);
            setGuias(response.data.data);
        } catch (error) {
            console.error('Error cargando guías:', error);
            alert('Error al cargar guías');
        } finally {
            setLoading(false);
        }
    };

    const limpiarFiltros = () => {
        setFiltros({ doc_electronico: '', procesado: '' });
        // Trigger reload separately or let user click search? 
        // Usually cleaner to just reset state. User clicks Search.
    };

    const verDetalle = async (doc_electronico) => {
        try {
            setCargandoDetalle(true);
            const response = await axiosClient.get(`/guias-remision/${doc_electronico}`);
            setGuiaSeleccionada(response.data);
            setShowModal(true);
        } catch (error) {
            console.error('Error cargando detalle:', error);
            alert('Error al cargar el detalle de la guía');
        } finally {
            setCargandoDetalle(false);
        }
    };

    const enviarNubefact = async (doc_electronico) => {
        if (!window.confirm(`¿Estás seguro de enviar la Guía ${doc_electronico} a Nubefact?`)) return;

        setEnviandoGuia(doc_electronico);
        try {
            const response = await axiosClient.post(`/guias-remision/${doc_electronico}/enviar`);

            const respuesta = response.data.nubefactResponse || response.data;
            setRespuestaNubefact({
                ...respuesta,
                doc_electronico: doc_electronico,
                error: !!respuesta.errors // Flag for UI
            });
            setShowRespuestaModal(true);
            cargarGuias(); // Refresh list to show green state

        } catch (error) {
            console.error('Error al enviar:', error);
            const errorData = error.response?.data?.details || error.response?.data || { error: error.message };
            setRespuestaNubefact({
                error: true,
                errors: errorData,
                doc_electronico: doc_electronico
            });
            setShowRespuestaModal(true);
        } finally {
            setEnviandoGuia(null);
        }
    };

    const consultarNubefact = async (doc_electronico) => {
        setEnviandoGuia(`consultando-${doc_electronico}`); // Hack to show spinner
        try {
            const response = await axiosClient.post(`/guias-remision/${doc_electronico}/consultar`);

            const data = response.data.data;
            // Check if "not found" logic applies (similar to invoices)
            const isNotFound = data.codigo === 20 || (data.errors && data.errors.includes('no existe'));

            setRespuestaNubefact({
                ...data,
                doc_electronico: doc_electronico,
                error: !!data.errors,
                notFound: isNotFound
            });
            setShowRespuestaModal(true);

        } catch (error) {
            console.error('Error consultando:', error);
            alert('Error al consultar estado');
        } finally {
            setEnviandoGuia(null);
        }
    };

    // Helper formats
    const formatearFecha = (fecha) => {
        if (!fecha) return { fecha: '-', hora: '' };
        const date = new Date(fecha);
        return {
            fecha: date.toLocaleDateString('es-PE'),
            hora: date.toLocaleTimeString('es-PE')
        };
    };

    const Modal = ({ isOpen, onClose, title, children, size = "4xl" }) => {
        if (!isOpen) return null;
        return (
            <div className="fixed inset-0 z-50 overflow-y-auto">
                <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                    <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                        <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={onClose}></div>
                    </div>
                    <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                    <div className={`inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:w-full max-w-${size === '6xl' ? '6xl' : size === '7xl' ? '7xl' : '4xl'}`}>
                        <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg leading-6 font-medium text-gray-900">{title}</h3>
                                <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                                    <XMarkIcon className="h-6 w-6" />
                                </button>
                            </div>
                            <div className="mt-2">{children}</div>
                        </div>
                        <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                            <Button onClick={onClose} variant="secondary">Cerrar</Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="container mx-auto">
            {/* Filtros */}
            <Card className="mb-4">
                <div className="p-4 flex flex-col md:flex-row items-center gap-4">
                    {/* Input Documento */}
                    <input
                        type="text"
                        value={filtros.doc_electronico}
                        onChange={(e) => setFiltros({ ...filtros, doc_electronico: e.target.value })}
                        placeholder="Buscar por Doc. Electrónico (T001-...) "
                        className="w-full md:flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    <select
                        value={filtros.procesado}
                        onChange={(e) => setFiltros({ ...filtros, procesado: e.target.value })}
                        className="w-full md:w-40 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Todos</option>
                        <option value="0">Pendiente</option>
                        <option value="1">Procesado</option>
                    </select>

                    <div className="flex items-center gap-2">
                        <Button onClick={cargarGuias} disabled={loading} variant="primary" className="text-sm whitespace-nowrap">
                            {loading ? '...' : 'Buscar'}
                        </Button>
                        <Button onClick={limpiarFiltros} variant="secondary" className="text-sm whitespace-nowrap">
                            Limpiar
                        </Button>
                        <Button
                            onClick={handleEnviarMasivo}
                            className={`text-sm whitespace-nowrap ${selectedDocs.length > 0 || guias.filter(g => g.Procesado !== 1 && g.Procesado !== '1').length > 0
                                ? "bg-green-600 text-white hover:bg-green-700"
                                : "bg-gray-300 text-gray-500 cursor-not-allowed"
                                }`}
                            disabled={isMassProcessing || (selectedDocs.length === 0 && guias.filter(g => g.Procesado !== 1 && g.Procesado !== '1').length === 0)}
                        >
                            {isMassProcessing ? (
                                <>
                                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1 inline-block"></div>
                                    Enviando...
                                </>
                            ) : selectedDocs.length > 0 ? (
                                <>
                                    <PaperAirplaneIcon className="w-4 h-4 mr-1 inline-block" />
                                    Enviar Seleccionados ({selectedDocs.length})
                                </>
                            ) : (
                                <>
                                    <PaperAirplaneIcon className="w-4 h-4 mr-1 inline-block" />
                                    Enviar Todos Pendientes ({guias.filter(g => g.Procesado !== 1 && g.Procesado !== '1').length})
                                </>
                            )}
                        </Button>

                        <Button
                            onClick={() => setShowModalManual(true)}
                            className="bg-purple-600 text-white hover:bg-purple-700 text-sm whitespace-nowrap"
                        >
                            <CloudIcon className="w-4 h-4 mr-1 inline-block" />
                            Consultar Estado
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Tabla */}
            <Card>
                <div className="px-4 py-3 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Guías de Remisión ({guias.length})</h2>
                </div>

                {loading ? (
                    <div className="p-8 text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : guias.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">No hay guías encontradas</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-3 py-3 text-center w-8">
                                        <input
                                            type="checkbox"
                                            className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 cursor-pointer"
                                            onChange={toggleSelectAll}
                                            checked={guias.some(g => g.Procesado !== 1 && g.Procesado !== '1') && selectedDocs.length === guias.filter(g => g.Procesado !== 1 && g.Procesado !== '1').length}
                                        />
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Guía / Estado</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Emisión</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Traslado</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Peso Total</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {guias.map((guia) => (
                                    <tr key={guia.Doc_electronico} className="hover:bg-gray-50">
                                        <td className="px-3 py-4 w-8 text-center">
                                            {(guia.Procesado !== 1 && guia.Procesado !== '1') && (
                                                <input
                                                    type="checkbox"
                                                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 cursor-pointer"
                                                    checked={selectedDocs.includes(guia.Doc_electronico)}
                                                    onChange={() => toggleSelectOne(guia.Doc_electronico)}
                                                />
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{guia.Doc_electronico}</div>
                                            <div className="mt-1">
                                                {(guia.Procesado === 1 || guia.Procesado === '1') ? (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                                        Procesado
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                                        Pendiente
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatearFecha(guia.FechaEmision).fecha}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <div>{guia.CodTraslado} - {guia.Descripcion?.substring(0, 20)}...</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {guia.PesoBruto} KG
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                            <div className="flex justify-center gap-2">
                                                <Button size="xs" variant="secondary" onClick={() => verDetalle(guia.Doc_electronico)}>
                                                    <EyeIcon className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    size="xs"
                                                    variant="primary"
                                                    onClick={() => enviarNubefact(guia.Doc_electronico)}
                                                    disabled={guia.Procesado === 1 || enviandoGuia === guia.Doc_electronico}
                                                >
                                                    {enviandoGuia === guia.Doc_electronico ? (
                                                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                                                    ) : (
                                                        <PaperAirplaneIcon className="w-4 h-4" />
                                                    )}
                                                </Button>

                                                {/* Botón Consultar siempre visible */}
                                                <Button
                                                    size="xs"
                                                    className="bg-purple-100 text-purple-700 hover:bg-purple-200 border-purple-200"
                                                    onClick={() => consultarNubefact(guia.Doc_electronico)}
                                                    title="Consultar Estado Nubefact"
                                                    disabled={enviandoGuia === `consultando-${guia.Doc_electronico}`}
                                                >
                                                    {enviandoGuia === `consultando-${guia.Doc_electronico}` ? (
                                                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-purple-700 inline-block"></div>
                                                    ) : <CloudIcon className="w-3 h-3" />}
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {/* Modal Detalle */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={`Detalle Guía ${guiaSeleccionada?.cabecera?.Doc_electronico}`}
                size="6xl"
            >
                {guiaSeleccionada && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* General Info */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="font-medium text-gray-700 mb-2">Información de Traslado</h3>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div><strong>Motivo:</strong> {guiaSeleccionada.cabecera.CodTraslado}</div>
                                    <div><strong>Modalidad:</strong> {guiaSeleccionada.cabecera.Modalidad}</div>
                                    <div><strong>Fecha Traslado:</strong> {formatearFecha(guiaSeleccionada.cabecera.Fecha).fecha}</div>
                                    <div><strong>Peso Bruto:</strong> {guiaSeleccionada.cabecera.PesoBruto} KG</div>
                                    <div className="col-span-2"><strong>Descripción:</strong> {guiaSeleccionada.cabecera.Descripcion}</div>
                                </div>
                            </div>

                            {/* Transportista Info */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="font-medium text-gray-700 mb-2">Transportista / Vehículo</h3>
                                <div className="space-y-1 text-sm">
                                    <div><strong>RUC:</strong> {guiaSeleccionada.cabecera.RucTransportista}</div>
                                    <div><strong>Razón Social:</strong> {guiaSeleccionada.cabecera.RazonTranspostista}</div>
                                    <div><strong>Placa:</strong> {guiaSeleccionada.cabecera.Placa}</div>
                                    <div><strong>Licencia:</strong> {guiaSeleccionada.cabecera.DocumConductor} ({guiaSeleccionada.cabecera.TipoDocConductor})</div>
                                </div>
                            </div>

                            {/* Cliente Info (Receptor) */}
                            {guiaSeleccionada.receptor && (
                                <div className="bg-gray-50 p-4 rounded-lg md:col-span-2">
                                    <h3 className="font-medium text-gray-700 mb-2">Destinatario (Punto de Llegada)</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <div><strong>Nombre:</strong> {guiaSeleccionada.receptor.NombreLegal}</div>
                                            <div><strong>Doc:</strong> {guiaSeleccionada.receptor.Nrodocumento}</div>
                                            <div><strong>Email:</strong> {guiaSeleccionada.receptor.Email}</div>
                                        </div>
                                        <div>
                                            <div><strong>Dirección:</strong> {guiaSeleccionada.receptor.direccion}</div>
                                            <div><strong>Ubigeo:</strong> {guiaSeleccionada.receptor.Ubigeo}</div>
                                            <div><strong>Departamento/Prov:</strong> {guiaSeleccionada.receptor.dpto} / {guiaSeleccionada.receptor.Provincia}</div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Items Table */}
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 mb-3">Items ({guiaSeleccionada.detalles?.length})</h3>
                            <div className="overflow-hidden border border-gray-200 rounded-lg">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Cant</th>
                                            <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">U.M.</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white">
                                        {guiaSeleccionada.detalles?.map((item, idx) => (
                                            <tr key={idx}>
                                                <td className="px-4 py-2 text-sm text-gray-900">{item.CodItem}</td>
                                                <td className="px-4 py-2 text-sm text-gray-900">{item.descripcion}</td>
                                                <td className="px-4 py-2 text-sm text-gray-900 text-right">{item.cantidad}</td>
                                                <td className="px-4 py-2 text-sm text-gray-900 text-center">{item.UnidadMedida}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Modal Respuesta Nubefact */}
            <Modal
                isOpen={showRespuestaModal}
                onClose={() => setShowRespuestaModal(false)}
                title="Respuesta de Nubefact"
                size="3xl"
            >
                {respuestaNubefact && (
                    <div className="space-y-4">
                        <div className={`p-4 rounded-lg ${respuestaNubefact.error ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
                            <div className="flex items-center gap-3">
                                {respuestaNubefact.error ? <XCircleIcon className="w-8 h-8 text-red-500" /> : <CheckCircleIcon className="w-8 h-8 text-green-500" />}
                                <div>
                                    <h3 className={`text-lg font-semibold ${respuestaNubefact.error ? 'text-red-700' : 'text-green-700'}`}>
                                        {respuestaNubefact.error ? 'Error al Procesar/Consultar' : 'Guía Generada Exitosamente'}
                                    </h3>
                                    <p className="text-sm text-gray-600">Documento: {respuestaNubefact.doc_electronico}</p>
                                </div>
                            </div>
                        </div>

                        {/* Nota Importante (GRE) */}
                        {respuestaNubefact.nota_importante && (
                            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <InformationCircleIcon className="h-5 w-5 text-yellow-400" aria-hidden="true" />
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm text-yellow-700">
                                            {respuestaNubefact.nota_importante}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Detalles o Errores */}
                        {!respuestaNubefact.error && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h4 className="font-medium text-gray-700 mb-2">Datos SUNAT</h4>
                                    <div className="text-sm space-y-1">
                                        <div><strong>Serie/Num:</strong> {respuestaNubefact.serie}-{respuestaNubefact.numero}</div>
                                        <div><strong>Enlace:</strong> <a href={respuestaNubefact.enlace} target="_blank" rel="noreferrer" className="text-blue-600 underline">Abrir PDF</a></div>
                                        <div><strong>Aceptada:</strong> {respuestaNubefact.aceptada_por_sunat ? 'SÍ' : 'NO/Pendiente'}</div>
                                    </div>
                                </div>
                                {/* Enlaces */}
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <div className="flex flex-wrap gap-2">
                                        {respuestaNubefact.enlace_del_pdf && (
                                            <a href={respuestaNubefact.enlace_del_pdf} target="_blank" className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700">PDF</a>
                                        )}
                                        {respuestaNubefact.enlace_del_xml && (
                                            <a href={respuestaNubefact.enlace_del_xml} target="_blank" className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700">XML</a>
                                        )}
                                        {respuestaNubefact.enlace_del_cdr && (
                                            <a href={respuestaNubefact.enlace_del_cdr} target="_blank" className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700">CDR</a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {respuestaNubefact.error && (
                            <div className="bg-red-50 p-4 rounded-lg">
                                <pre className="text-xs text-red-600 overflow-x-auto whitespace-pre-wrap">
                                    {JSON.stringify(respuestaNubefact.errors || respuestaNubefact, null, 2)}
                                </pre>
                            </div>
                        )}
                    </div>
                )}
            </Modal>

            {/* Modal Consulta Manual */}
            <Modal
                isOpen={showModalManual}
                onClose={() => setShowModalManual(false)}
                title="Consultar Guía en SUNAT"
                size="md"
            >
                <form onSubmit={handleConsultaManual} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Serie</label>
                        <input
                            type="text"
                            required
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-purple-500 focus:border-purple-500"
                            value={manualData.serie}
                            onChange={e => setManualData({ ...manualData, serie: e.target.value.toUpperCase() })}
                            placeholder="Ej: T001"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Número</label>
                        <input
                            type="number"
                            required
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-purple-500 focus:border-purple-500"
                            value={manualData.numero}
                            onChange={e => setManualData({ ...manualData, numero: e.target.value })}
                            placeholder="Ej: 123"
                        />
                    </div>
                    <div className="flex justify-end pt-2">
                        <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white" disabled={enviandoGuia === 'manual-consult'}>
                            {enviandoGuia === 'manual-consult' ? 'Consultando...' : 'Consultar'}
                        </Button>
                    </div>
                </form>
            </Modal>



            {/* Modal Progreso Masivo */}
            <Modal
                isOpen={showMassModal}
                onClose={() => !isMassProcessing && setShowMassModal(false)}
                title={isMassProcessing ? "Enviando Guías..." : "Proceso Completado"}
                size="lg"
            >
                <div className="space-y-3">
                    {/* Barra de progreso - Arriba */}
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-gray-700">
                                {massProgress.current} / {massProgress.total} guías
                            </span>
                            <div className="flex items-center gap-3 text-xs">
                                <span className="flex items-center gap-1 text-green-700">
                                    <CheckCircleIcon className="w-4 h-4" />
                                    {massProgress.successes} exitosos
                                </span>
                                <span className="flex items-center gap-1 text-red-700">
                                    <XCircleIcon className="w-4 h-4" />
                                    {massProgress.errors} errores
                                </span>
                            </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${(massProgress.current / massProgress.total || 0) * 100}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* Lista de Resultados - Compacta */}
                    <div className="bg-white rounded-lg border border-gray-200 max-h-80 overflow-y-auto">
                        {massResults.length === 0 ? (
                            <div className="p-4 text-center text-gray-400 text-sm">Iniciando envío...</div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {massResults.map((res, index) => (
                                    <div
                                        key={index}
                                        className={`p-2.5 hover:bg-gray-50 transition-colors ${res.status === 'success' ? 'bg-green-50/30' : 'bg-red-50/30'
                                            }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            {res.status === 'success' ? (
                                                <CheckCircleIcon className="w-4 h-4 text-green-600 flex-shrink-0" />
                                            ) : (
                                                <XCircleIcon className="w-4 h-4 text-red-600 flex-shrink-0" />
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-baseline gap-2">
                                                    <span className={`font-mono text-xs font-semibold ${res.status === 'success' ? 'text-green-900' : 'text-red-900'
                                                        }`}>
                                                        {res.doc}
                                                    </span>
                                                    <span className={`text-xs truncate ${res.status === 'success' ? 'text-green-700' : 'text-red-700'
                                                        }`}>
                                                        {res.message}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {!isMassProcessing && (
                        <div className="flex justify-end pt-2">
                            <Button onClick={() => setShowMassModal(false)} variant="primary">
                                Cerrar
                            </Button>
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
};

export default GuiasRemision;
