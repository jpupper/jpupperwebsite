const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const config = require('../config/database');

// Handle preflight requests for CORS
router.options('*', (req, res) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.sendStatus(200);
});

// Credenciales fijas
const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: 'admin'
};

// Login route
router.post('/login', (req, res) => {
    const { username, password } = req.body;
    
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
        // Generate token
        const token = jwt.sign(
            { username: username },
            config.jwtSecret,
            { expiresIn: '24h' }
        );

        res.json({ token });
    } else {
        res.status(401).json({ message: 'Authentication failed' });
    }
});

module.exports = router;
