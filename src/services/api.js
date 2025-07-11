import axiosClient from './axiosClient';

// Aplica el header especial a TODAS las peticiones axios
axiosClient.defaults.headers.common['ngrok-skip-browser-warning'] = 'true';

const BASE_URL = '';

// Medifarma
export const getMedifarmaData = async () => {
  try {
    const response = await axiosClient.get('/medifarma');
    return response.data;
  } catch (error) {
    console.error('Error obteniendo datos de Medifarma:', error);
    throw error;
  }
};

export const importMedifarmaFile = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await axiosClient.post('/medifarma/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout: 300000 // 5 minutos para importación completa
    });
    
    return response.data;
  } catch (error) {
    console.error('Error importando archivo Medifarma:', error);
    throw error;
  }
};

export const clearMedifarma = async () => {
  try {
    const response = await axiosClient.delete('/medifarma/clear');
    return response.data;
  } catch (error) {
    console.error('Error al vaciar tabla Medifarma:', error);
    throw error;
  }
};

export const uploadMedifarmaToProd = async () => {
  try {
    const response = await axiosClient.post('/medifarma/upload-to-prod');
    return response.data;
  } catch (error) {
    console.error('Error al subir a producción Medifarma:', error);
    throw error;
  }
};

// BCP
export const getBCPData = async () => {
  try {
    const response = await axiosClient.get('/bcp');
    return response.data;
  } catch (error) {
    console.error('Error obteniendo datos de BCP:', error);
    return { 
      success: false, 
      error: error.response?.data?.error || error.message || 'Error desconocido' 
    };
  }
};

export const importBCPFile = async (formData) => {
  try {
    const response = await axiosClient.post('/bcp/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout: 30000 // 30 segundos de timeout
    });
    return response.data;
  } catch (error) {
    console.error('Error importando archivo BCP:', error);
    
    // Construir mensaje de error más detallado
    let errorMessage = 'Error al importar archivo';
    
    if (error.response) {
      // El servidor respondió con un código de estado diferente de 2xx
      errorMessage = `Error ${error.response.status}: ${error.response.data?.error || 'Error en la respuesta del servidor'}`;
    } else if (error.request) {
      // La petición fue hecha pero no se recibió respuesta
      errorMessage = 'No se recibió respuesta del servidor. Verifique su conexión.';
    } else {
      // Algo sucedió en la configuración de la petición que desencadenó un error
      errorMessage = error.message;
    }
    
    return { 
      success: false, 
      error: errorMessage 
    };
  }
};

export const clearBCP = async () => {
  try {
    const response = await axiosClient.delete('/bcp/clear');
    return response.data;
  } catch (error) {
    console.error('Error al vaciar tabla BCP:', error);
    return { 
      success: false, 
      error: error.response?.data?.error || error.message || 'Error desconocido' 
    };
  }
};

export const uploadBCPToProd = async () => {
  try {
    const response = await axiosClient.post('/bcp/upload-to-prod');
    return response.data;
  } catch (error) {
    console.error('Error al subir a producción BCP:', error);
    return { 
      success: false, 
      error: error.response?.data?.error || error.message || 'Error desconocido' 
    };
  }
};

// BBVA
export const getBBVAData = async () => {
  try {
    const response = await axiosClient.get('/bbva');
    return response.data;
  } catch (error) {
    console.error('Error obteniendo datos de BBVA:', error);
    throw error;
  }
};

export const importBBVAFile = async (formData) => {
  try {
    const response = await axiosClient.post('/bbva/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error importando archivo BBVA:', error);
    throw error;
  }
};

export const clearBBVA = async () => {
  try {
    const response = await axiosClient.delete('/bbva/clear');
    return response.data;
  } catch (error) {
    console.error('Error al vaciar tabla BBVA:', error);
    throw error;
  }
};

export const uploadBBVAToProd = async () => {
  try {
    const response = await axiosClient.post('/bbva/upload-to-prod');
    return response.data;
  } catch (error) {
    console.error('Error al subir a producción BBVA:', error);
    throw error;
  }
};

// Descuento por Cliente
export const getDesclienteData = async () => {
  try {
    const response = await axiosClient.get('/descliente');
    return response.data;
  } catch (error) {
    console.error('Error obteniendo datos de Descuento por Cliente:', error);
    throw error;
  }
};

export const importDesclienteFile = async (formData) => {
  try {
    const response = await axiosClient.post('/descliente/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error importando archivo Descuento por Cliente:', error);
    throw error;
  }
};

export const clearDescliente = async () => {
  try {
    const response = await axiosClient.delete('/descliente/clear');
    return response.data;
  } catch (error) {
    console.error('Error al vaciar tabla Descuento por Cliente:', error);
    throw error;
  }
};

export const uploadDesclienteToProd = async () => {
  try {
    const response = await axiosClient.post('/descliente/upload-to-prod');
    return response.data;
  } catch (error) {
    console.error('Error al subir a producción Descuento por Cliente:', error);
    throw error;
  }
};

// Letras
export const getLetrasData = async () => {
  try {
    const response = await axiosClient.get('/letras');
    return response.data;
  } catch (error) {
    console.error('Error obteniendo datos de Letras:', error);
    throw error;
  }
};

export const getLetraDetail = async (numero) => {
  try {
    const response = await axiosClient.get(`/letras/${numero}`);
    return response.data;
  } catch (error) {
    console.error('Error obteniendo detalle de Letra:', error);
    throw error;
  }
};

export const searchLetras = async (criterio, valor) => {
  try {
    const response = await axiosClient.get(`/letras/buscar/${criterio}/${valor}`);
    return response.data;
  } catch (error) {
    console.error('Error buscando Letras:', error);
    throw error;
  }
};

// Tipificaciones
export const getTipificacionesData = async () => {
  try {
    const response = await axiosClient.get('/tipificaciones');
    return response.data;
  } catch (error) {
    console.error('Error obteniendo datos de Tipificaciones:', error);
    throw error;
  }
};

export const getDescuentosLaboratorio = async () => {
  try {
    const response = await axiosClient.get('/tipificaciones/descuentos');
    return response.data;
  } catch (error) {
    console.error('Error obteniendo descuentos por laboratorio:', error);
    throw error;
  }
};

export const importTipificacionesClientes = async (formData) => {
  try {
    const response = await axiosClient.post('/tipificaciones/import-clientes', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error importando tipificaciones de clientes:', error);
    throw error;
  }
};

export const importDescuentosLaboratorio = async (formData) => {
  try {
    const response = await axiosClient.post('/tipificaciones/import-descuentos', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error importando descuentos por laboratorio:', error);
    throw error;
  }
};

export const procesarTipificacion = async (laboratorio) => {
  try {
    const response = await axiosClient.post('/tipificaciones/procesar', { laboratorio });
    return response.data;
  } catch (error) {
    console.error('Error procesando tipificación:', error);
    throw error;
  }
};

export const resetTipificaciones = async () => {
  try {
    const response = await axiosClient.delete('/tipificaciones/reset');
    return response.data;
  } catch (error) {
    console.error('Error al resetear tipificaciones:', error);
    throw error;
  }
};

// Exportaciones
export const downloadFile = async (params) => {
  try {
    const response = await axiosClient.post('/export/download', params, {
      responseType: 'blob'
    });
    return response.data;
  } catch (error) {
    console.error('Error descargando archivo:', error);
    throw error;
  }
};

export const downloadDbf = async (params) => {
  try {
    const response = await axiosClient.post('/export/download-dbf', params, {
      responseType: 'blob'
    });
    return response.data;
  } catch (error) {
    console.error('Error descargando archivo DBF:', error);
    throw error;
  }
};

// Consultas
export const consultarMovimientos = async (filtros) => {
  try {
    const response = await axiosClient.post('/movimientos/consultar', filtros);
    return response.data;
  } catch (error) {
    console.error('Error consultando movimientos:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Error desconocido al consultar'
    };
  }
};

export const eliminarMovimientos = async (filtros) => {
  try {
    const response = await axiosClient.post('/movimientos/eliminar', filtros);
    return response.data;
  } catch (error) {
    console.error('Error eliminando movimientos:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Error desconocido al eliminar registros'
    };
  }
};

// Reportes
export const consultarReporteCodPro = async (filtros) => {
  try {
    const response = await axiosClient.post('/reportes/codpro', filtros);
    return response.data;
  } catch (error) {
    console.error('Error consultando reporte CodPro:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Error desconocido al consultar reporte'
    };
  }
}; 

// Picking Procter
export const actualizarVistaPickingProcter = async (anio, mes) => {
  try {
    const response = await axiosClient.post('/reportes/picking-procter/view', {
      anio,
      mes
    });
    return response.data;
  } catch (error) {
    console.error('Error al actualizar vista de Picking Procter:', error);
    throw error;
  }
};

export const consultarReportePickingProcter = async (anio, mes) => {
  try {
    const response = await axiosClient.get('/reportes/picking-procter', {
      params: { anio, mes }
    });
    return response.data;
  } catch (error) {
    console.error('Error consultando reporte de Picking Procter:', error);
    throw error;
  }
};

export const descargarExcelPickingProcter = async (anio, mes) => {
  try {
    const response = await axiosClient.get('/reportes/picking-procter/excel', {
      params: { anio, mes },
      responseType: 'blob'
    });
    
    // Crear y descargar el archivo
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Picking_Procter_${anio}_${mes}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    
    return { success: true };
  } catch (error) {
    console.error('Error descargando Excel de Picking Procter:', error);
    throw error;
  }
};

// Concurso
export const actualizarVistasConcurso = async (anio, mes, dia) => {
  try {
    const response = await axiosClient.post('/reportes/concurso/actualizar', {
      anio,
      mes,
      dia
    });
    return response.data;
  } catch (error) {
    console.error('Error al actualizar vistas de Concurso:', error);
    throw error;
  }
};

// Promociones (antes Escalas)
export const consultarPromociones = async (filtros = {}) => {
  try {
    const params = new URLSearchParams(filtros);
    const response = await axiosClient.get(`/promociones?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Error al consultar promociones:', error);
    throw error;
  }
};

export const crearPromocion = async (data) => {
  try {
    const response = await axiosClient.post('/promociones', data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const actualizarPromocion = async (data) => {
  try {
    const response = await axiosClient.put('/promociones', data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const eliminarPromocion = async (data) => {
  try {
    const response = await axiosClient.delete('/promociones', { data });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Loreal Notas de Crédito
export const actualizarVistaNotasLoreal = async (anio, mes) => {
  try {
    const response = await axiosClient.post('/reportes/loreal-notas/view', {
      anio,
      mes
    });
    return response.data;
  } catch (error) {
    console.error('Error al actualizar vista de Notas Loreal:', error);
    throw error;
  }
};

export const consultarReporteNotasLoreal = async (anio, mes) => {
  try {
    const response = await axiosClient.get('/reportes/loreal-notas', {
      params: { anio, mes }
    });
    return response.data;
  } catch (error) {
    console.error('Error consultando reporte de Notas Loreal:', error);
    throw error;
  }
};

export async function descargarExcelNotasLoreal() {
  try {
    const response = await axiosClient.get('/reportes/loreal-notas/excel', {
      responseType: 'blob'
    });
    // Obtener el nombre del archivo del header
    let filename = 'Notas_Credito_Loreal.xlsx';
    const disposition = response.headers['content-disposition'];
    if (disposition && disposition.indexOf('filename=') !== -1) {
      filename = disposition.split('filename=')[1].replace(/['"]/g, '');
    }
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    return { success: true };
  } catch (error) {
    console.error('Error al descargar Excel:', error);
    return { success: false, error: error.message };
  }
}

// Escalas
export const consultarEscalas = async (filtros = {}) => {
  try {
    const params = new URLSearchParams();
    Object.keys(filtros).forEach(key => {
      if (filtros[key]) {
        params.append(key, filtros[key]);
      }
    });
    
    const response = await axiosClient.get(`/escalas?${params}`);
    return response.data;
  } catch (error) {
    console.error('Error al consultar escalas:', error);
    throw error;
  }
};

export const obtenerLaboratorios = async () => {
  try {
    const response = await axiosClient.get('/escalas/laboratorios');
    return response.data;
  } catch (error) {
    console.error('Error al obtener laboratorios:', error);
    throw error;
  }
};

export const actualizarEscala = async (codpro, data) => {
  try {
    const response = await axiosClient.put(`/escalas/${codpro}`, data);
    return response.data;
  } catch (error) {
    console.error('Error al actualizar escala:', error);
    throw error;
  }
};

export const eliminarEscala = async (codpro) => {
  try {
    const response = await axiosClient.delete(`/escalas/${codpro}`);
    return response.data;
  } catch (error) {
    console.error('Error al eliminar escala:', error);
    throw error;
  }
};

// Multi Acción
export const buscarPedido = async (numero) => {
  try {
    const response = await axiosClient.get(`/multi-accion/pedido/${encodeURIComponent(numero.trim())}`);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      throw { status: 404, message: 'No se encontró el pedido' };
    }
    console.error('Error al buscar pedido:', error);
    throw { status: 500, message: 'Error de conexión al buscar el pedido' };
  }
};

export const invalidarPedido = async (numero) => {
  try {
    const response = await axiosClient.post(`/multi-accion/pedido/${numero.trim()}/invalidar`);
    return response.data;
  } catch (error) {
    console.error('Error al invalidar pedido:', error);
    throw { status: 500, message: 'Error al invalidar el pedido' };
  }
};

export const buscarGuia = async (numero) => {
  try {
    const response = await axiosClient.get(`/multi-accion/guia/${numero.trim()}`);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      throw { status: 404, message: 'No se encontró la guía' };
    }
    console.error('Error al buscar guía:', error);
    throw { status: 500, message: 'Error al buscar la guía' };
  }
};

export const reusarGuia = async (numero) => {
  try {
    const response = await axiosClient.post(`/multi-accion/guia/${numero.trim()}/reusar`);
    return response.data;
  } catch (error) {
    console.error('Error al reusar guía:', error);
    throw { status: 500, message: 'Error al reusar la guía' };
  }
};

export const autorizarCodigos = async (codigos) => {
  try {
    console.log('=== DEBUG FRONTEND AUTORIZAR ===');
    console.log('Códigos recibidos:', codigos);
    console.log('Tipo de códigos:', typeof codigos);
    console.log('Payload a enviar:', { codigos });
    
    const response = await axiosClient.post('/multi-accion/autorizar', { codigos });
    return response.data;
  } catch (error) {
    console.error('Error al autorizar códigos:', error);
    console.error('Error response:', error.response?.data);
    console.error('Error status:', error.response?.status);
    throw { status: 500, message: 'Error al autorizar los códigos' };
  }
};

// Kardex
export const consultarKardex = async (filtros = {}) => {
  try {
    const response = await axiosClient.post('/kardex/consultar', filtros);
    return response.data;
  } catch (error) {
    console.error('Error al consultar kardex:', error);
    throw error;
  }
};

// Clientes
export const consultarClientes = async (filtros = {}, page = 1, limit = 40) => {
  try {
    const params = new URLSearchParams({
      ...filtros,
      page: page.toString(),
      limit: limit.toString()
    });
    const response = await axiosClient.get(`/clientes?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Error al consultar clientes:', error);
    throw error;
  }
};

export const crearCliente = async (data) => {
  try {
    const response = await axiosClient.post('/clientes', data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const actualizarCliente = async (data) => {
  try {
    const response = await axiosClient.put('/clientes', data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const eliminarCliente = async (data) => {
  try {
    const response = await axiosClient.delete('/clientes', { data });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const obtenerLaboratoriosClientes = async () => {
  try {
    const response = await axiosClient.get('/clientes/laboratorios');
    return response.data;
  } catch (error) {
    console.error('Error al obtener laboratorios:', error);
    throw error;
  }
};

export const obtenerTipificacionesClientes = async () => {
  try {
    const response = await axiosClient.get('/clientes/tipificaciones');
    return response.data;
  } catch (error) {
    console.error('Error al obtener tipificaciones:', error);
    throw error;
  }
};

export const importarClientesExcel = async (file, codlab) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('codlab', codlab);
    
    const response = await axiosClient.post('/clientes/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout: 120000 // 2 minutos para importación
    });
    
    return response.data;
  } catch (error) {
    console.error('Error al importar archivo de clientes:', error);
    throw error;
  }
};

// Eliminar clientes en masa por tipificaciones
export const eliminarClientesEnMasa = async (tipificaciones) => {
  try {
    const response = await axiosClient.delete('/clientes/masa', {
      data: { tipificaciones },
      timeout: 60000 // 1 minuto para eliminación en masa
    });
    return response.data;
  } catch (error) {
    console.error('Error al eliminar clientes en masa:', error);
    throw error;
  }
};

// Importar promociones desde Excel
export const importarPromocionesExcel = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await axiosClient.post('/promociones/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout: 120000 // 2 minutos para importación
    });
    
    return response.data;
  } catch (error) {
    console.error('Error al importar archivo de promociones:', error);
    throw error;
  }
};

export const obtenerTipificacionesPromociones = async () => {
  try {
    const response = await axiosClient.get('/promociones/tipificaciones');
    return response.data;
  } catch (error) {
    console.error('Error al obtener tipificaciones de promociones:', error);
    throw error;
  }
};

// Eliminar promociones en masa por tipificaciones
export const eliminarPromocionesEnMasa = async (tipificaciones) => {
  try {
    const response = await axiosClient.delete('/promociones/masa', {
      data: { tipificaciones },
      timeout: 60000 // 1 minuto para eliminación en masa
    });
    return response.data;
  } catch (error) {
    console.error('Error al eliminar promociones en masa:', error);
    throw error;
  }
};

// GUÍAS
export const listarGuias = async (filtros = {}, page = 1, limit = 40) => {
  try {
    const params = new URLSearchParams({
      ...filtros,
      page: page.toString(),
      limit: limit.toString()
    });
    const response = await axiosClient.get(`/guias/listar?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Error obteniendo lista de guías:', error);
    throw error;
  }
};

export const editarGuiaIndividual = async (data) => {
  try {
    const response = await axiosClient.post('/guias/editar-individual', data);
    return response.data;
  } catch (error) {
    console.error('Error editando guía individual:', error);
    throw error;
  }
};

export const editarGuiasRango = async (data) => {
  try {
    const response = await axiosClient.post('/guias/editar-rango', data);
    return response.data;
  } catch (error) {
    console.error('Error editando guías por rango:', error);
    throw error;
  }
};

export const editarGuiasSeleccion = async (data) => {
  try {
    const response = await axiosClient.post('/guias/editar-seleccion', data);
    return response.data;
  } catch (error) {
    console.error('Error editando selección de guías:', error);
    throw error;
  }
};

export const obtenerDetalleGuia = async (numero, tipo) => {
  try {
    const response = await axiosClient.get(`/guias/detalle/${numero}/${tipo}`);
    return response.data;
  } catch (error) {
    console.error('Error obteniendo detalle de guía:', error);
    throw error;
  }
};

export const buscarGuiaEspecifica = async (numero) => {
  try {
    const response = await axiosClient.get(`/guias/buscar-guia/${numero}`);
    return response.data;
  } catch (error) {
    console.error('Error buscando guía específica:', error);
    throw error;
  }
};

export const listarBonificaciones = async (filtros = {}) => {
  try {
    const params = new URLSearchParams();
    if (filtros.Codproducto) params.append('Codproducto', filtros.Codproducto);
    if (filtros.Factor) params.append('Factor', filtros.Factor);
    if (filtros.CodBoni) params.append('CodBoni', filtros.CodBoni);
    if (filtros.Cantidad) params.append('Cantidad', filtros.Cantidad);
    const response = await axiosClient.get(`/bonificaciones/listar?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Error listando bonificaciones:', error);
    throw error;
  }
};

export const buscarProductos = async (busqueda) => {
  try {
    const response = await axiosClient.get(`/promociones/buscar-productos?busqueda=${encodeURIComponent(busqueda)}`);
    return response.data;
  } catch (error) {
    console.error('Error al buscar productos:', error);
    throw error;
  }
};

export const obtenerTodosLosProductos = async () => {
  try {
    const response = await axiosClient.get('/promociones/productos');
    return response.data;
  } catch (error) {
    console.error('Error al obtener productos:', error);
    throw error;
  }
};

// Función para obtener observaciones de un documento
export const getObservacionesDocumento = async (documento) => {
  try {
    const response = await axiosClient.get(`/kardex/observaciones/${documento}`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener observaciones:', error);
    throw error;
  }
};

// Función para obtener datos de la tabla Kardex
export const getKardexTabla = async () => {
  try {
    const response = await axiosClient.get('/kardex/tabla');
    return response.data;
  } catch (error) {
    console.error('Error al obtener datos de la tabla kardex:', error);
    throw error;
  }
};

// Función para ejecutar procedimiento sp_kardex
export const ejecutarProcedimientoKardex = async (params) => {
  try {
    const response = await axiosClient.post('/kardex/ejecutar-procedimiento', params, {
      timeout: 60000 // 1 minuto para la ejecución del procedimiento
    });
    return response.data;
  } catch (error) {
    console.error('Error al ejecutar procedimiento kardex:', error);
    throw error;
  }
};

// Función para obtener detalles de documento desde kardex
export const obtenerDetalleDocumento = async (numero) => {
  try {
    const response = await axiosClient.get(`/kardex/documento/${numero}`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener detalles del documento:', error);
    throw error;
  }
};

// Función para obtener detalles de documento con headers desde kardex
export const obtenerDetalleDocumentoConHeaders = async (numero) => {
  try {
    const response = await axiosClient.get(`/kardex/documento-headers/${numero}`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener detalle de documento con headers:', error);
    throw error;
  }
};