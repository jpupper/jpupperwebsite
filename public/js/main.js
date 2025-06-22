let projects = [];
let slideshowInterval = null;
let currentProjectIndex = 0;

document.addEventListener('DOMContentLoaded', async () => {
    let isFullscreen = false;
    let isSlideshow = false;
    try {
        // Usar la ruta API directa
        const response = await fetch('/api/projects');
        projects = await response.json();
    } catch (error) {
        console.error('Error cargando los proyectos:', error);
        return;
    }

    const projectList = document.querySelector('.project-list');
    const previewImage = document.querySelector('.preview-image');
    const previewTitle = document.querySelector('.preview-content h3');
    const previewDescription = document.querySelector('.preview-description');
    const previewLink = document.querySelector('.preview-link');
    const filterButtons = document.querySelectorAll('.filter-btn');

    let selectedFilters = [];
    let currentSearch = '';

    // Función para renderizar los proyectos
    function renderProjects(filters = [], searchTerm = '') {
        const searchLower = searchTerm.toLowerCase();
        projectList.innerHTML = '';
        const filteredProjects = projects.filter(project => {
            // Aplicar filtro de búsqueda
            const matchesSearch = searchTerm === '' || 
                project.title.toLowerCase().includes(searchLower) ||
                project.description.toLowerCase().includes(searchLower);
            
            // Si no hay filtros, mostrar todos los proyectos
            // Si hay filtros, mostrar solo los que tengan TODAS las categorías seleccionadas
            const matchesFilter = filters.length === 0 || 
                filters.every(filter => project.tags.includes(filter));
            
            return matchesSearch && matchesFilter;
        });

        filteredProjects.forEach(project => {
            const projectElement = document.createElement('div');
            projectElement.classList.add('project-item');
            projectElement.innerHTML = `<h3>${project.title}</h3>`;
            
            projectElement.addEventListener('click', async () => {
                // Remover clase active de todos los proyectos
                document.querySelectorAll('.project-item').forEach(item => {
                    item.classList.remove('active');
                });
                
                // Agregar clase active al proyecto seleccionado
                projectElement.classList.add('active');
                
                // Agregar transición
                const preview = document.querySelector('.project-preview');
                preview.classList.add('transitioning');
                
                // Esperar a que termine el fade out
                await new Promise(resolve => setTimeout(resolve, 500));
                
                // Actualizar preview
                previewTitle.textContent = project.title;
                
                // Verificar si hay un videolink de YouTube
                const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]+)/;
                const videoUrl = project.videolink || '';
                const youtubeMatch = videoUrl.match(youtubeRegex);
                
                if (youtubeMatch && videoUrl.trim() !== '') {
                    // Si hay un video de YouTube válido, crear el iframe
                    const videoId = youtubeMatch[1];
                    // Crear un contenedor de video con relación de aspecto 16:9
                    previewImage.innerHTML = `
                        <div class="video-wrapper">
                            <div class="video-container">
                                <iframe 
                                    src="https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&modestbranding=1&showinfo=0&rel=0" 
                                    frameborder="0" 
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                    allowfullscreen
                                ></iframe>
                            </div>
                        </div>
                        <div class="backup-image" style="display: none; width: 100%; height: 100%; background-image: url(${project.thumbnail}); background-size: contain; background-position: center; background-repeat: no-repeat;"></div>
                    `;
                    previewImage.style.backgroundImage = 'none';
                    
                    // Agregar manejador de error adicional para el iframe
                    const iframe = previewImage.querySelector('iframe');
                    const backupImage = previewImage.querySelector('.backup-image');
                    iframe.addEventListener('error', () => {
                        iframe.style.display = 'none';
                        backupImage.style.display = 'block';
                    });
                    
                    // Verificar si el video carga correctamente
                    iframe.addEventListener('load', () => {
                        try {
                            if (iframe.contentWindow.document.body.innerHTML === '') {
                                iframe.style.display = 'none';
                                backupImage.style.display = 'block';
                            }
                        } catch (e) {
                            // Si hay un error de seguridad por CORS, asumimos que el video está cargando correctamente
                            console.log('No se pudo verificar el contenido del iframe debido a restricciones de CORS');
                        }
                    });
                } else {
                    // Si no hay videolink válido, mostrar la imagen normal
                    previewImage.innerHTML = '';
                    previewImage.style.backgroundImage = `url(${project.thumbnail})`;
                    previewImage.style.backgroundSize = 'contain';
                    previewImage.style.backgroundPosition = 'center';
                    previewImage.style.backgroundRepeat = 'no-repeat';
                }
                
                // Renderizar descripción como HTML
                previewDescription.innerHTML = project.description;
                previewLink.href = project.url;
                
                // Mostrar tags
                const tagsContainer = document.querySelector('.preview-tags');
                if (tagsContainer) {
                    tagsContainer.innerHTML = project.tags.map(tag => `<span class="tag">${tag}</span>`).join('');
                }
                
                // Quitar la clase transitioning para el fade in
                setTimeout(() => {
                    preview.classList.remove('transitioning');
                }, 50);
            });

            projectList.appendChild(projectElement);
        });

        // Seleccionar el primer proyecto por defecto
        if (filteredProjects.length > 0) {
            const firstProject = filteredProjects[0];
            previewTitle.textContent = firstProject.title;
            
            // Verificar si el primer proyecto tiene un videolink válido
            const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]+)/;
            const videoUrl = firstProject.videolink || '';
            const youtubeMatch = videoUrl.match(youtubeRegex);
            
            if (youtubeMatch && videoUrl.trim() !== '') {
                // Si hay un video de YouTube válido, crear el iframe
                const videoId = youtubeMatch[1];
                // Crear un contenedor de video con relación de aspecto 16:9
                previewImage.innerHTML = `
                    <div class="video-wrapper">
                        <div class="video-container">
                            <iframe 
                                src="https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&modestbranding=1&showinfo=0&rel=0" 
                                frameborder="0" 
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                allowfullscreen
                            ></iframe>
                        </div>
                    </div>
                    <div class="backup-image" style="display: none; width: 100%; height: 100%; background-image: url(${firstProject.thumbnail}); background-size: contain; background-position: center; background-repeat: no-repeat;"></div>
                `;
                previewImage.style.backgroundImage = 'none';
            } else {
                // Si no hay videolink válido, mostrar la imagen normal
                previewImage.innerHTML = '';
                previewImage.style.backgroundImage = `url(${firstProject.thumbnail})`;
                previewImage.style.backgroundSize = 'contain';
                previewImage.style.backgroundPosition = 'center';
                previewImage.style.backgroundRepeat = 'no-repeat';
            }
            
            previewDescription.innerHTML = firstProject.description;
            previewLink.href = firstProject.url;
            
            // Mostrar tags del primer proyecto
            const tagsContainer = document.querySelector('.preview-tags');
            if (tagsContainer) {
                tagsContainer.innerHTML = firstProject.tags.map(tag => `<span class="tag">${tag}</span>`).join('');
            }
            projectList.firstChild.classList.add('active');
        }
    }

    // Event listener para el buscador
    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', (e) => {
        currentSearch = e.target.value;
        renderProjects(selectedFilters, currentSearch);
    });

    // Event listeners para los filtros
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            const filter = button.getAttribute('data-filter');
            
            // Toggle del filtro seleccionado
            const filterIndex = selectedFilters.indexOf(filter);
            if (filterIndex === -1) {
                selectedFilters.push(filter);
                button.classList.add('active');
            } else {
                selectedFilters.splice(filterIndex, 1);
                button.classList.remove('active');
            }
            
            // Renderizar proyectos filtrados
            renderProjects(selectedFilters, currentSearch);
        });
    });

    // Función para cambiar al siguiente proyecto en el slideshow
    async function nextProject() {
        const projectItems = document.querySelectorAll('.project-item');
        if (projectItems.length === 0) return;
        
        const preview = document.querySelector('.project-preview');
        preview.classList.add('transitioning');
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        currentProjectIndex = (currentProjectIndex + 1) % projectItems.length;
        projectItems[currentProjectIndex].click();
        
        setTimeout(() => {
            preview.classList.remove('transitioning');
        }, 50);
    }

    // Función para activar/desactivar el slideshow
    function toggleSlideshow() {
        const slideshowBtn = document.getElementById('slideshow-btn');
        const autoplayBtn = document.querySelector('.autoplay-btn');
        isSlideshow = !isSlideshow;
        
        const updateButtons = (btn, text) => {
            if (btn.querySelector('.btn-text')) {
                btn.querySelector('.btn-text').textContent = text;
            } else {
                btn.textContent = text;
            }
        };
        
        if (isSlideshow) {
            updateButtons(slideshowBtn, 'Detener');
            updateButtons(autoplayBtn, 'Detener');
            slideshowInterval = setInterval(nextProject, 4000);
        } else {
            updateButtons(slideshowBtn, 'Autoplay');
            updateButtons(autoplayBtn, 'Autoplay');
            if (slideshowInterval) {
                clearInterval(slideshowInterval);
                slideshowInterval = null;
            }
        }
    }

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

    // Event listeners para los botones de control
    document.getElementById('fullscreen-btn').addEventListener('click', toggleFullscreen);
    document.getElementById('slideshow-btn').addEventListener('click', toggleSlideshow);
    document.querySelector('.autoplay-btn').addEventListener('click', toggleSlideshow);
    document.querySelector('.close-fullscreen').addEventListener('click', () => {
        if (isFullscreen) toggleFullscreen();
    });
    document.querySelector('.close-fullscreen').addEventListener('click', () => {
        if (isFullscreen) toggleFullscreen();
    });

    // Renderizar todos los proyectos inicialmente
    renderProjects(selectedFilters, currentSearch);
});
