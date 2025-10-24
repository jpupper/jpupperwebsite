const express = require('express');
const router = express.Router();
const Budget = require('../models/Budget');

// Get all budgets
router.get('/', async (req, res) => {
    try {
        const budgets = await Budget.find().sort({ createdAt: -1 });
        res.json(budgets);
    } catch (error) {
        console.error('Error fetching budgets:', error);
        res.status(500).json({ message: 'Error fetching budgets', error: error.message });
    }
});

// Get budget by code (public route)
router.get('/code/:code', async (req, res) => {
    try {
        const budget = await Budget.findOne({ code: req.params.code });
        if (!budget) {
            return res.status(404).json({ message: 'Budget not found' });
        }
        res.json(budget);
    } catch (error) {
        console.error('Error fetching budget:', error);
        res.status(500).json({ message: 'Error fetching budget', error: error.message });
    }
});

// Get budget by ID
router.get('/:id', async (req, res) => {
    try {
        const budget = await Budget.findById(req.params.id);
        if (!budget) {
            return res.status(404).json({ message: 'Budget not found' });
        }
        res.json(budget);
    } catch (error) {
        console.error('Error fetching budget:', error);
        res.status(500).json({ message: 'Error fetching budget', error: error.message });
    }
});

// Create new budget
router.post('/', async (req, res) => {
    try {
        const { projectName, description, client, paymentTerms, technicalRequirements, items, currency, references, images } = req.body;
        
        // Generate unique code
        let code;
        let isUnique = false;
        while (!isUnique) {
            code = Budget.generateCode();
            const existing = await Budget.findOne({ code });
            if (!existing) isUnique = true;
        }
        
        // Calculate totals
        let subtotal = 0;
        const processedItems = items.map(item => {
            const itemTotal = item.quantity * item.unitPrice;
            subtotal += itemTotal;
            return {
                ...item,
                total: itemTotal
            };
        });
        
        const budget = new Budget({
            code,
            projectName,
            description,
            client,
            paymentTerms,
            technicalRequirements,
            currency: currency || 'USD',
            references: Array.isArray(references) ? references : [],
            images: Array.isArray(images) ? images : [],
            items: processedItems,
            subtotal,
            total: subtotal
        });
        
        await budget.save();
        res.status(201).json(budget);
    } catch (error) {
        console.error('Error creating budget:', error);
        res.status(500).json({ message: 'Error creating budget', error: error.message });
    }
});

// Update budget
router.put('/:id', async (req, res) => {
    try {
        const { projectName, description, client, paymentTerms, technicalRequirements, items, currency, references, images } = req.body;
        
        // Calculate totals
        let subtotal = 0;
        const processedItems = items.map(item => {
            const itemTotal = item.quantity * item.unitPrice;
            subtotal += itemTotal;
            return {
                ...item,
                total: itemTotal
            };
        });
        
        const budget = await Budget.findByIdAndUpdate(
            req.params.id,
            {
                projectName,
                description,
                client,
                paymentTerms,
                technicalRequirements,
                currency: currency || 'USD',
                references: Array.isArray(references) ? references : [],
                images: Array.isArray(images) ? images : [],
                items: processedItems,
                subtotal,
                total: subtotal,
                updatedAt: Date.now()
            },
            { new: true }
        );
        
        if (!budget) {
            return res.status(404).json({ message: 'Budget not found' });
        }
        
        res.json(budget);
    } catch (error) {
        console.error('Error updating budget:', error);
        res.status(500).json({ message: 'Error updating budget', error: error.message });
    }
});

// Delete budget
router.delete('/:id', async (req, res) => {
    try {
        const budget = await Budget.findByIdAndDelete(req.params.id);
        if (!budget) {
            return res.status(404).json({ message: 'Budget not found' });
        }
        res.json({ message: 'Budget deleted successfully' });
    } catch (error) {
        console.error('Error deleting budget:', error);
        res.status(500).json({ message: 'Error deleting budget', error: error.message });
    }
});

module.exports = router;
