const CONFIG = {
    // Detectar automáticamente si estamos en local o VPS
    // Puede ser sobreescrito manualmente con setEnvironment()
    get isLocal() {
        const savedEnv = localStorage.getItem('adminEnvironment');
        if (savedEnv !== null) {
            return savedEnv === 'local';
        }
        return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    },
    
    setEnvironment(env) {
        localStorage.setItem('adminEnvironment', env);
        console.log(`Ambiente cambiado a: ${env}`);
        window.location.reload();
    },
    get apiUrl() {
        return this.isLocal ? 'http://localhost:3243' : 'https://vps-4455523-x.dattaweb.com/jpupper';
    },
    get frontendUrl() {
        return this.isLocal ? 'http://localhost:3243/jpupper' : 'https://vps-4455523-x.dattaweb.com/jpupper';
    },
    get basePath() {
        return '/jpupper';
    },
    getPath(path) {
        return `${this.basePath}${path}`;
    },
    getImagePath(imagePath) {
        // Handle both relative and absolute paths
        if (!imagePath) return '';
        
        // Si la ruta ya comienza con http o https, devolverla tal cual
        if (imagePath.startsWith('http')) return imagePath;
        
        // Asegurarse de que la ruta comience con una barra
        const normalizedPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
        
        // Codificar la URL para manejar espacios y caracteres especiales
        const encodedPath = encodeURI(normalizedPath);
        
        // En VPS las imágenes se sirven con el prefijo /jpupper
        // En local se sirven desde la raíz
        const baseUrl = this.isLocal ? 'http://localhost:3243' : 'https://vps-4455523-x.dattaweb.com/jpupper';
        return `${baseUrl}${encodedPath}`;
    }
};

// Para mantener compatibilidad con el código existente
window.appConfig = CONFIG;

// Función global para cambiar ambiente
window.switchEnvironment = function(env) {
    CONFIG.setEnvironment(env);
};
