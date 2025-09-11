import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { validarDocumento, enviarCodigo, verificarCodigo } from '../services/api';
import { useAuth } from '../hooks/useAuth';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [activeTab, setActiveTab] = useState('admin');
  const [step, setStep] = useState(1); // 1: DNI/RUC, 2: Código
  const [formData, setFormData] = useState({
    documento: '',
    codigo: ''
  });
  const [countdown, setCountdown] = useState(0);
  const [errors, setErrors] = useState({});
  const [rememberSession, setRememberSession] = useState(false);
  const [loading, setLoading] = useState(false);
  const [usuarioData, setUsuarioData] = useState(null);

  // Countdown timer
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);


  const validateDocument = (value) => {
    const cleanValue = value.replace(/\D/g, '');
    if (cleanValue.length === 8) return 'DNI válido';
    if (cleanValue.length === 11) return 'RUC válido';
    if (cleanValue.length < 8) return 'DNI debe tener 8 dígitos';
    if (cleanValue.length === 9) return 'Documento inválido - DNI debe tener 8 dígitos';
    if (cleanValue.length === 10) return 'Documento inválido - RUC debe tener 11 dígitos';
    if (cleanValue.length > 11) return 'RUC debe tener máximo 11 dígitos';
    return 'Ingresa un DNI (8 dígitos) o RUC (11 dígitos)';
  };

  const isDocumentValid = (value) => {
    const cleanValue = value.replace(/\D/g, '');
    return cleanValue.length === 8 || cleanValue.length === 11;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const cleanValue = value.replace(/\D/g, '');
    
    setFormData(prev => ({
      ...prev,
      [name]: cleanValue
    }));

    // Validación en tiempo real
    if (name === 'documento') {
      const error = validateDocument(cleanValue);
      setErrors(prev => ({
        ...prev,
        documento: cleanValue.length > 0 && !error.includes('válido') ? error : ''
      }));
    }
  };

  const handleSendCode = async (e) => {
    e.preventDefault();
    const cleanDoc = formData.documento.replace(/\D/g, '');
    
    if (cleanDoc.length !== 8 && cleanDoc.length !== 11) {
      setErrors({ documento: 'Documento inválido' });
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      // Validar documento en el backend
      const tipoUsuario = activeTab === 'admin' ? 'Admin' : 'Trabajador';
      const response = await validarDocumento(cleanDoc, tipoUsuario);
      
      if (response.success) {
        // Guardar datos del usuario
        setUsuarioData(response.data);
        
        // Enviar código
        const codigoResponse = await enviarCodigo(response.data.idus, response.data.numeroCelular);
        
        if (codigoResponse.success) {
          setStep(2);
          setCountdown(60); // 1 minuto
        } else {
          setErrors({ documento: 'Error enviando código' });
        }
      } else {
        setErrors({ documento: response.message });
      }
    } catch (error) {
      console.error('Error en validación:', error);
      
      // Manejar diferentes tipos de errores
      let errorMessage = 'Error de conexión';
      
      if (error.response?.status === 503) {
        errorMessage = 'Servicio temporalmente no disponible. La base de datos no está conectada.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Usuario no encontrado o no tiene permisos para este tipo de acceso';
      } else if (error.response?.status === 400) {
        errorMessage = error.response?.data?.message || 'Datos inválidos';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      setErrors({ documento: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    if (formData.codigo.length !== 6) {
      setErrors({ codigo: 'El código debe tener 6 dígitos' });
      return;
    }

    if (!usuarioData) {
      setErrors({ codigo: 'Error: datos de usuario no encontrados' });
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      // Verificar código en el backend
      const response = await verificarCodigo(usuarioData.idus, formData.codigo, rememberSession);
      
      if (response.success) {
        // Usar el hook de autenticación para guardar la sesión con el token JWT
        login(response.data.usuario, response.data.sesion, response.data.token);
        
        
        // Redirigir a la página que intentaba acceder o al home
        const from = location.state?.from?.pathname || '/';
        navigate(from, { replace: true });
      } else {
        setErrors({ codigo: response.message });
      }
    } catch (error) {
      console.error('Error verificando código:', error);
      setErrors({ 
        codigo: error.response?.data?.message || 'Error de conexión' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (countdown > 0 || !usuarioData) return;
    
    setLoading(true);
    try {
      const response = await enviarCodigo(usuarioData.idus, usuarioData.numeroCelular);
      if (response.success) {
        setCountdown(60);
      }
    } catch (error) {
      console.error('Error reenviando código:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Sección izquierda - Azul con gradiente diagonal - Solo visible en desktop */}
      <div className="hidden lg:block lg:flex-1 relative overflow-hidden h-screen" style={{background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 50%, var(--color-primary-darker) 100%)'}}>
        {/* Patrones decorativos más sutiles */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-white bg-opacity-10 rounded-full"></div>
        <div className="absolute top-32 left-32 w-12 h-12 bg-white bg-opacity-5 rounded-full"></div>
        <div className="absolute bottom-20 right-20 w-24 h-24 bg-white bg-opacity-8 rounded-full"></div>
        <div className="absolute bottom-40 right-40 w-16 h-16 bg-white bg-opacity-5 rounded-full"></div>
        
        {/* Contenido central */}
        <div className="flex flex-col items-center justify-center h-full text-white px-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
              Sistema Interno
            </h1>
            <p className="text-sm text-blue-100 font-light">
              Gestión Integral de Fármacos del Norte
            </p>
          </div>
          
          {/* Lista de características del sistema */}
          <div className="space-y-3 max-w-sm">
            <div className="flex items-center space-x-3 p-2 rounded-lg bg-white bg-opacity-10 backdrop-blur-sm hover:bg-opacity-20 transition-all duration-300">
              <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
                </svg>
              </div>
              <span className="text-sm font-medium">Gestión de Clientes</span>
            </div>
            
            <div className="flex items-center space-x-3 p-2 rounded-lg bg-white bg-opacity-10 backdrop-blur-sm hover:bg-opacity-20 transition-all duration-300">
              <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-sm font-medium">Control de Inventario</span>
            </div>
            
            <div className="flex items-center space-x-3 p-2 rounded-lg bg-white bg-opacity-10 backdrop-blur-sm hover:bg-opacity-20 transition-all duration-300">
              <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-sm font-medium">Guías de Venta</span>
            </div>
            
            <div className="flex items-center space-x-3 p-2 rounded-lg bg-white bg-opacity-10 backdrop-blur-sm hover:bg-opacity-20 transition-all duration-300">
              <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                </svg>
              </div>
              <span className="text-sm font-medium">Reportes de Ventas</span>
            </div>
            
            <div className="flex items-center space-x-3 p-2 rounded-lg bg-white bg-opacity-10 backdrop-blur-sm hover:bg-opacity-20 transition-all duration-300">
              <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
              </div>
              <span className="text-sm font-medium">Gestión de Usuarios</span>
            </div>
          </div>
        </div>
      </div>

       {/* Sección derecha - Formulario de login */}
       <div className="flex-1 bg-gray-50 flex items-center justify-center px-10 sm:px-6 lg:px-8">
         <div className="w-full max-w-md">
           {/* Logo */}
            
           <div className="flex justify-center mb-6">
             <div className="bg-white rounded-lg p-4 shadow-sm">
               <img 
                 src="/locoFDN_3.png" 
                 alt="Fármacos del Norte" 
                 className="h-16 object-contain"
               />
             </div>
           </div>
            
            {/* Tabs */}
            <div className="flex bg-gray-200 rounded-lg p-1 mb-3">
               <button
                 onClick={() => setActiveTab('admin')}
                 className={`flex-1 flex items-center justify-center space-x-1 py-1.5 px-2 rounded-md transition-all text-xs ${
                   activeTab === 'admin'
                     ? 'text-white shadow-sm'
                     : 'text-gray-600 hover:text-gray-800'
                 }`}
                 style={activeTab === 'admin' ? {backgroundColor: 'var(--color-primary)'} : {}}
               >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">Admin</span>
              </button>
              
               <button
                 onClick={() => setActiveTab('trabajadores')}
                 className={`flex-1 flex items-center justify-center space-x-1 py-1.5 px-2 rounded-md transition-all text-xs ${
                   activeTab === 'trabajadores'
                     ? 'text-white shadow-sm'
                     : 'text-gray-600 hover:text-gray-800'
                 }`}
                 style={activeTab === 'trabajadores' ? {backgroundColor: 'var(--color-primary)'} : {}}
               >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
                <span className="font-medium">Trabajadores</span>
              </button>
            </div>

             {/* Formulario */}
             {step === 1 ? (
               <form onSubmit={handleSendCode} className="space-y-5">
                 <div>
                   <label htmlFor="documento" className="block text-xs font-medium text-gray-700 mb-2">
                     DNI o RUC
                   </label>
                   <input
                     type="text"
                     id="documento"
                     name="documento"
                     value={formData.documento}
                     onChange={handleInputChange}
                     className={`w-full px-4 py-3 text-sm border rounded-lg bg-white shadow-sm focus:ring-0 focus:outline-none transition-all duration-200 hover:border-gray-400 ${
                       errors.documento ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                     }`}
                     placeholder="Ingresa tu DNI (8 dígitos) o RUC (11 dígitos)"
                     maxLength={11}
                     required
                   />
                   {errors.documento && (
                     <p className="mt-1 text-xs text-red-600">{errors.documento}</p>
                   )}
                 </div>

                 <div className="flex items-center">
                   <div className="relative">
                     <input
                       type="checkbox"
                       id="rememberSession"
                       checked={rememberSession}
                       onChange={(e) => setRememberSession(e.target.checked)}
                       className="sr-only"
                     />
                     <label 
                       htmlFor="rememberSession" 
                       className={`flex items-center cursor-pointer transition-all duration-200 ${
                         rememberSession ? 'text-blue-600' : 'text-gray-600'
                       }`}
                       style={rememberSession ? { color: 'var(--color-primary)' } : {}}
                     >
                       <div 
                         className={`relative w-5 h-5 rounded border-2 transition-all duration-200 ${
                           rememberSession 
                             ? 'border-blue-600' 
                             : 'bg-white border-gray-300 hover:border-blue-400'
                         }`}
                         style={rememberSession ? {
                           backgroundColor: 'var(--color-primary)',
                           borderColor: 'var(--color-primary)'
                         } : {}}
                       >
                         {rememberSession && (
                           <svg 
                             className="absolute inset-0 w-3 h-3 m-auto text-white" 
                             fill="currentColor" 
                             viewBox="0 0 20 20"
                           >
                             <path 
                               fillRule="evenodd" 
                               d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                               clipRule="evenodd" 
                             />
                           </svg>
                         )}
                       </div>
                       <span className="ml-3 text-sm font-medium">
                         Mantener sesión activa
                       </span>
                     </label>
                   </div>
                 </div>

                 <button
                   type="submit"
                   disabled={!isDocumentValid(formData.documento) || loading}
                   className={`w-full py-3 px-4 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all ${
                     isDocumentValid(formData.documento) && !loading
                       ? 'text-white cursor-pointer'
                       : 'text-gray-400 bg-gray-200 cursor-not-allowed'
                   }`}
                   style={isDocumentValid(formData.documento) && !loading ? {
                     backgroundColor: 'var(--color-primary)',
                     '--tw-ring-color': 'var(--color-primary)'
                   } : {}}
                   onMouseEnter={(e) => {
                     if (isDocumentValid(formData.documento) && !loading) {
                       e.target.style.backgroundColor = 'var(--color-primary-dark)';
                     }
                   }}
                   onMouseLeave={(e) => {
                     if (isDocumentValid(formData.documento) && !loading) {
                       e.target.style.backgroundColor = 'var(--color-primary)';
                     }
                   }}
                 >
                   {loading ? 'Validando...' : 'Enviar Código'}
                 </button>
               </form>
             ) : (
               <form onSubmit={handleVerifyCode} className="space-y-5">
                 <div className="text-center mb-4">
                   <p className="text-sm text-gray-600 mb-2">
                     Hemos enviado un código de verificación a tu WhatsApp
                   </p>
                   <p className="text-xs text-gray-500">
                     Documento: {usuarioData?.dniRuc || formData.documento}
                   </p>
                 </div>

                 <div>
                   <label htmlFor="codigo" className="block text-xs font-medium text-gray-700 mb-2">
                     Código de Verificación
                   </label>
                   <input
                     type="text"
                     id="codigo"
                     name="codigo"
                     value={formData.codigo}
                     onChange={handleInputChange}
                     className={`w-full px-4 py-3 border rounded-lg bg-white shadow-sm focus:ring-0 focus:outline-none transition-all duration-200 hover:border-gray-400 text-center text-lg tracking-widest ${
                       errors.codigo ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                     }`}
                     placeholder="000000"
                     maxLength={6}
                     required
                   />
                   {errors.codigo && (
                     <p className="mt-1 text-xs text-red-600">{errors.codigo}</p>
                   )}
                 </div>

                 <div className="flex items-center justify-between">
                   <button
                     type="button"
                     onClick={() => setStep(1)}
                     className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
                   >
                     ← Cambiar documento
                   </button>
                   
                   <button
                     type="button"
                     onClick={handleResendCode}
                     disabled={countdown > 0 || loading}
                     className={`text-sm transition-colors ${
                       countdown > 0 || loading
                         ? 'text-gray-400 cursor-not-allowed' 
                         : 'text-blue-600 hover:text-blue-800'
                     }`}
                   >
                     {loading ? 'Enviando...' : countdown > 0 ? `Reenviar en ${countdown}s` : 'Reenviar código'}
                   </button>
                 </div>

                 <button
                   type="submit"
                   disabled={loading}
                   className={`w-full py-3 px-4 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all ${
                     loading
                       ? 'text-gray-400 bg-gray-200 cursor-not-allowed'
                       : 'text-white'
                   }`}
                   style={!loading ? {
                     backgroundColor: 'var(--color-primary)',
                     '--tw-ring-color': 'var(--color-primary)'
                   } : {}}
                   onMouseEnter={(e) => {
                     if (!loading) {
                       e.target.style.backgroundColor = 'var(--color-primary-dark)';
                     }
                   }}
                   onMouseLeave={(e) => {
                     if (!loading) {
                       e.target.style.backgroundColor = 'var(--color-primary)';
                     }
                   }}
                 >
                   {loading ? 'Verificando...' : 'Verificar Código'}
                 </button>
               </form>
             )}
         </div>
       </div>
    </div>
  );
};

export default Login;
