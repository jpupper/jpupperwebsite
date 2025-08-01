let projects = [];
let slideshowInterval = null;
let currentProjectIndex = 0;
let tiempoDefecto = 2000;
let isFullscreen = false;
let isSlideshow = false;


document.addEventListener('DOMContentLoaded', async () => {
   
    try {
        // Usar CONFIG para construir la URL correcta del API
        const apiUrl = CONFIG.apiUrl;
        console.log('Conectando a API:', `${apiUrl}/api/projects`);
        const response = await fetch(`${apiUrl}/api/projects`);
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
                
                // Precargar el video si existe antes de iniciar la transición
                let preloadedIframe = null;
                if (project.videolink) {
                    preloadedIframe = await preloadYoutubeVideo(project.videolink);
                }
                
                // Agregar transición
                const preview = document.querySelector('.project-preview');
                preview.classList.add('transitioning');
                
                // Esperar a que termine el fade out
                await new Promise(resolve => setTimeout(resolve, 500));
                
                // Actualizar preview
                previewTitle.textContent = project.title;
                
                // Verificar si hay un videolink de YouTube
                const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)[\w-]+/;
                const videoUrl = project.videolink || '';
                const youtubeMatch = videoUrl.match(youtubeRegex);
                
                if (youtubeMatch && videoUrl.trim() !== '' && preloadedIframe) {
                    // Si hay un video de YouTube válido y está precargado, usar el iframe precargado
                    const videoWrapper = document.createElement('div');
                    videoWrapper.className = 'video-wrapper';
                    const videoContainer = document.createElement('div');
                    videoContainer.className = 'video-container';
                    
                    // Mover el iframe precargado al contenedor
                    preloadedIframe.style.display = 'block';
                    videoContainer.appendChild(preloadedIframe);
                    videoWrapper.appendChild(videoContainer);
                    
                    // Crear backup image
                    const backupImage = document.createElement('div');
                    backupImage.className = 'backup-image';
                    backupImage.style.cssText = `display: none; width: 100%; height: 100%; background-image: url(${project.thumbnail}); background-size: contain; background-position: center; background-repeat: no-repeat;`;
                    
                    // Limpiar y actualizar previewImage
                    previewImage.innerHTML = '';
                    previewImage.appendChild(videoWrapper);
                    previewImage.appendChild(backupImage);
                    previewImage.style.backgroundImage = 'none';
                    
                    // Manejadores de error
                    preloadedIframe.addEventListener('error', () => {
                        preloadedIframe.style.display = 'none';
                        backupImage.style.display = 'block';
                    });
                } else {
                    // Si no hay videolink válido o falló la precarga, mostrar la imagen normal
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

    // Función para precargar el video de YouTube
    async function preloadYoutubeVideo(videoUrl) {
        return new Promise((resolve) => {
            const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]+)/;
            const youtubeMatch = videoUrl?.match(youtubeRegex);
            
            if (!youtubeMatch || !videoUrl?.trim()) {
                resolve(null);
                return;
            }

            const videoId = youtubeMatch[1];
            const iframe = document.createElement('iframe');
            iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&modestbranding=1&showinfo=0&rel=0`;
            iframe.style.display = 'none';
            iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
            iframe.allowFullscreen = true;

            iframe.onload = () => {
                resolve(iframe);
            };

            document.body.appendChild(iframe);
        });
    }

    // Función para cambiar al proyecto anterior
    async function prevProject() {
        const projectItems = document.querySelectorAll('.project-item');
        if (projectItems.length === 0) return;
        
        const preview = document.querySelector('.project-preview');
        preview.classList.add('transitioning');
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        currentProjectIndex = (currentProjectIndex - 1 + projectItems.length) % projectItems.length;
        const nextProject = projects[currentProjectIndex];
        
        // Precargar el video si existe
        if (nextProject.videolink) {
            await preloadYoutubeVideo(nextProject.videolink);
        }
        
        projectItems[currentProjectIndex].click();
        
        setTimeout(() => {
            preview.classList.remove('transitioning');
        }, 50);
    }

    // Función para cambiar al siguiente proyecto en el slideshow
    async function nextProject() {
        const projectItems = document.querySelectorAll('.project-item');
        if (projectItems.length === 0) return;
        
        const preview = document.querySelector('.project-preview');
        preview.classList.add('transitioning');
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        currentProjectIndex = (currentProjectIndex + 1) % projectItems.length;
        const nextProject = projects[currentProjectIndex];
        
        // Precargar el video si existe
        if (nextProject.videolink) {
            await preloadYoutubeVideo(nextProject.videolink);
        }
        
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
            slideshowInterval = setInterval(nextProject, tiempoDefecto);
        } else {
            updateButtons(slideshowBtn, 'Autoplay');
            updateButtons(autoplayBtn, 'Autoplay');
            if (slideshowInterval) {
                clearInterval(slideshowInterval);
                slideshowInterval = null;
            }
        }
    }

    // Event listeners para los botones de control
    document.getElementById('fullscreen-btn').addEventListener('click', toggleFullscreen);
    document.getElementById('slideshow-btn').addEventListener('click', toggleSlideshow);
    document.querySelector('.autoplay-btn').addEventListener('click', toggleSlideshow);
    document.querySelector('.close-fullscreen').addEventListener('click', () => {
        if (isFullscreen) toggleFullscreen();
    });
    
    // Event listeners para los botones de navegación
    document.querySelector('.prev-project').addEventListener('click', () => {
        if (slideshowInterval) {
            clearInterval(slideshowInterval);
            slideshowInterval = null;
            isSlideshow = false;
            const slideshowBtn = document.getElementById('slideshow-btn');
            const autoplayBtn = document.querySelector('.autoplay-btn');
            if (slideshowBtn.querySelector('.btn-text')) {
                slideshowBtn.querySelector('.btn-text').textContent = 'Autoplay';
            }
            autoplayBtn.textContent = 'Autoplay';
        }
        prevProject();
    });
    
    document.querySelector('.next-project').addEventListener('click', () => {
        if (slideshowInterval) {
            clearInterval(slideshowInterval);
            slideshowInterval = null;
            isSlideshow = false;
            const slideshowBtn = document.getElementById('slideshow-btn');
            const autoplayBtn = document.querySelector('.autoplay-btn');
            if (slideshowBtn.querySelector('.btn-text')) {
                slideshowBtn.querySelector('.btn-text').textContent = 'Autoplay';
            }
            autoplayBtn.textContent = 'Autoplay';
        }
        nextProject();
    });

    // Renderizar todos los proyectos inicialmente
    renderProjects(selectedFilters, currentSearch);
});
