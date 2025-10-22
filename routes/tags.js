const express = require('express');
const router = express.Router();
const Tag = require('../models/Tag');

// Handle preflight requests for CORS
router.options('*', (req, res) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.sendStatus(200);
});

// Get all tags
router.get('/', async (req, res) => {
    try {
        const tags = await Tag.find().sort({ name: 1 });
        res.json(tags);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create new tag
router.post('/', async (req, res) => {
    try {
        console.log('Recibiendo solicitud para crear tag:', req.body);
        
        // Validar campos requeridos
        if (!req.body.name || !req.body.displayName) {
            return res.status(400).json({ message: 'Faltan campos requeridos: name, displayName' });
        }
        
        // Verificar si el tag ya existe
        const existingTag = await Tag.findOne({ name: req.body.name });
        if (existingTag) {
            return res.status(400).json({ message: 'El tag ya existe' });
        }
        
        const tag = new Tag({
            name: req.body.name,
            displayName: req.body.displayName
        });

        const newTag = await tag.save();
        res.status(201).json(newTag);
    } catch (error) {
        console.error('Error al guardar tag:', error);
        res.status(400).json({ message: error.message });
    }
});

// Update tag
router.put('/:id', async (req, res) => {
    try {
        console.log('Recibiendo solicitud para actualizar tag:', req.params.id);
        console.log('Datos recibidos:', req.body);
        
        const tag = await Tag.findById(req.params.id);
        
        if (!tag) {
            return res.status(404).json({ message: 'Tag not found' });
        }

        tag.name = req.body.name || tag.name;
        tag.displayName = req.body.displayName || tag.displayName;

        const updatedTag = await tag.save();
        res.json(updatedTag);
    } catch (error) {
        console.error('Error al actualizar tag:', error);
        res.status(400).json({ message: error.message });
    }
});

// Delete tag
router.delete('/:id', async (req, res) => {
    try {
        const tag = await Tag.findById(req.params.id);
        
        if (!tag) {
            return res.status(404).json({ message: 'Tag not found' });
        }

        await tag.deleteOne();
        res.json({ message: 'Tag deleted' });
    } catch (error) {
        console.error('Error al eliminar tag:', error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
