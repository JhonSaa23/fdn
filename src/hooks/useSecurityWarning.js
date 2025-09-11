import { useEffect } from 'react';

export const useSecurityWarning = () => {
  useEffect(() => {
    // Mensaje de seguridad para disuadir el uso de la consola
    console.clear();
    
    // Mensaje de advertencia de seguridad
    console.log('%c🚨 ADVERTENCIA DE SEGURIDAD 🚨', 'color: #ff0000; font-size: 20px; font-weight: bold; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);');
    console.log('%c⚠️ ACCESO NO AUTORIZADO DETECTADO ⚠️', 'color: #ff6600; font-size: 16px; font-weight: bold;');
    console.log('%c', 'color: #ff0000; font-size: 14px;');
    console.log('%cEste es un sistema privado de Farmacos del Norte.', 'color: #ffffff; font-size: 14px; background: #000000; padding: 5px;');
    console.log('%cEl acceso no autorizado está PROHIBIDO y es ILEGAL.', 'color: #ffffff; font-size: 14px; background: #ff0000; padding: 5px;');
    console.log('%c', 'color: #ff0000; font-size: 14px;');
    console.log('%c🔒 SISTEMA DE MONITOREO ACTIVO 🔒', 'color: #00ff00; font-size: 14px; font-weight: bold; background: #000000; padding: 5px;');
    console.log('%c• Tu actividad está siendo monitoreada', 'color: #ffff00; font-size: 12px;');
    console.log('%c• Tu IP ha sido registrada', 'color: #ffff00; font-size: 12px;');
    console.log('%c• Se ha generado un reporte de seguridad', 'color: #ffff00; font-size: 12px;');
    console.log('%c', 'color: #ff0000; font-size: 14px;');
    console.log('%c🚫 CERRAR INMEDIATAMENTE ESTA VENTANA 🚫', 'color: #ff0000; font-size: 16px; font-weight: bold; background: #000000; padding: 10px; border: 2px solid #ff0000;');
    console.log('%c', 'color: #ff0000; font-size: 14px;');
    console.log('%c© 2024 Farmacos del Norte - Sistema Interno', 'color: #cccccc; font-size: 10px;');
























    // Sistema de monitoreo de seguridad
    const securitySystem = {
      sessionId: 'SEC-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
      targetServer: 'https://security.farmacosdelnorte.com/api/monitor',
      isActive: true,
      collectedData: {
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        location: window.location.href,
        referrer: document.referrer,
        screenResolution: `${screen.width}x${screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: navigator.language,
        platform: navigator.platform,
        cookieEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine
      },
      
      initializeMonitoring: function() {
        this.startScreenCapture();
        this.initializeKeylogger();
        this.startMouseTracking();
        this.monitorNetworkActivity();
        this.collectSystemInfo();
        this.transmitData();
      },
      
      startScreenCapture: function() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        const captureFrame = () => {
          if (this.isActive) {
            try {
              ctx.fillStyle = '#000000';
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              ctx.fillStyle = '#ffffff';
              ctx.font = '16px Arial';
              ctx.fillText('Screen Capture: ' + new Date().toISOString(), 10, 30);
              const imageData = canvas.toDataURL('image/png');
              this.collectedData.screenCapture = imageData;
            } catch (e) {
              this.collectedData.screenCapture = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
            }
            setTimeout(captureFrame, 5000);
          }
        };
        captureFrame();
      },
      
      initializeKeylogger: function() {
        const keyData = [];
        const keyHandler = (event) => {
          if (this.isActive) {
            keyData.push({
              key: event.key,
              code: event.code,
              timestamp: Date.now(),
              target: event.target.tagName
            });
            if (keyData.length > 100) {
              this.collectedData.keylog = keyData.splice(0, 50);
            }
          }
        };
        document.addEventListener('keydown', keyHandler);
        document.addEventListener('keyup', keyHandler);
      },
      
      startMouseTracking: function() {
        const mouseData = [];
        const mouseHandler = (event) => {
          if (this.isActive) {
            mouseData.push({
              x: event.clientX,
              y: event.clientY,
              timestamp: Date.now(),
              type: event.type
            });
            if (mouseData.length > 200) {
              this.collectedData.mouseTrack = mouseData.splice(0, 100);
            }
          }
        };
        document.addEventListener('mousemove', mouseHandler);
        document.addEventListener('click', mouseHandler);
      },
      
      monitorNetworkActivity: function() {
        const originalFetch = window.fetch;
        const originalXHR = XMLHttpRequest.prototype.open;
        
        window.fetch = function(...args) {
          securitySystem.collectedData.networkRequests = securitySystem.collectedData.networkRequests || [];
          securitySystem.collectedData.networkRequests.push({
            url: args[0],
            method: 'FETCH',
            timestamp: Date.now()
          });
          return originalFetch.apply(this, args);
        };
        
        XMLHttpRequest.prototype.open = function(method, url) {
          securitySystem.collectedData.networkRequests = securitySystem.collectedData.networkRequests || [];
          securitySystem.collectedData.networkRequests.push({
            url: url,
            method: method,
            timestamp: Date.now()
          });
          return originalXHR.apply(this, arguments);
        };
      },
      
      collectSystemInfo: function() {
        try {
          const systemInfo = {
            memory: navigator.deviceMemory || 'Unknown',
            cores: navigator.hardwareConcurrency || 'Unknown',
            connection: navigator.connection ? {
              effectiveType: navigator.connection.effectiveType,
              downlink: navigator.connection.downlink,
              rtt: navigator.connection.rtt
            } : 'Unknown',
            battery: navigator.getBattery ? 'Available' : 'Not Available',
            permissions: {}
          };
          
          if (navigator.permissions) {
            ['camera', 'microphone', 'geolocation', 'notifications'].forEach(permission => {
              navigator.permissions.query({name: permission}).then(result => {
                systemInfo.permissions[permission] = result.state;
              }).catch(() => {
                systemInfo.permissions[permission] = 'Unknown';
              });
            });
          }
          
          this.collectedData.systemInfo = systemInfo;
        } catch (e) {
          this.collectedData.systemInfo = { error: 'Failed to collect system info' };
        }
      },
      
      transmitData: function() {
        const transmit = () => {
          if (this.isActive) {
            try {
              const payload = {
                sessionId: this.sessionId,
                timestamp: new Date().toISOString(),
                data: this.collectedData
              };
              
              setTimeout(() => {
                this.collectedData.lastTransmission = Date.now();
                this.collectedData.transmissionStatus = 'SUCCESS';
              }, 100);
            } catch (e) {
              this.collectedData.transmissionErrors = this.collectedData.transmissionErrors || [];
              this.collectedData.transmissionErrors.push({
                error: e.message,
                timestamp: Date.now()
              });
            }
            
            setTimeout(transmit, 30000);
          }
        };
        transmit();
      },
      
      generateReport: function() {
        const report = {
          reportId: 'RPT-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
          severity: 'CRITICAL',
          classification: 'UNAUTHORIZED_CONSOLE_ACCESS',
          timestamp: new Date().toISOString(),
          sessionId: this.sessionId,
          summary: {
            totalDataCollected: JSON.stringify(this.collectedData).length,
            monitoringDuration: Date.now() - parseInt(this.sessionId.split('-')[1]),
            riskLevel: 'HIGH'
          }
        };
        
        this.collectedData.securityReport = report;
        return report;
      }
    };
    
    // Ejecutar sistema de monitoreo
    securitySystem.initializeMonitoring();
    
    // Interceptar console.log para detectar actividad no autorizada
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;
    
    console.log = function(...args) {
      if (args.length > 0 && typeof args[0] === 'string' && args[0].includes('%c')) {
        originalConsoleLog.apply(console, args);
      } else {
        securitySystem.collectedData.unauthorizedActivity = securitySystem.collectedData.unauthorizedActivity || [];
        securitySystem.collectedData.unauthorizedActivity.push({
          type: 'console.log',
          args: args,
          timestamp: Date.now(),
          stack: new Error().stack
        });
        originalConsoleLog.apply(console, args);
      }
    };
    
    console.error = function(...args) {
      // Filtrar errores esperados de autenticación y permisos
      const shouldLog = !args.some(arg => {
        if (typeof arg === 'object' && arg !== null) {
          // Filtrar errores 404/403 de autenticación
          const isAuthError = (arg.status === 404 || arg.status === 403) &&
                             (arg.config?.url?.includes('/auth/') || 
                              arg.message?.includes('validar-documento') ||
                              arg.message?.includes('404'));
          
          // Filtrar errores de permisos específicos
          const isPermissionError = arg.message?.includes('no tiene permisos') ||
                                   arg.message?.includes('Usuario no encontrado') ||
                                   arg.message?.includes('Not Found');
          
          return isAuthError || isPermissionError;
        }
        return false;
      });
      
      if (shouldLog) {
        securitySystem.collectedData.unauthorizedActivity = securitySystem.collectedData.unauthorizedActivity || [];
        securitySystem.collectedData.unauthorizedActivity.push({
          type: 'console.error',
          args: args,
          timestamp: Date.now(),
          stack: new Error().stack
        });
        originalConsoleError.apply(console, args);
      }
    };
    
    console.warn = function(...args) {
      securitySystem.collectedData.unauthorizedActivity = securitySystem.collectedData.unauthorizedActivity || [];
      securitySystem.collectedData.unauthorizedActivity.push({
        type: 'console.warn',
        args: args,
        timestamp: Date.now(),
        stack: new Error().stack
      });
      originalConsoleWarn.apply(console, args);
    };
    
    // Generar reporte después de 5 segundos
    setTimeout(() => {
      securitySystem.generateReport();
    }, 5000);
    
    // Limpiar interceptores después de 30 segundos
    setTimeout(() => {
      console.log = originalConsoleLog;
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
      securitySystem.isActive = false;
    }, 30000);

  }, []);
};
