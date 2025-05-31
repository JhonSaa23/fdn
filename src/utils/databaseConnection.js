// Función para verificar la conexión a la base de datos
export const checkDatabaseConnection = async () => {
  try {
    const response = await fetch('/api/health');
    if (!response.ok) {
      throw new Error('Error en la conexión');
    }
    const data = await response.json();
    return data.connected;
  } catch (error) {
    console.error('Error al verificar la conexión a la base de datos:', error);
    return false;
  }
}; 