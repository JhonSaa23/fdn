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
  // No enviar token para rutas de autenticación
  const isAuthRoute = config.url?.includes('/auth/');
  
  if (!isAuthRoute) {
    // Obtener token del localStorage solo para rutas que no son de autenticación
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  
  return config;
});

axiosClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Manejar errores de autenticación
    if (error.response?.status === 401) {
      // Token inválido o expirado
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      localStorage.removeItem('sesion');
      
      // Solo redirigir al login si no estamos ya ahí Y no es una petición de permisos
      const isPermissionRequest = error.config?.url?.includes('/vistas/') || 
                                 error.config?.url?.includes('/auth/');
      
      if (!window.location.pathname.includes('/login') && !isPermissionRequest) {
        window.location.href = '/login';
      }
      
      return Promise.reject(error);
    }
    
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
