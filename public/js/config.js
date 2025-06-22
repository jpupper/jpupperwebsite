const CONFIG = {
    isLocal: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
    get apiUrl() {
        return this.isLocal ? 'http://localhost:3243/jpupper' : 'https://vps-4455523-x.dattaweb.com/jpupper';
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
        // Si la ruta ya comienza con /, no añadir otro /
        const cleanPath = imagePath.startsWith('/') ? imagePath : '/' + imagePath;
        return `${this.basePath}${cleanPath}`;
    }
};

// Para mantener compatibilidad con el código existente
window.appConfig = CONFIG;
