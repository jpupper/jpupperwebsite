/**
 * Script para extraer información de una URL y crear un proyecto en la base de datos
 * Uso: node url-to-project.js <URL>
 */

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const { v4: uuidv4 } = require('uuid');
const CONFIG = require('../public/js/config');

// Verificar argumentos
if (process.argv.length < 3) {
    console.error('Por favor proporciona una URL');
    console.error('Uso: node url-to-project.js <URL>');
    process.exit(1);
}

const url = process.argv[2];
console.log(`Procesando URL: ${url}`);

/**
 * Extrae metadatos de una URL
 */
async function extractMetadata(url) {
    try {
        console.log('Extrayendo metadatos...');
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);
        
        // Extraer información básica
        const title = $('title').text() || $('meta[property="og:title"]').attr('content') || path.basename(url);
        const description = $('meta[name="description"]').attr('content') || 
                           $('meta[property="og:description"]').attr('content') || 
                           'No description available';
        
        // Buscar imagen principal
        let imageUrl = $('meta[property="og:image"]').attr('content');
        if (!imageUrl) {
            // Buscar la primera imagen grande en la página
            $('img').each((i, img) => {
                const src = $(img).attr('src');
                if (src && !imageUrl) {
                    imageUrl = src;
                }
            });
        }
        
        // Normalizar URL de imagen si es relativa
        if (imageUrl && !imageUrl.startsWith('http')) {
            const urlObj = new URL(url);
            imageUrl = imageUrl.startsWith('/') 
                ? `${urlObj.protocol}//${urlObj.host}${imageUrl}`
                : `${urlObj.protocol}//${urlObj.host}/${imageUrl}`;
        }
        
        // Extraer posibles tags
        const keywords = $('meta[name="keywords"]').attr('content');
        const tags = keywords ? keywords.split(',').map(tag => tag.trim()) : [];
        
        // Buscar posible URL de video
        let videoUrl = $('meta[property="og:video"]').attr('content');
        
        return {
            title,
            description,
            url,
            imageUrl,
            tags,
            videoUrl
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
        
        if (projectData.videoUrl) {
            formData.append('videolink', projectData.videoUrl);
        }
        
        if (imagePath) {
            formData.append('thumbnail', fs.createReadStream(imagePath));
        }
        
        const apiUrl = CONFIG.apiUrl;
        console.log(`Enviando datos a: ${apiUrl}/api/projects`);
        
        const response = await axios.post(`${apiUrl}/api/projects`, formData, {
            headers: {
                ...formData.getHeaders()
            }
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
        // Extraer metadatos de la URL
        const metadata = await extractMetadata(url);
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
            tags: metadata.tags,
            videoUrl: metadata.videoUrl
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
