// Load environment variables
require('dotenv').config();

// Detectar si estamos en entorno local o de producción
const isLocal = process.env.NODE_ENV !== 'production' && !['vps'].includes(process.env.NODE_ENV);

module.exports = {
    // Usar la URI de la base de datos de .env o valor por defecto
    mongoURI: process.env.MONGODB_URI || (isLocal 
        ? 'mongodb://localhost:27017/jpupper' 
        : 'mongodb://127.0.0.1:27017/jpupper'),
    jwtSecret: process.env.JWT_SECRET || 'jpupper_secret_key_2024',
    apiKey: process.env.API_KEY || 'jpupper_admin_api_key_2024_secret'
};
