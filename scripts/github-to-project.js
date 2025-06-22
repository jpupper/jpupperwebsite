/**
 * Script para extraer información de un repositorio GitHub y crear un proyecto en la base de datos
 * Uso: node github-to-project.js <URL_GITHUB>
 */

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const { v4: uuidv4 } = require('uuid');

// Cargar configuración
// Configuración
const CONFIG = {
    apiUrl: 'http://localhost:3243',
    isLocal: true
};

// También se puede usar la URL del VPS cambiando esta variable a true
const USE_VPS = false;

if (USE_VPS) {
    CONFIG.apiUrl = 'https://vps-4455523-x.dattaweb.com/jpupper';
    CONFIG.isLocal = false;
}

// Token de autenticación (deberías obtener este token después de iniciar sesión)
let AUTH_TOKEN = '';

// Verificar si se proporcionó un token como segundo argumento
if (process.argv.length >= 4) {
    AUTH_TOKEN = process.argv[3];
    console.log('Token de autenticación proporcionado');
} else {
    console.warn('ADVERTENCIA: No se proporcionó token de autenticación. Intenta con: node github-to-project.js <URL_GITHUB> <TOKEN>');
}

// Verificar argumentos
if (process.argv.length < 3) {
    console.error('Por favor proporciona una URL de GitHub');
    console.error('Uso: node github-to-project.js <URL_GITHUB>');
    process.exit(1);
}

const url = process.argv[2];
if (!url.includes('github.com')) {
    console.error('La URL debe ser de un repositorio GitHub');
    process.exit(1);
}

console.log(`Procesando repositorio GitHub: ${url}`);

/**
 * Extrae metadatos de un repositorio GitHub
 */
async function extractGitHubMetadata(url) {
    try {
        console.log('Extrayendo metadatos del repositorio...');
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);
        
        // Extraer información básica
        const title = $('h1 strong a').text().trim() || $('title').text().split('/').pop().trim();
        
        // Extraer descripción
        let description = $('.f4.my-3').text().trim();
        if (!description) {
            // Intentar obtener del README
            const readmeContent = $('#readme article').text().trim();
            description = readmeContent.substring(0, 300) + (readmeContent.length > 300 ? '...' : '');
        }
        
        // Si aún no hay descripción, usar una genérica
        if (!description) {
            description = `Repositorio GitHub: ${title}`;
        }
        
        // Extraer lenguajes de programación como tags
        const tags = [];
        $('.d-inline .list-style-none li span').each((i, el) => {
            const lang = $(el).text().trim();
            if (lang) tags.push(lang);
        });
        
        // Añadir tags adicionales basados en el nombre del repo
        const repoNameParts = title.toLowerCase().split(/[-_]/);
        repoNameParts.forEach(part => {
            if (part.length > 2 && !tags.includes(part)) {
                tags.push(part);
            }
        });
        
        // Buscar imagen (captura de pantalla del README)
        let imageUrl = '';
        $('#readme img').each((i, img) => {
            const src = $(img).attr('src');
            if (src && !imageUrl) {
                imageUrl = src;
            }
        });
        
        // Si no hay imagen en el README, usar el avatar del usuario
        if (!imageUrl) {
            imageUrl = $('.avatar').attr('src');
        }
        
        // Extraer fecha de última actualización
        const updatedAt = $('.commit-tease relative-time').attr('datetime') || new Date().toISOString();
        
        return {
            title,
            description,
            url,
            imageUrl,
            tags: [...new Set(tags)], // Eliminar duplicados
            updatedAt
        };
    } catch (error) {
        console.error('Error extrayendo metadatos:', error.message);
        throw error;
    }
}

/**
 * Descarga una imagen desde una URL
 */
async function downloadImage(url, filename) {
    try {
        console.log(`Descargando imagen desde ${url}...`);
        const response = await axios({
            url,
            method: 'GET',
            responseType: 'stream'
        });
        
        const writer = fs.createWriteStream(filename);
        response.data.pipe(writer);
        
        return new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });
    } catch (error) {
        console.error('Error descargando imagen:', error.message);
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
        
        if (imagePath) {
            formData.append('thumbnail', fs.createReadStream(imagePath));
        }
        
        const apiUrl = CONFIG.apiUrl;
        console.log(`Enviando datos a: ${apiUrl}/api/projects`);
        
        // Añadir token de autenticación si está disponible
        const headers = {
            ...formData.getHeaders()
        };
        
        if (AUTH_TOKEN) {
            headers['Authorization'] = `Bearer ${AUTH_TOKEN}`;
        }
        
        const response = await axios.post(`${apiUrl}/api/projects`, formData, {
            headers
        });
        
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
        // Extraer metadatos del repositorio GitHub
        const metadata = await extractGitHubMetadata(url);
        console.log('Metadatos extraídos:', metadata);
        
        // Generar ID único para el proyecto
        const projectId = metadata.title
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '')
            .substring(0, 20) + '-' + uuidv4().substring(0, 8);
        
        // Descargar imagen si está disponible
        if (metadata.imageUrl) {
            const tempDir = path.join(__dirname, 'temp');
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir);
            }
            
            const imageExt = path.extname(metadata.imageUrl) || '.jpg';
            tempImagePath = path.join(tempDir, `${projectId}${imageExt}`);
            await downloadImage(metadata.imageUrl, tempImagePath);
        }
        
        // Crear proyecto en la API
        const projectData = {
            id: projectId,
            title: metadata.title,
            url: metadata.url,
            description: metadata.description,
            tags: metadata.tags
        };
        
        const result = await createProject(projectData, tempImagePath);
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
