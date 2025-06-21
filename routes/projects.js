const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Project = require('../models/Project');
const auth = require('../middleware/auth');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'public/img/projects/');
    },
    filename: function(req, file, cb) {
        cb(null, file.originalname);
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

// Create new project (protected route)
router.post('/', auth, upload.single('thumbnail'), async (req, res) => {
    try {
        const project = new Project({
            id: req.body.id,
            title: req.body.title,
            url: req.body.url,
            thumbnail: `img/projects/${req.file.filename}`,
            description: req.body.description,
            tags: JSON.parse(req.body.tags)
        });

        const newProject = await project.save();
        res.status(201).json(newProject);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Update project (protected route)
router.put('/:id', auth, upload.single('thumbnail'), async (req, res) => {
    try {
        const project = await Project.findOne({ id: req.params.id });
        
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        project.title = req.body.title || project.title;
        project.url = req.body.url || project.url;
        if (req.file) {
            project.thumbnail = `img/projects/${req.file.filename}`;
        }
        project.description = req.body.description || project.description;
        if (req.body.tags) {
            project.tags = JSON.parse(req.body.tags);
        }
        project.updatedAt = Date.now();

        const updatedProject = await project.save();
        res.json(updatedProject);
    } catch (error) {
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
