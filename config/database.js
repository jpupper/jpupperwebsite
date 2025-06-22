// Detectar si estamos en entorno local o de producción
const isLocal = ['localhost', '127.0.0.1'].includes(require('os').hostname());

module.exports = {
    // En producción, usar la configuración para el VPS
    // En local, usar la configuración local
    mongoURI: isLocal 
        ? 'mongodb://localhost:27017/jpupper' 
        : 'mongodb://127.0.0.1:27017/jpupper',
    jwtSecret: 'jpupper_secret_key_2024'
};
