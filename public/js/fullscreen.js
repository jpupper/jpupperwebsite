
// Función para activar/desactivar pantalla completa
function toggleFullscreen() {
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    const autoplayBtn = document.querySelector('.autoplay-btn');
    isFullscreen = !isFullscreen;

    if (isFullscreen) {
        document.body.classList.add('fullscreen');
        fullscreenBtn.querySelector('.btn-text').textContent = 'Salir';
        autoplayBtn.style.display = 'block';
        // Asegurarse de que haya un proyecto seleccionado
        const activeProject = document.querySelector('.project-item.active');
        if (!activeProject) {
            const firstProject = document.querySelector('.project-item');
            if (firstProject) firstProject.click();
        }
        document.getElementById('galleryautoplay').style.display = 'block';
    } else {
        document.body.classList.remove('fullscreen');
        fullscreenBtn.querySelector('.btn-text').textContent = 'Pantalla Completa';
        autoplayBtn.style.display = 'none';
        if (isSlideshow) toggleSlideshow(); // Detener slideshow al salir
        document.getElementById('galleryautoplay').style.display = 'none';
    }
}
