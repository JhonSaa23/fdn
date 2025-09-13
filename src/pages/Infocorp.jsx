import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { obtenerClientesInfocorp, subirReporteInfocorp, obtenerUrlReporte } from '../services/infocorpApi';
import axiosClient from '../services/axiosClient';
import { DocumentTextIcon, ArrowDownTrayIcon, ArrowUpTrayIcon, EyeIcon, XMarkIcon, HomeIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import Modal from '../components/Modal';
import { useNotification } from '../App';

const Infocorp = () => {
  const { showNotification } = useNotification();
  
  // Estados principales
  const [allClientes, setAllClientes] = useState([]); // Todos los clientes cargados
  const [clientes, setClientes] = useState([]); // Clientes visibles en la tabla
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  
  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(100); // Mostrar 100 a la vez
  
  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados para modales
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportUrl, setReportUrl] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [uploading, setUploading] = useState(false);
  
  // Referencias
  const tableContainerRef = useRef(null);


  // Cargar todos los clientes una sola vez
  const cargarClientes = async () => {
    try {
      setLoading(true);
      const response = await obtenerClientesInfocorp({}, 1, 10000); // Cargar TODOS los clientes
      
      setAllClientes(response.data);
      // Mostrar solo los primeros 100
      setClientes(response.data.slice(0, itemsPerPage));
      setCurrentPage(1);
    } catch (error) {
      console.error('Error cargando clientes:', error);
      setError('Error al cargar clientes: ' + error.message);
      showNotification('error', 'Error al cargar clientes');
    } finally {
      setLoading(false);
    }
  };



  // Cargar más clientes cuando se haga scroll
  const cargarMasClientes = useCallback(() => {
    if (loadingMore) return;
    
    setLoadingMore(true);
    
    setTimeout(() => {
      if (searchTerm) {
        // Si hay búsqueda, filtrar sobre todos los clientes y mostrar más
        const allFiltered = allClientes.filter(cliente => {
          const searchLower = searchTerm.toLowerCase();
          return (cliente.razon || '').toLowerCase().includes(searchLower) ||
            (cliente.documento || '').toLowerCase().includes(searchLower) ||
            String(cliente.codclie || '').toLowerCase().includes(searchLower);
        });
        
        const startIndex = currentPage * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const nextBatch = allFiltered.slice(startIndex, endIndex);
        
        if (nextBatch.length > 0) {
          setClientes(prev => [...prev, ...nextBatch]);
          setCurrentPage(prev => prev + 1);
        }
      } else {
        // Si no hay búsqueda, mostrar más de todos los clientes
        const startIndex = currentPage * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const nextBatch = allClientes.slice(startIndex, endIndex);
        
        if (nextBatch.length > 0) {
          setClientes(prev => [...prev, ...nextBatch]);
          setCurrentPage(prev => prev + 1);
        }
      }
      
      setLoadingMore(false);
    }, 300); // Pequeño delay para simular carga
  }, [allClientes, currentPage, itemsPerPage, loadingMore, searchTerm]);

  // Manejar scroll para cargar más
  const handleScroll = useCallback((e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100;
    
    if (isNearBottom && !loadingMore && allClientes.length > clientes.length) {
      cargarMasClientes();
    }
  }, [cargarMasClientes, loadingMore, allClientes.length, clientes.length]);

  // Cargar datos iniciales
  useEffect(() => {
    cargarClientes();
  }, []);

  // Agregar event listener para scroll
  useEffect(() => {
    const container = tableContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  // Manejar búsqueda (filtra sobre TODOS los clientes cargados)
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setCurrentPage(1); // Resetear a la primera página
    
    // Si hay búsqueda, mostrar solo los primeros 100 filtrados
    if (value) {
      const allFiltered = allClientes.filter(cliente => {
        const searchLower = value.toLowerCase();
        return (cliente.razon || '').toLowerCase().includes(searchLower) ||
          (cliente.documento || '').toLowerCase().includes(searchLower) ||
          String(cliente.codclie || '').toLowerCase().includes(searchLower);
      });
      setClientes(allFiltered.slice(0, itemsPerPage));
    } else {
      // Si no hay búsqueda, volver a mostrar los primeros 100
      setClientes(allClientes.slice(0, itemsPerPage));
    }
  };

  // Los clientes ya están filtrados en handleSearch, solo devolver los visibles
  const filteredClientes = clientes;

  // Manejar visualización de reporte
  const handleViewReport = async (cliente) => {
    if (cliente && cliente.rutaReporte && cliente.documento) {
      try {
        // Descargar el PDF como blob con autenticación
        const response = await axiosClient.get(`/infocorp/reporte/${cliente.documento}`, {
          responseType: 'blob'
        });
        
        // Crear URL del blob
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        
        setReportUrl(url);
        setShowReportModal(true);
      } catch (error) {
        console.error('Error obteniendo reporte:', error);
        showNotification('error', 'Error al cargar el reporte: ' + (error.response?.data?.message || error.message));
      }
    } else {
      showNotification('warning', 'No hay reporte disponible para este cliente.');
    }
  };

  // Manejar descarga de reporte
  const handleDownloadReport = async (cliente) => {
    if (cliente && cliente.rutaReporte && cliente.documento) {
      try {
        // Descargar el PDF como blob con autenticación
        const response = await axiosClient.get(`/infocorp/reporte/${cliente.documento}`, {
          responseType: 'blob'
        });
        
        // Crear URL del blob y descargar
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `infocorp-${cliente.documento}.pdf`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Limpiar la URL del blob
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Error descargando reporte:', error);
        showNotification('error', 'Error al descargar el reporte: ' + (error.response?.data?.message || error.message));
      }
    } else {
      showNotification('warning', 'No hay reporte disponible para descargar.');
    }
  };

  // Manejar subida de reporte
  const handleUploadReport = (cliente) => {
    if (cliente && cliente.documento) {
      setSelectedClient(cliente);
      const fileInput = document.getElementById(`file-upload-${cliente.documento}`);
      if (fileInput) {
        fileInput.click();
      }
    }
  };

  // Manejar cambio de archivo
  const handleFileChange = async (event, cliente) => {
    const file = event.target.files[0];
    if (!file || !cliente || !cliente.documento) return;

    if (file.type !== 'application/pdf') {
      showNotification('error', 'Solo se permiten archivos PDF.');
      return;
    }

    setUploading(true);
    try {
      const response = await subirReporteInfocorp(cliente.documento, file);
      
      if (response.success) {
        showNotification('success', response.message);
        // Recargar datos para actualizar el estado del reporte
        cargarClientes(true);
      } else {
        showNotification('error', response.message);
      }
    } catch (err) {
      showNotification('error', 'Error al subir el reporte: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <p className="ml-4 text-gray-600">Cargando clientes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-4 text-red-600">
        <p>Error: {error}</p>
        <button onClick={() => cargarClientes(true)} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-4">
      {/* Barra de búsqueda */}
      <div className="mb-4 ">
        <input
          type="text"
          placeholder="Buscar por Razón Social, Documento o Código de Cliente..."
          className="w-full p-2 border border-gray-300 rounded-md"
          value={searchTerm}
          onChange={handleSearch}
        />
      </div>

      {/* Vista móvil - Tarjetas */}
      <div className="block sm:hidden">
        <div 
          ref={tableContainerRef}
          className="space-y-3 max-h-screen overflow-y-auto"
          style={{ height: 'calc(100vh - 120px)' }}
        >
          {filteredClientes.length === 0 && !loading ? (
            <div className="text-center py-8 text-gray-500">
              {loading ? 'Cargando...' : 'No se encontraron clientes.'}
            </div>
          ) : (
            filteredClientes.map((cliente, index) => (
              <div key={`${cliente.documento}-${cliente.codclie}-${index}`} className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
                {/* Primera fila: Código y Documento */}
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Código: {String(cliente.codclie || 'N/A')}</p>
                    <p className="text-sm text-gray-600">Doc: {cliente.documento || 'N/A'}</p>
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => handleViewReport(cliente)}
                      className={`p-2 rounded-full ${cliente.rutaReporte ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}
                      disabled={!cliente.rutaReporte}
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDownloadReport(cliente)}
                      className={`p-2 rounded-full ${cliente.rutaReporte ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}
                      disabled={!cliente.rutaReporte}
                    >
                      <ArrowDownTrayIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleUploadReport(cliente)}
                      className="p-2 rounded-full bg-purple-100 text-purple-600"
                      disabled={uploading}
                    >
                      {uploading && selectedClient?.documento === cliente.documento ? (
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <ArrowUpTrayIcon className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                
                {/* Segunda fila: Razón Social */}
                <div className="mb-2">
                  <p className="text-sm font-medium text-gray-900">{cliente.razon || 'N/A'}</p>
                </div>
                
                {/* Tercera fila: Dirección y Celular */}
                <div className="mb-2">
                  <p className="text-xs text-gray-600">📍 {cliente.direccion || 'N/A'}</p>
                  <p className="text-xs text-gray-600">📞 {cliente.celular || 'N/A'}</p>
                </div>
                
                {/* Cuarta fila: Estado del reporte */}
                <div className="flex justify-between items-center">
                  {cliente.rutaReporte ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <CheckCircleIcon className="h-3 w-3 mr-1" />
                      Disponible ({cliente.fechaReporte ? new Date(cliente.fechaReporte).toLocaleDateString() : 'N/A'})
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      <XMarkIcon className="h-3 w-3 mr-1" />
                      No disponible
                    </span>
                  )}
                </div>
                
                {/* Input oculto para subir archivos */}
                <input
                  type="file"
                  id={`file-upload-${cliente.documento}`}
                  className="hidden"
                  accept="application/pdf"
                  onChange={(e) => handleFileChange(e, cliente)}
                />
              </div>
            ))
          )}
        </div>
      </div>

      {/* Vista desktop - Tabla */}
      <div className="hidden sm:block">
        <div 
          ref={tableContainerRef}
          className="overflow-x-auto bg-white shadow-md rounded-lg max-h-screen"
          style={{ height: 'calc(100vh - 120px)' }}
        >
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Documento / Código
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Razón Social / Dirección
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Celular
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Reporte Infocorp
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredClientes.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                  {loading ? 'Cargando...' : 'No se encontraron clientes.'}
                </td>
              </tr>
            ) : (
              filteredClientes.map((cliente, index) => (
                <tr key={`${cliente.documento}-${cliente.codclie}-${index}`}>
                  {/* Columna 1: Documento / Código */}
                  <td className="px-4 py-4 text-sm">
                    <div className="space-y-1">
                      <p className="font-medium text-gray-900">{cliente.documento || 'N/A'}</p>
                      <p className="text-gray-600">Código: {String(cliente.codclie || 'N/A')}</p>
                    </div>
                  </td>
                  
                  {/* Columna 2: Razón Social / Dirección */}
                  <td className="px-4 py-4 text-sm">
                    <div className="space-y-1">
                      <p className="font-medium text-gray-900">{cliente.razon || 'N/A'}</p>
                      <p className="text-gray-600">📍 {cliente.direccion || 'N/A'}</p>
                    </div>
                  </td>
                  
                  {/* Columna 3: Celular */}
                  <td className="px-4 py-4 text-sm text-gray-500">
                    📞 {cliente.celular || 'N/A'}
                  </td>
                  {/* Columna 4: Reporte Infocorp */}
                  <td className="px-4 py-4 text-sm">
                    {cliente.rutaReporte ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircleIcon className="h-4 w-4 mr-1" />
                        Disponible ({cliente.fechaReporte ? new Date(cliente.fechaReporte).toLocaleDateString() : 'N/A'})
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <XMarkIcon className="h-4 w-4 mr-1" />
                        No disponible
                      </span>
                    )}
                  </td>
                  
                  {/* Columna 5: Acciones */}
                  <td className="px-4 py-4 text-right text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewReport(cliente)}
                        className={`inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white ${
                          cliente.rutaReporte 
                            ? 'bg-blue-600 hover:bg-blue-700' 
                            : 'bg-gray-400 cursor-not-allowed'
                        }`}
                        title="Ver Reporte"
                        disabled={!cliente.rutaReporte}
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDownloadReport(cliente)}
                        className={`inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white ${
                          cliente.rutaReporte 
                            ? 'bg-green-600 hover:bg-green-700' 
                            : 'bg-gray-400 cursor-not-allowed'
                        }`}
                        title="Descargar Reporte"
                        disabled={!cliente.rutaReporte}
                      >
                        <ArrowDownTrayIcon className="h-5 w-5" />
                      </button>
                      <input
                        type="file"
                        id={`file-upload-${cliente.documento}`}
                        className="hidden"
                        accept="application/pdf"
                        onChange={(e) => handleFileChange(e, cliente)}
                      />
                      <button
                        onClick={() => handleUploadReport(cliente)}
                        className="inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-purple-600 hover:bg-purple-700"
                        title={cliente.rutaReporte ? "Actualizar Reporte" : "Subir Reporte"}
                        disabled={uploading}
                      >
                        {uploading && selectedClient?.documento === cliente.documento ? (
                          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                          <ArrowUpTrayIcon className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        
        {/* Indicador de carga para más datos */}
        {loadingMore && (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-2 text-gray-600">Cargando más clientes...</span>
          </div>
        )}
        
        </div>
      </div>

      {/* Modal para ver reporte PDF */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl w-[95vw] h-[90vh] flex flex-col">
            {/* Header del modal */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 text-center flex-1">
                Reporte Infocorp
              </h3>
              <button
                onClick={() => {
                  // Limpiar la URL del blob cuando se cierre el modal
                  if (reportUrl && reportUrl.startsWith('blob:')) {
                    URL.revokeObjectURL(reportUrl);
                  }
                  setShowReportModal(false);
                  setReportUrl('');
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Contenido del modal sin padding lateral */}
            <div className="flex-1 p-0">
              <iframe
                src={reportUrl}
                className="w-full h-full border-0 rounded-b-lg"
                title="Reporte Infocorp"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Infocorp;