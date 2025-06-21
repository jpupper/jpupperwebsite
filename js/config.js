const CONFIG = {
    isLocal: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
    get apiUrl() {
        return this.isLocal ? 'http://localhost:3242' : 'https://vps-4455523-x.dattaweb.com';
    },
    get frontendUrl() {
        return this.isLocal ? 'http://localhost:3242' : 'https://vps-4455523-x.dattaweb.com';
    }
};

// Make config available globally
window.appConfig = CONFIG;
