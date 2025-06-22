/**
 * Script para crear un proyecto a partir de un repositorio GitHub
 * Uso: node create-github-project.js <URL_GITHUB> <TOKEN>
 */

const axios = require('axios');

// Configuración
const CONFIG = {
    apiUrl: 'http://localhost:3243'
};

// Verificar argumentos
if (process.argv.length < 3) {
    console.error('Por favor proporciona una URL de GitHub');
    console.error('Uso: node create-github-project.js <URL_GITHUB> [TOKEN]');
    process.exit(1);
}

const githubUrl = process.argv[2];
const token = process.argv.length >= 4 ? process.argv[3] : null;

// Extraer información básica de la URL
function extractRepoInfo(url) {
    // Extraer usuario y nombre del repositorio de la URL
    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) {
        throw new Error('URL de GitHub no válida');
    }
    
    const [, username, repo] = match;
    
    return {
        id: `github-${username}-${repo}`.toLowerCase(),
        title: `${repo} por ${username}`,
        description: `Repositorio GitHub: ${repo} creado por ${username}`,
        url: url,
        tags: ['github', repo, username]
    };
}

// Crear proyecto en la API
async function createProject(projectData) {
    try {
        console.log('Creando proyecto en la API...');
        console.log('Datos del proyecto:', projectData);
        
        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await axios.post(`${CONFIG.apiUrl}/api/projects`, projectData, { headers });
        
        return response.data;
    } catch (error) {
        console.error('Error creando proyecto:', error.response?.data || error.message);
        throw error;
    }
}

// Función principal
async function main() {
    try {
        // Extraer información básica del repositorio
        const projectData = extractRepoInfo(githubUrl);
        console.log('Información extraída del repositorio:', projectData);
        
        // Crear proyecto en la API
        const result = await createProject(projectData);
        console.log('Proyecto creado exitosamente:', result);
    } catch (error) {
        console.error('Error en el proceso:', error);
        process.exit(1);
    }
}

main();
