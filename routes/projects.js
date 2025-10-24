const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Project = require('../models/Project');
const https = require('https');
const http = require('http');
const fs = require('fs');

// Handle preflight requests for CORS
router.options('*', (req, res) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.sendStatus(200);
});

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        // Usar ruta absoluta para garantizar que funcione en cualquier entorno
        const uploadPath = path.join(__dirname, '../public/img/projects/');
        console.log('Ruta de upload:', uploadPath);
        
        // Asegurarse de que la ruta existe
        const fs = require('fs');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
            console.log('Directorio de uploads creado:', uploadPath);
        }
        
        cb(null, uploadPath);
    },
    filename: function(req, file, cb) {
        // Generar un nombre único para evitar colisiones
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname) || '.jpg';
        const filename = file.fieldname + '-' + uniqueSuffix + extension;
        console.log('Nombre de archivo generado:', filename);
        cb(null, filename);
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|webp/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb('Error: Images only!');
        }
    }
});

// Función para descargar thumbnail desde URL
async function downloadThumbnail(url, filename) {
    return new Promise((resolve, reject) => {
        const uploadPath = path.join(__dirname, '../public/img/projects/');
        const filepath = path.join(uploadPath, filename);
        
        // Asegurarse de que el directorio existe
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        
        const protocol = url.startsWith('https') ? https : http;
        
        const request = protocol.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        }, (response) => {
            // Seguir redirects
            if (response.statusCode === 301 || response.statusCode === 302) {
                downloadThumbnail(response.headers.location, filename)
                    .then(resolve)
                    .catch(reject);
                return;
            }
            
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to download: ${response.statusCode}`));
                return;
            }
            
            const fileStream = fs.createWriteStream(filepath);
            response.pipe(fileStream);
            
            fileStream.on('finish', () => {
                fileStream.close();
                resolve(filename);
            });
            
            fileStream.on('error', (err) => {
                fs.unlink(filepath, () => {});
                reject(err);
            });
        });
        
        request.on('error', (err) => {
            reject(err);
        });
        
        request.setTimeout(10000, () => {
            request.destroy();
            reject(new Error('Request timeout'));
        });
    });
}

// Función para extraer thumbnail de YouTube
function getYoutubeThumbnailUrl(videoUrl) {
    const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]+)/;
    const match = videoUrl.match(youtubeRegex);
    if (match && match[1]) {
        return `https://img.youtube.com/vi/${match[1]}/maxresdefault.jpg`;
    }
    return null;
}

// Función para extraer thumbnail de Instagram mediante scraping
async function getInstagramThumbnailUrl(videoUrl) {
    const instagramRegex = /(?:https?:\/\/)?(?:www\.)?instagram\.com\/(p|reel|tv)\/([a-zA-Z0-9_-]+)\/?/;
    const match = videoUrl.match(instagramRegex);
    if (!match) return null;
    
    try {
        // Hacer request a la página de Instagram
        const cleanUrl = `https://www.instagram.com/${match[1]}/${match[2]}/`;
        
        return new Promise((resolve, reject) => {
            https.get(cleanUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1'
                }
            }, (response) => {
                let data = '';
                
                response.on('data', (chunk) => {
                    data += chunk;
                });
                
                response.on('end', () => {
                    try {
                        // Buscar la URL del thumbnail en el HTML
                        // Instagram incluye metadata de Open Graph con la imagen
                        const ogImageMatch = data.match(/<meta property="og:image" content="([^"]+)"/);
                        if (ogImageMatch && ogImageMatch[1]) {
                            resolve(ogImageMatch[1]);
                        } else {
                            // Intentar buscar en el JSON embebido
                            const jsonMatch = data.match(/<script type="application\/ld\+json">({[^<]+})<\/script>/);
                            if (jsonMatch) {
                                const jsonData = JSON.parse(jsonMatch[1]);
                                if (jsonData.image) {
                                    resolve(jsonData.image);
                                } else {
                                    reject(new Error('No se encontró thumbnail en el JSON'));
                                }
                            } else {
                                reject(new Error('No se encontró thumbnail en el HTML'));
                            }
                        }
                    } catch (error) {
                        reject(error);
                    }
                });
            }).on('error', (error) => {
                reject(error);
            });
        });
    } catch (error) {
        console.error('Error al extraer thumbnail de Instagram:', error);
        return null;
    }
}

// Get all projects
router.get('/', async (req, res) => {
    try {
        const projects = await Project.find().sort({ createdAt: -1 });
        res.json(projects);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get project by ID
router.get('/:id', async (req, res) => {
    try {
        const project = await Project.findOne({ id: req.params.id });
        
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }
        
        res.json(project);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create new project (sin autenticación)
router.post('/', upload.single('thumbnail'), async (req, res) => {
    try {
        console.log('=== INICIO CREACIÓN DE PROYECTO ===');
        console.log('Recibiendo solicitud para crear proyecto:', req.body);
        console.log('Archivo recibido:', req.file);
        console.log('Video link:', req.body.videolink);
        
        // Validar campos requeridos
        if (!req.body.id || !req.body.title || !req.body.url || !req.body.description) {
            return res.status(400).json({ message: 'Faltan campos requeridos: id, title, url, description' });
        }
        
        // Manejar thumbnail
        let thumbnailPath = '';
        
        if (req.file) {
            // Thumbnail subido manualmente
            thumbnailPath = `img/projects/${req.file.filename}`;
            console.log('Thumbnail guardado en:', thumbnailPath);
        } else if (req.body.videolink) {
            // Intentar descargar thumbnail automáticamente desde el video
            let thumbnailUrl = null;
            
            // Intentar YouTube
            thumbnailUrl = getYoutubeThumbnailUrl(req.body.videolink);
            
            // Si no es YouTube, intentar Instagram
            if (!thumbnailUrl) {
                console.log('No es YouTube, intentando Instagram...');
                thumbnailUrl = await getInstagramThumbnailUrl(req.body.videolink);
                console.log('URL de Instagram obtenida:', thumbnailUrl);
            }
            
            if (thumbnailUrl) {
                try {
                    const filename = `auto-thumb-${req.body.id}-${Date.now()}.jpg`;
                    await downloadThumbnail(thumbnailUrl, filename);
                    thumbnailPath = `img/projects/${filename}`;
                    console.log('Thumbnail descargado automáticamente:', thumbnailPath);
                } catch (error) {
                    console.error('Error al descargar thumbnail:', error);
                    thumbnailPath = 'img/projects/babylon2.png';
                    console.log('Usando thumbnail por defecto debido a error');
                }
            } else {
                thumbnailPath = 'img/projects/babylon2.png';
                console.log('No se pudo extraer URL de thumbnail, usando predeterminado');
            }
        } else {
            // Usar un thumbnail existente como predeterminado
            thumbnailPath = 'img/projects/babylon2.png';
            console.log('Usando thumbnail por defecto:', thumbnailPath);
        }
        
        let parsedTags = [];
        try {
            parsedTags = JSON.parse(req.body.tags || '[]');
        } catch (e) {
            console.error('Error al parsear tags:', e);
            if (req.body.tags) {
                parsedTags = req.body.tags.split(',').map(tag => tag.trim());
            }
        }
        
        const project = new Project({
            id: req.body.id,
            title: req.body.title,
            url: req.body.url,
            videolink: req.body.videolink || '',
            thumbnail: thumbnailPath,
            description: req.body.description,
            tags: parsedTags
        });

        const newProject = await project.save();
        res.status(201).json(newProject);
    } catch (error) {
        console.error('Error al guardar proyecto:', error);
        res.status(400).json({ message: error.message });
    }
});

// Update project (sin autenticación)
router.put('/:id', upload.single('thumbnail'), async (req, res) => {
    try {
        console.log('Recibiendo solicitud para actualizar proyecto:', req.params.id);
        console.log('Datos recibidos:', req.body);
        console.log('Archivo recibido:', req.file);
        
        const project = await Project.findOne({ id: req.params.id });
        
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        project.title = req.body.title || project.title;
        project.url = req.body.url || project.url;
        project.videolink = req.body.videolink !== undefined ? req.body.videolink : project.videolink;
        
        // Actualizar thumbnail
        if (req.file) {
            // Thumbnail subido manualmente
            const thumbnailPath = `img/projects/${req.file.filename}`;
            console.log('Actualizando thumbnail a:', thumbnailPath);
            project.thumbnail = thumbnailPath;
        } else if (req.body.videolink && !req.file) {
            // Si hay videolink pero no se subió thumbnail, intentar descargar automáticamente
            let thumbnailUrl = null;
            
            // Intentar YouTube
            thumbnailUrl = getYoutubeThumbnailUrl(req.body.videolink);
            
            // Si no es YouTube, intentar Instagram
            if (!thumbnailUrl) {
                console.log('No es YouTube, intentando Instagram...');
                thumbnailUrl = await getInstagramThumbnailUrl(req.body.videolink);
                console.log('URL de Instagram obtenida:', thumbnailUrl);
            }
            
            if (thumbnailUrl) {
                try {
                    const filename = `auto-thumb-${req.params.id}-${Date.now()}.jpg`;
                    await downloadThumbnail(thumbnailUrl, filename);
                    project.thumbnail = `img/projects/${filename}`;
                    console.log('Thumbnail descargado automáticamente:', project.thumbnail);
                } catch (error) {
                    console.error('Error al descargar thumbnail:', error);
                    console.log('Manteniendo thumbnail existente');
                }
            }
        }
        
        project.description = req.body.description || project.description;
        if (req.body.tags) {
            try {
                project.tags = JSON.parse(req.body.tags);
            } catch (e) {
                console.error('Error al parsear tags:', e);
                project.tags = req.body.tags.split(',').map(tag => tag.trim());
            }
        }
        project.updatedAt = Date.now();

        const updatedProject = await project.save();
        res.json(updatedProject);
    } catch (error) {
        console.error('Error al actualizar proyecto:', error);
        res.status(400).json({ message: error.message });
    }
});

// Delete project (sin autenticación)
router.delete('/:id', async (req, res) => {
    try {
        const project = await Project.findOne({ id: req.params.id });
        
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        await project.deleteOne();
        res.json({ message: 'Project deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
