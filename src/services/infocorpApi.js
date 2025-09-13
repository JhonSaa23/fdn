import axiosClient from './axiosClient';

// Obtener clientes con paginación
export const obtenerClientesInfocorp = async (filtros = {}, page = 1, limit = 40) => {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(filtros.search && { search: filtros.search })
    });

    const response = await axiosClient.get(`/infocorp/clientes?${params}`);
    return response.data;
  } catch (error) {
    console.error('Error obteniendo clientes Infocorp:', error);
    throw error;
  }
};

// Subir reporte PDF
export const subirReporteInfocorp = async (documento, archivo) => {
  try {
    const formData = new FormData();
    formData.append('reporte', archivo);

    const response = await axiosClient.post(`/infocorp/upload/${documento}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error subiendo reporte Infocorp:', error);
    throw error;
  }
};

// Obtener URL del reporte
export const obtenerUrlReporte = (documento) => {
  return `${axiosClient.defaults.baseURL}/infocorp/reporte/${documento}`;
};
