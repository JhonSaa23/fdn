import React, { useState, useEffect } from 'react';
import { 
  ExclamationTriangleIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ArrowPathIcon 
} from '@heroicons/react/24/outline';
import { verificarEstadoDB } from '../services/api';

const DatabaseStatus = ({ className = '' }) => {
  const [status, setStatus] = useState({
    connected: null,
    loading: true,
    lastCheck: null,
    error: null
  });

  const checkDatabaseStatus = async () => {
    try {
      setStatus(prev => ({ ...prev, loading: true, error: null }));
      const response = await verificarEstadoDB();
      
      setStatus({
        connected: response.success,
        loading: false,
        lastCheck: new Date(),
        error: response.success ? null : response.message
      });
    } catch (error) {
      console.error('Error verificando estado de la base de datos:', error);
      setStatus({
        connected: false,
        loading: false,
        lastCheck: new Date(),
        error: 'Error verificando conectividad'
      });
    }
  };

  useEffect(() => {
    checkDatabaseStatus();
    
    // Verificar cada 30 segundos
    const interval = setInterval(checkDatabaseStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = () => {
    if (status.loading) {
      return <ArrowPathIcon className="h-4 w-4 animate-spin text-yellow-500" />;
    }
    
    if (status.connected === true) {
      return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
    }
    
    if (status.connected === false) {
      return <XCircleIcon className="h-4 w-4 text-red-500" />;
    }
    
    return <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500" />;
  };

  const getStatusText = () => {
    if (status.loading) {
      return 'Verificando...';
    }
    
    if (status.connected === true) {
      return 'Base de datos conectada';
    }
    
    if (status.connected === false) {
      return 'Base de datos desconectada';
    }
    
    return 'Estado desconocido';
  };

  const getStatusColor = () => {
    if (status.loading) {
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    }
    
    if (status.connected === true) {
      return 'text-green-600 bg-green-50 border-green-200';
    }
    
    if (status.connected === false) {
      return 'text-red-600 bg-red-50 border-red-200';
    }
    
    return 'text-yellow-600 bg-yellow-50 border-yellow-200';
  };

  const formatLastCheck = () => {
    if (!status.lastCheck) return '';
    
    const now = new Date();
    const diff = Math.floor((now - status.lastCheck) / 1000);
    
    if (diff < 60) {
      return `Hace ${diff}s`;
    } else if (diff < 3600) {
      return `Hace ${Math.floor(diff / 60)}m`;
    } else {
      return `Hace ${Math.floor(diff / 3600)}h`;
    }
  };

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium ${getStatusColor()} ${className}`}>
      {getStatusIcon()}
      <span>{getStatusText()}</span>
      {status.lastCheck && (
        <span className="text-xs opacity-75">
          ({formatLastCheck()})
        </span>
      )}
      {status.connected === false && (
        <button
          onClick={checkDatabaseStatus}
          className="ml-1 p-0.5 hover:bg-red-100 rounded transition-colors"
          title="Reintentar conexión"
        >
          <ArrowPathIcon className="h-3 w-3" />
        </button>
      )}
    </div>
  );
};

export default DatabaseStatus;
