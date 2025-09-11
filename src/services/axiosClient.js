import axios from 'axios';

const axiosClient = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
  headers: {
    'ngrok-skip-browser-warning': 'true',
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Interceptor para requests
axiosClient.interceptors.request.use((config) => {
  return config;
});

axiosClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // No mostrar logs para errores 404 esperados de autenticación
    const isAuth404Error = error.response?.status === 404 && 
                          (error.config?.url?.includes('/auth/validar-documento') ||
                           error.config?.url?.includes('/api/auth/validar-documento'));
    
    // No mostrar logs para errores de permisos esperados (404 o 403)
    const isPermissionError = (error.response?.status === 404 || error.response?.status === 403) &&
                             (error.config?.url?.includes('/auth/') ||
                              error.response?.data?.message?.includes('no tiene permisos') ||
                              error.response?.data?.message?.includes('Usuario no encontrado'));
    
    if (!isAuth404Error && !isPermissionError) {
      console.error('❌ Response Error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          data: error.config?.data
        }
      });
    }
    
    // Log específico para el endpoint de autorizar
    if (error.config?.url?.includes('/multi-accion/autorizar')) {
      console.error('🔥 ERROR ESPECÍFICO EN AUTORIZAR:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status
      });
    }
    
    return Promise.reject(error);
  }
);

export default axiosClient; 
