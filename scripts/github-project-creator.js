/**
 * Script para crear un proyecto a partir de un repositorio GitHub
 * Uso: node github-project-creator.js <URL_GITHUB> <TOKEN>
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const { v4: uuidv4 } = require('uuid');

// Configuración
const CONFIG = {
    apiUrl: 'https://vps-4455523-x.dattaweb.com/jpupper'
};

// Verificar argumentos
if (process.argv.length < 3) {
    console.error('Por favor proporciona una URL de GitHub');
    console.error('Uso: node github-project-creator.js <URL_GITHUB> [TOKEN]');
    process.exit(1);
}

const githubUrl = process.argv[2];
const token = process.argv.length >= 4 ? process.argv[3] : null;

if (!token) {
    console.warn('ADVERTENCIA: No se proporcionó token de autenticación. La creación podría fallar.');
    console.warn('Intenta obtener un token con: node scripts/get-auth-token.js admin admin');
}

/**
 * Extrae información básica de la URL de GitHub
 */
function extractRepoInfo(url) {
    // Extraer usuario y nombre del repositorio de la URL
    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) {
        throw new Error('URL de GitHub no válida');
    }
    
    const [, username, repo] = match;
    const repoName = repo.replace(/-/g, ' ');
    
    return {
        id: `github-${username}-${repo}`.toLowerCase().substring(0, 30),
        title: `${repoName} por ${username}`,
        description: `Repositorio GitHub: ${repoName} creado por ${username}`,
        url: url,
        tags: ['github', repo, username],
        username,
        repo
    };
}

/**
 * Descarga el avatar del usuario de GitHub para usarlo como miniatura
 */
async function downloadUserAvatar(username, outputPath) {
    try {
        console.log(`Descargando avatar de ${username}...`);
        
        // Obtener información del usuario
        const userResponse = await axios.get(`https://api.github.com/users/${username}`);
        const avatarUrl = userResponse.data.avatar_url;
        
        if (!avatarUrl) {
            throw new Error('No se encontró avatar del usuario');
        }
        
        // Descargar imagen
        const imageResponse = await axios({
            url: avatarUrl,
            method: 'GET',
            responseType: 'stream'
        });
        
        const writer = fs.createWriteStream(outputPath);
        imageResponse.data.pipe(writer);
        
        return new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });
    } catch (error) {
        console.error('Error descargando avatar:', error.message);
        throw error;
    }
}

/**
 * Crea un proyecto en la API
 */
async function createProject(projectData, imagePath) {
    try {
        console.log('Creando proyecto en la API...');
        
        const formData = new FormData();
        formData.append('id', projectData.id);
        formData.append('title', projectData.title);
        formData.append('url', projectData.url);
        formData.append('description', projectData.description);
        formData.append('tags', JSON.stringify(projectData.tags));
        
        // Añadir imagen
        if (imagePath) {
            formData.append('thumbnail', fs.createReadStream(imagePath));
        }
        
        // Añadir token de autenticación si está disponible
        const headers = {
            ...formData.getHeaders()
        };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        console.log(`Enviando datos a: ${CONFIG.apiUrl}/api/projects`);
        const response = await axios.post(`${CONFIG.apiUrl}/api/projects`, formData, { headers });
        
        return response.data;
    } catch (error) {
        console.error('Error creando proyecto:', error.response?.data || error.message);
        throw error;
    }
}

/**
 * Función principal
 */
async function main() {
    let tempImagePath = null;
    
    try {
        // Extraer información básica del repositorio
        const repoInfo = extractRepoInfo(githubUrl);
        console.log('Información extraída del repositorio:', repoInfo);
        
        // Crear directorio temporal si no existe
        const tempDir = path.join(__dirname, 'temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir);
        }
        
        // Descargar avatar del usuario como miniatura
        tempImagePath = path.join(tempDir, `${repoInfo.id}.jpg`);
        await downloadUserAvatar(repoInfo.username, tempImagePath);
        
        // Crear proyecto en la API
        const result = await createProject(repoInfo, tempImagePath);
        console.log('Proyecto creado exitosamente:', result);
    } catch (error) {
        console.error('Error en el proceso:', error);
        process.exit(1);
    } finally {
        // Limpiar archivos temporales
        if (tempImagePath && fs.existsSync(tempImagePath)) {
            fs.unlinkSync(tempImagePath);
        }
    }
}

main();
