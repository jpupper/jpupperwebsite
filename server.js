const express = require('express');
const app = express();
const http = require('http').createServer(app);
const path = require('path');
const cors = require('cors');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');

// Import config
const config = require('./config/database');

// Set port for the application
const PORT = process.env.PORT || 3243;

// Middlewares
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve static files with path prefix /jpupper for production and directly for local development
app.use('/jpupper', express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public'))); // Mantener compatibilidad con rutas sin prefijo

// Routes with both prefixed and non-prefixed paths for compatibility
// Rutas con prefijo /jpupper para producción
app.use('/jpupper/api/auth', require('./routes/auth'));
app.use('/jpupper/api/projects', require('./routes/projects'));
app.use('/jpupper/api/tags', require('./routes/tags'));
app.use('/jpupper/api/budgets', require('./routes/budgets'));

// Rutas sin prefijo para desarrollo local y compatibilidad
app.use('/api/auth', require('./routes/auth'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/tags', require('./routes/tags'));
app.use('/api/budgets', require('./routes/budgets'));

// Export routes without authentication (if needed)
app.get('/jpupper/api/export/projects', async (req, res) => {
    try {
        const Project = mongoose.model('Project');
        const projects = await Project.find();
        
        res.json({
            success: true,
            timestamp: new Date(),
            projects: projects
        });
    } catch (error) {
        console.error('Error exporting projects:', error);
        res.status(500).json({ success: false, message: 'Error exporting projects' });
    }
});

// También exponer la ruta sin prefijo para compatibilidad
app.get('/api/export/projects', async (req, res) => {
    try {
        const Project = mongoose.model('Project');
        const projects = await Project.find();
        
        res.json({
            success: true,
            timestamp: new Date(),
            projects: projects
        });
    } catch (error) {
        console.error('Error exporting projects:', error);
        res.status(500).json({ success: false, message: 'Error exporting projects' });
    }
});

// Main route for /jpupper
app.get('/jpupper', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Main route without prefix for local development
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Catch-all route for /jpupper/* to handle client-side routing
app.get('/jpupper/*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Catch-all route for /* to handle client-side routing in local development
app.get('*', (req, res) => {
    // Evitar conflictos con rutas API
    if (!req.path.startsWith('/api/') && !req.path.startsWith('/jpupper/')) {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    }
});

// Start server
async function startServer() {
    try {
        // Connect to MongoDB
        await mongoose.connect(config.mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to MongoDB');

        // Start HTTP server
        http.listen(PORT, () => {
            console.log('\n===========================================');
            console.log(`✅ Server running on port ${PORT}`);
            console.log('===========================================\n');
            
            console.log('📍 ADMIN PANEL:');
            console.log(`   http://localhost:${PORT}/admin`);
            console.log(`   http://localhost:${PORT}/jpupper/admin\n`);
            
            console.log('🔗 API ROUTES (LOCAL):');
            console.log(`   GET    http://localhost:${PORT}/api/projects`);
            console.log(`   POST   http://localhost:${PORT}/api/projects`);
            console.log(`   GET    http://localhost:${PORT}/api/tags`);
            console.log(`   POST   http://localhost:${PORT}/api/tags`);
            console.log(`   GET    http://localhost:${PORT}/api/budgets`);
            console.log(`   POST   http://localhost:${PORT}/api/budgets`);
            console.log(`   GET    http://localhost:${PORT}/api/budgets/:id`);
            console.log(`   PUT    http://localhost:${PORT}/api/budgets/:id`);
            console.log(`   DELETE http://localhost:${PORT}/api/budgets/:id\n`);
            
            console.log('🔗 API ROUTES (CON PREFIJO /jpupper):');
            console.log(`   GET    http://localhost:${PORT}/jpupper/api/projects`);
            console.log(`   POST   http://localhost:${PORT}/jpupper/api/projects`);
            console.log(`   GET    http://localhost:${PORT}/jpupper/api/tags`);
            console.log(`   POST   http://localhost:${PORT}/jpupper/api/tags`);
            console.log(`   GET    http://localhost:${PORT}/jpupper/api/budgets`);
            console.log(`   POST   http://localhost:${PORT}/jpupper/api/budgets`);
            console.log(`   GET    http://localhost:${PORT}/jpupper/api/budgets/:id`);
            console.log(`   PUT    http://localhost:${PORT}/jpupper/api/budgets/:id`);
            console.log(`   DELETE http://localhost:${PORT}/jpupper/api/budgets/:id\n`);
            
            console.log('===========================================\n');
            
            const isLocal = ['localhost', '127.0.0.1'].includes(require('os').hostname());
            if (!isLocal) {
                console.log(`VPS: https://vps-4455523-x.dattaweb.com/jpupper`);
            }
        });
    } catch (error) {
        console.error('Error starting server:', error);
        process.exit(1);
    }
}

startServer();
