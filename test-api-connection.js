// Test de conexión con el backend
import axios from 'axios';

async function testBackendConnection() {
    console.log('🧪 Probando conexión con el backend...\n');
    
    const baseURL = 'http://localhost:3023';
    
    try {
        // Test 1: Conexión directa al backend
        console.log('📋 Test 1: Conexión directa al backend');
        const response1 = await axios.get(`${baseURL}/api/usersbot/active`);
        console.log('✅ Backend directo:', response1.status, response1.data);
        
        // Test 2: Usando el proxy de Vite (simulado)
        console.log('\n📋 Test 2: Usando proxy de Vite');
        const response2 = await axios.get('/api/usersbot/active', {
            baseURL: 'http://localhost:5173'
        });
        console.log('✅ Proxy Vite:', response2.status, response2.data);
        
        // Test 3: Usando la configuración del frontend
        console.log('\n📋 Test 3: Usando configuración del frontend');
        const axiosClient = axios.create({
            baseURL: `${process.env.VITE_API_URL || 'http://localhost:3023'}/api`,
            headers: {
                'ngrok-skip-browser-warning': 'true',
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        
        const response3 = await axiosClient.get('/usersbot/active');
        console.log('✅ Configuración frontend:', response3.status, response3.data);
        
    } catch (error) {
        console.error('❌ Error en test:', error.message);
        console.error('Status:', error.response?.status);
        console.error('Data:', error.response?.data);
    }
}

testBackendConnection().catch(console.error);
