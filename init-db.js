/**
 * Script para inicializar la base de datos
 * Este script verifica la conexión a MongoDB y crea las colecciones necesarias para el proyecto
 */

const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// Importar la configuración de la base de datos
let config;
try {
    config = require('./config/database');
    console.log('Configuración de base de datos cargada correctamente');
} catch (error) {
    console.error('Error al cargar la configuración de la base de datos:', error);
    process.exit(1);
}

// Intentar importar el modelo Project directamente
let Project;
try {
    // Verificar si el archivo existe
    const modelPath = path.join(__dirname, 'models', 'Project.js');
    if (fs.existsSync(modelPath)) {
        console.log('Archivo de modelo Project encontrado');
        Project = require('./models/Project');
        console.log('Modelo Project importado correctamente');
    } else {
        console.log('Archivo de modelo Project no encontrado, se usará un esquema temporal');
        // Definir el esquema del proyecto si no existe el archivo
        const projectSchema = new mongoose.Schema({
            id: { type: String, required: true, unique: true },
            title: { type: String, required: true },
            url: { type: String },
            videolink: { type: String },
            thumbnail: { type: String },
            description: { type: String },
            tags: [{ type: String }],
            createdAt: { type: Date, default: Date.now },
            updatedAt: { type: Date, default: Date.now }
        });
        Project = mongoose.model('Project', projectSchema);
    }
} catch (error) {
    console.error('Error al importar el modelo Project:', error);
    console.log('Intentando definir el modelo manualmente...');
    
    // Definir el esquema del proyecto como fallback
    try {
        const projectSchema = new mongoose.Schema({
            id: { type: String, required: true, unique: true },
            title: { type: String, required: true },
            url: { type: String },
            videolink: { type: String },
            thumbnail: { type: String },
            description: { type: String },
            tags: [{ type: String }],
            createdAt: { type: Date, default: Date.now },
            updatedAt: { type: Date, default: Date.now }
        });
        Project = mongoose.model('Project', projectSchema);
    } catch (modelError) {
        console.error('Error al definir el modelo Project:', modelError);
        process.exit(1);
    }
}

async function initializeDatabase() {
    let connection = null;
    try {
        // Conectar a MongoDB
        console.log('Conectando a MongoDB...');
        console.log(`URI: ${config.mongoURI}`);
        
        connection = await mongoose.connect(config.mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        console.log('Conexión a MongoDB establecida');

        // Verificar si hay proyectos en la base de datos
        const projectCount = await Project.countDocuments();
        console.log(`Número de proyectos en la base de datos: ${projectCount}`);

        // Verificar las colecciones existentes
        const collections = await connection.connection.db.listCollections().toArray();
        console.log('Colecciones en la base de datos:');
        collections.forEach(collection => {
            console.log(`- ${collection.name}`);
        });

        console.log('Inicialización de la base de datos completada con éxito');
    } catch (error) {
        console.error('Error inicializando la base de datos:', error);
        process.exit(1);
    } finally {
        // Cerrar la conexión si existe
        if (connection) {
            await mongoose.connection.close();
            console.log('Conexión a MongoDB cerrada');
        }
        process.exit(0);
    }
}

// Ejecutar la función de inicialización
initializeDatabase();
