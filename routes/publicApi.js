const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const Budget = require('../models/Budget');
const apiKeyAuth = require('../middleware/apiKeyAuth');

// Apply API Key auth to all routes in this router
router.use(apiKeyAuth);

// ==================== PROJECTS ====================

// GET /api/public/projects - Get all projects
router.get('/projects', async (req, res) => {
    try {
        const projects = await Project.find().sort({ createdAt: -1 });
        res.json({
            success: true,
            count: projects.length,
            projects: projects
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET /api/public/projects/:id - Get project by ID
router.get('/projects/:id', async (req, res) => {
    try {
        const project = await Project.findOne({ id: req.params.id });
        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }
        res.json({ success: true, project: project });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST /api/public/projects - Create new project
router.post('/projects', async (req, res) => {
    try {
        const project = new Project(req.body);
        const newProject = await project.save();
        res.status(201).json({ success: true, project: newProject });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// PUT /api/public/projects/:id - Update project
router.put('/projects/:id', async (req, res) => {
    try {
        const project = await Project.findOne({ id: req.params.id });
        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        Object.assign(project, req.body);
        project.updatedAt = Date.now();
        
        const updatedProject = await project.save();
        res.json({ success: true, project: updatedProject });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// DELETE /api/public/projects/:id - Delete project
router.delete('/projects/:id', async (req, res) => {
    try {
        const project = await Project.findOne({ id: req.params.id });
        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }
        await project.deleteOne();
        res.json({ success: true, message: 'Project deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ==================== BUDGETS ====================

// GET /api/public/budgets - Get all budgets
router.get('/budgets', async (req, res) => {
    try {
        const budgets = await Budget.find().sort({ createdAt: -1 });
        res.json({
            success: true,
            count: budgets.length,
            budgets: budgets
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET /api/public/budgets/:idOrCode - Get budget by ID or Code
router.get('/budgets/:idOrCode', async (req, res) => {
    try {
        let budget = await Budget.findOne({ code: req.params.idOrCode.toUpperCase() });
        if (!budget && req.params.idOrCode.match(/^[0-9a-fA-F]{24}$/)) {
            budget = await Budget.findById(req.params.idOrCode);
        }
        
        if (!budget) {
            return res.status(404).json({ success: false, message: 'Budget not found' });
        }
        res.json({ success: true, budget: budget });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST /api/public/budgets - Create new budget
router.post('/budgets', async (req, res) => {
    try {
        const data = req.body;
        
        // Generate code if not provided
        if (!data.code) {
            data.code = await Budget.generateCode();
        }

        // Default Payment Terms
        if (!data.paymentTerms || data.paymentTerms.trim() === '') {
            data.paymentTerms = '4. CONDICIONES DE PAGO Y FACTURACIÓN\nMedios de Pago: Se acepta Factura C, Criptomonedas, Dólares (efectivo/transferencia) o Pesos.\nCotización: Para pagos en pesos, se tomará la cotización del dólar del día en que se realice la inversión inicial.\nMora en el Pago: Una vez realizada la entrega final, el cliente dispone de 15 días corridos para cancelar el saldo. Pasado ese período, se aplicará un recargo del 10% sobre el presupuesto total por demora.';
        }

        // Enrich references from database if only IDs are provided or for accuracy
        if (data.references && Array.isArray(data.references)) {
            for (let i = 0; i < data.references.length; i++) {
                const ref = data.references[i];
                if (ref.id) {
                    const project = await Project.findOne({ id: ref.id });
                    if (project) {
                        data.references[i] = {
                            id: project.id,
                            title: project.title,
                            url: project.url || (project.videolink || ''),
                            thumbnail: project.thumbnail || ''
                        };
                    }
                }
            }
        }

        // Calculate totals if items are provided
        if (data.items && Array.isArray(data.items)) {
            let total = 0;
            data.items.forEach(item => {
                if (!item.total) {
                    item.total = (item.quantity || 1) * (item.unitPrice || 0);
                }
                total += item.total;
            });
            data.subtotal = total;
            data.total = total;
        } else {
            data.items = [];
            data.subtotal = data.subtotal || 0;
            data.total = data.total || 0;
        }

        const budget = new Budget(data);
        const newBudget = await budget.save();
        res.status(201).json({ success: true, budget: newBudget });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// PUT /api/public/budgets/:id - Update budget
router.put('/budgets/:id', async (req, res) => {
    try {
        const budget = await Budget.findById(req.params.id);
        if (!budget) {
            return res.status(404).json({ success: false, message: 'Budget not found' });
        }

        const data = req.body;

        // Enrich references from database
        if (data.references && Array.isArray(data.references)) {
            for (let i = 0; i < data.references.length; i++) {
                const ref = data.references[i];
                if (ref.id) {
                    const project = await Project.findOne({ id: ref.id });
                    if (project) {
                        data.references[i] = {
                            id: project.id,
                            title: project.title,
                            url: project.url || (project.videolink || ''),
                            thumbnail: project.thumbnail || ''
                        };
                    }
                }
            }
        }

        // Recalculate totals if items are updated
        if (data.items && Array.isArray(data.items)) {
            let total = 0;
            data.items.forEach(item => {
                if (!item.total) {
                    item.total = (item.quantity || 1) * (item.unitPrice || 0);
                }
                total += item.total;
            });
            data.subtotal = total;
            data.total = total;
        }

        Object.assign(budget, data);
        budget.updatedAt = Date.now();
        
        const updatedBudget = await budget.save();
        res.json({ success: true, budget: updatedBudget });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// DELETE /api/public/budgets/:id - Delete budget
router.delete('/budgets/:id', async (req, res) => {
    try {
        const budget = await Budget.findById(req.params.id);
        if (!budget) {
            return res.status(404).json({ success: false, message: 'Budget not found' });
        }
        await budget.deleteOne();
        res.json({ success: true, message: 'Budget deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
