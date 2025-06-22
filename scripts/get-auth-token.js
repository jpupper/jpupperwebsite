/**
 * Script para obtener un token de autenticación
 * Uso: node get-auth-token.js <username> <password>
 */

const axios = require('axios');

// Configuración
const CONFIG = {
    apiUrl: 'https://vps-4455523-x.dattaweb.com/jpupper',
    isLocal: false
};

// Verificar argumentos
if (process.argv.length < 4) {
    console.error('Por favor proporciona usuario y contraseña');
    console.error('Uso: node get-auth-token.js <username> <password>');
    process.exit(1);
}

const username = process.argv[2];
const password = process.argv[3];

async function getToken() {
    try {
        console.log(`Intentando autenticar en el VPS como ${username}...`);
        
        const response = await axios.post(`${CONFIG.apiUrl}/api/auth/login`, {
            username,
            password
        });
        
        if (response.data && response.data.token) {
            console.log('\n===== TOKEN DE AUTENTICACIÓN VPS =====');
            console.log(response.data.token);
            console.log('====================================\n');
            console.log('Usa este token para crear proyectos:');
            console.log(`node scripts/github-project-creator.js <URL_GITHUB> ${response.data.token}`);
        } else {
            console.error('No se pudo obtener el token');
        }
    } catch (error) {
        console.error('Error de autenticación:', error.response?.data || error.message);
    }
}

getToken();
