const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Project = require('../models/Project');
const auth = require('../middleware/auth');

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

// Create new project (protected route)
router.post('/', auth, upload.single('thumbnail'), async (req, res) => {
    try {
        console.log('Recibiendo solicitud para crear proyecto:', req.body);
        console.log('Archivo recibido:', req.file);
        
        // Validar campos requeridos
        if (!req.body.id || !req.body.title || !req.body.url || !req.body.description) {
            return res.status(400).json({ message: 'Faltan campos requeridos: id, title, url, description' });
        }
        
        // Si estamos en modo local pero usando la base de datos remota, permitir proyectos sin thumbnail
        let thumbnailPath = '';
        
        if (req.file) {
            thumbnailPath = `img/projects/${req.file.filename}`;
            console.log('Thumbnail guardado en:', thumbnailPath);
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

// Update project (protected route)
router.put('/:id', auth, upload.single('thumbnail'), async (req, res) => {
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
        
        // Actualizar thumbnail solo si se subió un nuevo archivo
        if (req.file) {
            const thumbnailPath = `img/projects/${req.file.filename}`;
            console.log('Actualizando thumbnail a:', thumbnailPath);
            project.thumbnail = thumbnailPath;
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

// Delete project (protected route)
router.delete('/:id', auth, async (req, res) => {
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
