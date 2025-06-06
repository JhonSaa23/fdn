// Función para verificar la conexión a la base de datos
export const checkDatabaseConnection = async () => {
  const URL_BASE = import.meta.env.VITE_API_URL;
  try {
    const url = `${URL_BASE}/api/health`;
    console.log('Llamando a:', url);
    const response = await fetch(url, {
      headers: {
        'ngrok-skip-browser-warning': 'true'
      }
    });
    const text = await response.text();
    try {
      const data = JSON.parse(text);
      return data.connected;
    } catch (e) {
      console.error('La respuesta NO es JSON, esto llegó:', text);
      return false;
    }
  } catch (error) {
    console.error('Error al verificar la conexión a la base de datos:', error);
    return false;
  }
}; 