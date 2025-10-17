const CONFIG = {
    isLocal: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
    
    get apiUrl() {
        return this.isLocal ? 'http://localhost:3243' : 'https://vps-4455523-x.dattaweb.com';
    },
    get frontendUrl() {
        return this.isLocal ? 'http://localhost:3243' : 'https://vps-4455523-x.dattaweb.com';
    },
    getImagePath(path) {
        // Handle both relative and absolute paths
        if (!path) return '';
        
        // Si la ruta ya comienza con http o https, devolverla tal cual
        if (path.startsWith('http')) return path;
        
        // Asegurarse de que la ruta comience con una barra
        const normalizedPath = path.startsWith('/') ? path : `/${path}`;
        
        // Codificar la URL para manejar espacios y caracteres especiales
        const encodedPath = encodeURI(normalizedPath);
        
        // Siempre usar la URL del frontend para las imágenes
        // Las imágenes se sirven desde la raíz del servidor, no desde /jpupper
        return `${this.frontendUrl}${encodedPath}`;
    }
};

// Make config available globally
window.appConfig = CONFIG;
