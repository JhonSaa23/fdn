import { useState, useEffect, useRef } from 'react';
import { MagnifyingGlassIcon, CameraIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useNotification } from '../App';
import axiosClient from '../services/axiosClient';
import { BrowserMultiFormatReader } from '@zxing/browser';

const BuscarProductos = () => {
  const { showNotification } = useNotification();
  const [busqueda, setBusqueda] = useState('');
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [scanning, setScanning] = useState(false);
  const debounceTimerRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);

  // Función para buscar productos
  const buscarProductos = async (termino) => {
    const terminoLimpio = termino ? termino.trim() : '';
    
    // Para búsquedas manuales, requerir mínimo 3 caracteres
    // Para códigos escaneados, permitir cualquier longitud
    if (!terminoLimpio || terminoLimpio.length === 0) {
      setProductos([]);
      return;
    }
    
    // Si tiene menos de 3 caracteres, solo buscar si es un código numérico (código de barras)
    if (terminoLimpio.length < 3 && !/^\d+$/.test(terminoLimpio)) {
      setProductos([]);
      return;
    }

    try {
      setLoading(true);
      const response = await axiosClient.get('/buscar-productos/buscar', {
        params: { q: termino.trim() }
      });

      if (response.data.success) {
        setProductos(response.data.data || []);
      } else {
        setProductos([]);
        showNotification('error', response.data.message || 'Error en la búsqueda');
      }
    } catch (error) {
      console.error('Error buscando productos:', error);
      setProductos([]);
      showNotification('error', 'Error al buscar productos');
    } finally {
      setLoading(false);
    }
  };

  // Efecto para manejar el debounce
  useEffect(() => {
    // Limpiar el timer anterior si existe
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Si la búsqueda tiene menos de 3 caracteres, verificar si es un código numérico
    const busquedaLimpia = busqueda.trim();
    if (busquedaLimpia.length < 3 && !/^\d+$/.test(busquedaLimpia)) {
      setProductos([]);
      return;
    }

    // Configurar un nuevo timer para ejecutar la búsqueda después de 1 segundo
    debounceTimerRef.current = setTimeout(() => {
      buscarProductos(busqueda);
    }, 1000);

    // Cleanup function para limpiar el timer si el componente se desmonta o cambia la búsqueda
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [busqueda]);

  // Mapear nombres de almacenes
  const almacenes = {
    1: 'Farmacos',
    2: 'Moche JPS',
    3: 'Canjes',
    4: 'Primavera',
    5: 'Moche Maribel'
  };

  // Formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  };
  // Función para iniciar la cámara
  const iniciarScanner = async () => {
    try {
      setShowScanner(true);
      setScanning(false);

      await new Promise(resolve => setTimeout(resolve, 100));

      const video = videoRef.current;
      if (!video) {
        throw new Error('Elemento de video no encontrado');
      }

      // Obtener lista de cámaras disponibles
      const devices = await BrowserMultiFormatReader.listVideoInputDevices();
      if (!devices.length) {
        throw new Error('No se encontraron cámaras disponibles');
      }

      // Buscar cámara trasera
      const selectedDevice = devices.find(device => 
        /back|trasera|rear|environment|posterior/i.test(device.label)
      ) || devices[0];

      // Configurar cámara
      const constraints = {
        video: {
          deviceId: { exact: selectedDevice.deviceId },
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      video.srcObject = stream;
      video.setAttribute('playsinline', 'true');
      
      // Aplicar zoom CSS
      video.style.transform = 'scaleX(-1) scale(1.5)';
      video.style.transformOrigin = 'center center';

      // Intentar zoom nativo
      try {
        const track = stream.getVideoTracks()[0];
        const capabilities = track.getCapabilities();
        if (capabilities.zoom) {
          const zoomValue = Math.min(capabilities.zoom.max || 3.0, 2.5);
          await track.applyConstraints({ advanced: [{ zoom: zoomValue }] });
        }
      } catch (zoomErr) {
        // Usar zoom CSS si falla
      }

      await new Promise((resolve) => {
        video.onloadedmetadata = () => {
          video.play();
          resolve();
        };
      });

      setScanning(true);

    } catch (error) {
      console.error('Error en iniciarScanner:', error);
      showNotification('error', error.message || 'Error al iniciar la cámara. Asegúrate de permitir el acceso a la cámara.');
      detenerScanner();
    }
  };

  // Función para capturar y analizar imagen
  const capturarYAnalizar = async () => {
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      if (!video || !canvas || !video.videoWidth) {
        showNotification('warning', 'La cámara no está lista');
        return;
      }

      // Capturar frame del video
      const context = canvas.getContext('2d');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convertir canvas a ImageData
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

      // Crear lector y analizar
      const codeReader = new BrowserMultiFormatReader();
      const result = await codeReader.decodeFromImageData(imageData);

      if (result) {
        const code = result.getText();
        console.error('✅✅ CÓDIGO DETECTADO:', code);
        
        if (navigator.vibrate) {
          navigator.vibrate([100, 50, 100]);
        }

        detenerScanner();
        handleCodigoEscaneado(code);
      } else {
        showNotification('warning', 'No se detectó ningún código de barras. Intenta de nuevo.');
      }

    } catch (error) {
      console.error('Error analizando imagen:', error);
      showNotification('warning', 'No se pudo leer el código de barras. Asegúrate de que esté bien enfocado.');
    }
  };

  // Función para detener el escáner
  const detenerScanner = () => {
    try {
      // Detener stream de video
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      // Limpiar video
      if (videoRef.current) {
        videoRef.current.srcObject = null;
        videoRef.current.style.transform = '';
      }

      setShowScanner(false);
      setScanning(false);
    } catch (error) {
      console.error('Error deteniendo escáner:', error);
      setShowScanner(false);
      setScanning(false);
    }
  };

  // Función para manejar el código escaneado
  const handleCodigoEscaneado = (codigo) => {
    try {
      // Limpiar el código (eliminar espacios)
      const codigoLimpio = codigo.trim().replace(/\s+/g, '');
      
      if (!codigoLimpio || codigoLimpio.length === 0) {
        showNotification('warning', 'No se pudo leer el código de barras');
        return;
      }

      // Vibrar si está disponible
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }

      // Poner el código en el input
      setBusqueda(codigoLimpio);

      // Mostrar notificación
      showNotification('success', `Código escaneado: ${codigoLimpio}`);

      // Buscar inmediatamente
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      buscarProductos(codigoLimpio);
      
    } catch (error) {
      console.error('Error manejando código escaneado:', error);
      showNotification('error', 'Error al procesar el código escaneado');
    }
  };

  // Limpiar el escáner al desmontar el componente
  useEffect(() => {
    return () => {
      detenerScanner();
    };
  }, []);

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Barra de búsqueda */}
      <div className="p-4 border-b bg-gray-50">
        <div className="relative flex items-center gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Buscar por nombre, lote, código de barras o código de producto (mínimo 3 caracteres)"
            />
            {loading && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            )}
          </div>
          {/* Botón de cámara */}
          <button
            type="button"
            onClick={iniciarScanner}
            disabled={scanning}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Escanear código de barras"
          >
            <CameraIcon className="h-5 w-5 text-gray-600" />
          </button>
        </div>
        {busqueda.trim().length > 0 && busqueda.trim().length < 3 && (
          <p className="mt-2 text-sm text-gray-500">
            Escribe al menos 3 caracteres para buscar
          </p>
        )}
        {busqueda.trim().length >= 3 && !loading && (
          <p className="mt-2 text-sm text-gray-500">
            {productos.length > 0 
              ? `Se encontraron ${productos.length} producto(s)`
              : 'No se encontraron productos'}
          </p>
        )}
      </div>

      {/* Resultados */}
      <div className="divide-y divide-gray-200 max-h-[calc(100vh-200px)] overflow-y-auto">
        {productos.length === 0 && busqueda.trim().length >= 3 && !loading && (
          <div className="p-8 text-center text-gray-500">
            <p>No se encontraron productos para "{busqueda}"</p>
          </div>
        )}

        {productos.map((producto, index) => (
          <div key={`${producto.codpro}-${index}`} className="p-4">
            {/* Información del producto */}
            <div className="mb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900">
                    {producto.Nombre}
                  </h3>
                  <div className="mt-1 flex flex-wrap gap-2 text-sm text-gray-500">
                    <span>Código: <span className="font-medium text-gray-700">{producto.codpro}</span></span>
                    {producto.CodBar && (
                      <span>Código de Barras: <span className="font-medium text-gray-700">{producto.CodBar}</span></span>
                    )}
                  </div>
                </div>
                {producto.saldos && producto.saldos.length > 0 && (
                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {producto.saldos.length} {producto.saldos.length === 1 ? 'ubicación' : 'ubicaciones'}
                  </span>
                )}
              </div>
            </div>

            {/* Saldos del producto */}
            {producto.saldos && producto.saldos.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Almacén
                      </th>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Saldo
                      </th>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Lote
                      </th>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Vencimiento
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {producto.saldos.map((saldo, saldoIndex) => (
                      <tr key={`${saldo.almacen}-${saldo.lote}-${saldoIndex}`} className="hover:bg-gray-50">
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{saldo.nombreAlmacen}</div>
                          <div className="text-xs text-gray-500">#{saldo.almacen}</div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            saldo.saldo > 0
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {saldo.saldo || 0}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                          {saldo.lote || '-'}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(saldo.vencimiento)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-sm text-gray-500 py-2">
                No hay saldos disponibles para este producto
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal del escáner */}
      {showScanner && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={detenerScanner}></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Escanear código de barras
                      </h3>
                      <button
                        type="button"
                        onClick={detenerScanner}
                        className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                      >
                        <XMarkIcon className="h-6 w-6" />
                      </button>
                    </div>
                    
                    <div className="mt-4">
                      <div className="w-full max-w-md mx-auto bg-black rounded-lg overflow-hidden relative" style={{ minHeight: '400px' }}>
                        <video
                          ref={videoRef}
                          className="w-full h-full object-cover"
                          style={{ 
                            display: scanning ? 'block' : 'none',
                            objectFit: 'cover'
                          }}
                          playsInline
                          muted
                        />
                        {!scanning && (
                          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-white">
                            <div className="text-center">
                              <CameraIcon className="h-12 w-12 mx-auto mb-2 animate-pulse" />
                              <p>Iniciando cámara...</p>
                            </div>
                          </div>
                        )}
                        <canvas ref={canvasRef} style={{ display: 'none' }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse sm:gap-3">
                {scanning && (
                  <button
                    type="button"
                    onClick={capturarYAnalizar}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:w-auto sm:text-sm"
                  >
                    Capturar
                  </button>
                )}
                <button
                  type="button"
                  onClick={detenerScanner}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:w-auto sm:text-sm"
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

export default BuscarProductos;

