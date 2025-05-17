import axios from 'axios';

const BASE_URL = '/api';

// Medifarma
export const getMedifarmaData = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/medifarma`);
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
    
    const response = await axios.post('/api/medifarma/import', formData, {
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
    const response = await axios.delete(`${BASE_URL}/medifarma/clear`);
    return response.data;
  } catch (error) {
    console.error('Error al vaciar tabla Medifarma:', error);
    throw error;
  }
};

export const uploadMedifarmaToProd = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/medifarma/upload-to-prod`);
    return response.data;
  } catch (error) {
    console.error('Error al subir a producción Medifarma:', error);
    throw error;
  }
};

// BCP
export const getBCPData = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/bcp`);
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
    const response = await axios.post(`${BASE_URL}/bcp/import`, formData, {
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
    const response = await axios.delete(`${BASE_URL}/bcp/clear`);
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
    const response = await axios.post(`${BASE_URL}/bcp/upload-to-prod`);
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
    const response = await axios.get(`${BASE_URL}/bbva`);
    return response.data;
  } catch (error) {
    console.error('Error obteniendo datos de BBVA:', error);
    throw error;
  }
};

export const importBBVAFile = async (formData) => {
  try {
    const response = await axios.post(`${BASE_URL}/bbva/import`, formData, {
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
    const response = await axios.delete(`${BASE_URL}/bbva/clear`);
    return response.data;
  } catch (error) {
    console.error('Error al vaciar tabla BBVA:', error);
    throw error;
  }
};

export const uploadBBVAToProd = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/bbva/upload-to-prod`);
    return response.data;
  } catch (error) {
    console.error('Error al subir a producción BBVA:', error);
    throw error;
  }
};

// Descuento por Cliente
export const getDesclienteData = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/descliente`);
    return response.data;
  } catch (error) {
    console.error('Error obteniendo datos de Descuento por Cliente:', error);
    throw error;
  }
};

export const importDesclienteFile = async (formData) => {
  try {
    const response = await axios.post(`${BASE_URL}/descliente/import`, formData, {
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
    const response = await axios.delete(`${BASE_URL}/descliente/clear`);
    return response.data;
  } catch (error) {
    console.error('Error al vaciar tabla Descuento por Cliente:', error);
    throw error;
  }
};

export const uploadDesclienteToProd = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/descliente/upload-to-prod`);
    return response.data;
  } catch (error) {
    console.error('Error al subir a producción Descuento por Cliente:', error);
    throw error;
  }
};

// Letras
export const getLetrasData = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/letras`);
    return response.data;
  } catch (error) {
    console.error('Error obteniendo datos de Letras:', error);
    throw error;
  }
};

export const getLetraDetail = async (numero) => {
  try {
    const response = await axios.get(`${BASE_URL}/letras/${numero}`);
    return response.data;
  } catch (error) {
    console.error('Error obteniendo detalle de Letra:', error);
    throw error;
  }
};

export const searchLetras = async (criterio, valor) => {
  try {
    const response = await axios.get(`${BASE_URL}/letras/buscar/${criterio}/${valor}`);
    return response.data;
  } catch (error) {
    console.error('Error buscando Letras:', error);
    throw error;
  }
};

// Tipificaciones
export const getTipificacionesData = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/tipificaciones`);
    return response.data;
  } catch (error) {
    console.error('Error obteniendo datos de Tipificaciones:', error);
    throw error;
  }
};

export const getDescuentosLaboratorio = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/tipificaciones/descuentos`);
    return response.data;
  } catch (error) {
    console.error('Error obteniendo descuentos por laboratorio:', error);
    throw error;
  }
};

export const importTipificacionesClientes = async (formData) => {
  try {
    const response = await axios.post(`${BASE_URL}/tipificaciones/import-clientes`, formData, {
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
    const response = await axios.post(`${BASE_URL}/tipificaciones/import-descuentos`, formData, {
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
    const response = await axios.post(`${BASE_URL}/tipificaciones/procesar`, { laboratorio });
    return response.data;
  } catch (error) {
    console.error('Error procesando tipificación:', error);
    throw error;
  }
};

export const resetTipificaciones = async () => {
  try {
    const response = await axios.delete(`${BASE_URL}/tipificaciones/reset`);
    return response.data;
  } catch (error) {
    console.error('Error al resetear tipificaciones:', error);
    throw error;
  }
};

// Exportaciones
export const downloadFile = async (params) => {
  try {
    const response = await axios.post(`${BASE_URL}/export/download`, params, {
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
    const response = await axios.post(`${BASE_URL}/export/download-dbf`, params, {
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
    const response = await axios.post(`${BASE_URL}/movimientos/consultar`, filtros);
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
    const response = await axios.post(`${BASE_URL}/movimientos/eliminar`, filtros);
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
    const response = await axios.post(`${BASE_URL}/reportes/codpro`, filtros);
    return response.data;
  } catch (error) {
    console.error('Error consultando reporte CodPro:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Error desconocido al consultar reporte'
    };
  }
}; 