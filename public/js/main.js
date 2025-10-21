let projects = [];
let slideshowInterval = null;
let currentProjectIndex = 0;
let tiempoDefecto = 10000;
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

    // Función para actualizar la URL con los filtros actuales
    function updateURLWithFilters() {
        const params = new URLSearchParams(window.location.search);
        
        if (selectedFilters.length > 0) {
            params.set('filters', selectedFilters.join(','));
        } else {
            params.delete('filters');
        }
        
        if (currentSearch) {
            params.set('search', currentSearch);
        } else {
            params.delete('search');
        }
        
        const newURL = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
        window.history.replaceState({}, '', newURL);
    }

    // Función para cargar filtros desde la URL
    function loadFiltersFromURL() {
        const params = new URLSearchParams(window.location.search);
        
        // Cargar filtros
        const filtersParam = params.get('filters');
        if (filtersParam) {
            selectedFilters = filtersParam.split(',').filter(f => f.trim() !== '');
        }
        
        // Cargar búsqueda
        const searchParam = params.get('search');
        if (searchParam) {
            currentSearch = searchParam;
            searchInput.value = currentSearch;
        }
        
        // Actualizar estado visual de los botones de filtro
        filterButtons.forEach(button => {
            const filter = button.getAttribute('data-filter');
            if (selectedFilters.includes(filter)) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
    }

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
                
                const preview = document.querySelector('.project-preview');
                
                // Iniciar transición de salida
                preview.classList.add('transitioning');
                
                // Esperar a que termine el fade out
                await new Promise(resolve => setTimeout(resolve, 500));
                
                // Actualizar preview con el nuevo proyecto
                previewTitle.textContent = project.title;
                
                // Verificar si hay un videolink de YouTube (incluyendo shorts)
                const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]+)/;
                const instagramRegex = /(?:https?:\/\/)?(?:www\.)?instagram\.com\/(p|reel|tv)\/([a-zA-Z0-9_-]+)\/?/;
                const videoUrl = project.videolink || '';
                const youtubeMatch = videoUrl.match(youtubeRegex);
                const instagramMatch = videoUrl.match(instagramRegex);
                
                if (youtubeMatch && videoUrl.trim() !== '') {
                    const videoId = youtubeMatch[1];
                    
                    // Crear estructura de video
                    const videoWrapper = document.createElement('div');
                    videoWrapper.className = 'video-wrapper';
                    const videoContainer = document.createElement('div');
                    videoContainer.className = 'video-container';
                    
                    // Crear iframe con el video
                    const iframe = document.createElement('iframe');
                    iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&modestbranding=1&showinfo=0&rel=0`;
                    iframe.frameBorder = '0';
                    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
                    iframe.allowFullscreen = true;
                    
                    videoContainer.appendChild(iframe);
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
                    
                    // Manejador de error
                    iframe.addEventListener('error', () => {
                        iframe.style.display = 'none';
                        backupImage.style.display = 'block';
                    });
                } else if (instagramMatch && videoUrl.trim() !== '') {
                    const postType = instagramMatch[1];
                    const postId = instagramMatch[2];
                    
                    // Crear estructura de video para Instagram
                    const videoWrapper = document.createElement('div');
                    videoWrapper.className = 'video-wrapper instagram-wrapper';
                    const videoContainer = document.createElement('div');
                    videoContainer.className = 'video-container instagram-container';
                    
                    // Crear blockquote para embed de Instagram (método oficial)
                    const blockquote = document.createElement('blockquote');
                    blockquote.className = 'instagram-media';
                    blockquote.setAttribute('data-instgrm-captioned', '');
                    blockquote.setAttribute('data-instgrm-permalink', `https://www.instagram.com/${postType}/${postId}/`);
                    blockquote.setAttribute('data-instgrm-version', '14');
                    blockquote.style.cssText = 'background:#FFF; border:0; border-radius:3px; box-shadow:0 0 1px 0 rgba(0,0,0,0.5),0 1px 10px 0 rgba(0,0,0,0.15); margin: 1px; max-width:540px; min-width:326px; padding:0; width:99.375%; width:-webkit-calc(100% - 2px); width:calc(100% - 2px);';
                    
                    videoContainer.appendChild(blockquote);
                    
                    // Crear botón de play overlay
                    const playOverlay = document.createElement('div');
                    playOverlay.className = 'instagram-play-overlay';
                    playOverlay.innerHTML = `
                        <svg viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z"/>
                        </svg>
                    `;
                    
                    videoWrapper.appendChild(videoContainer);
                    videoWrapper.appendChild(playOverlay);
                    
                    // Crear backup image
                    const backupImage = document.createElement('div');
                    backupImage.className = 'backup-image';
                    backupImage.style.cssText = `display: none; width: 100%; height: 100%; background-image: url(${project.thumbnail}); background-size: contain; background-position: center; background-repeat: no-repeat;`;
                    
                    // Limpiar y actualizar previewImage
                    previewImage.innerHTML = '';
                    previewImage.appendChild(videoWrapper);
                    previewImage.appendChild(backupImage);
                    previewImage.style.backgroundImage = 'none';
                    
                    // Cargar el script de Instagram si no está cargado
                    if (!window.instgrm) {
                        const script = document.createElement('script');
                        script.async = true;
                        script.src = '//www.instagram.com/embed.js';
                        document.body.appendChild(script);
                        script.onload = () => {
                            if (window.instgrm) {
                                window.instgrm.Embeds.process();
                            }
                        };
                    } else {
                        window.instgrm.Embeds.process();
                    }
                    
                    // Detectar interacción con el iframe de Instagram
                    // Como los eventos dentro del iframe no se propagan, detectamos cuando el mouse entra y sale
                    let mouseOverEmbed = false;
                    let checkInterval;
                    
                    videoWrapper.addEventListener('mouseenter', () => {
                        mouseOverEmbed = true;
                        // Iniciar verificación de si el usuario está interactuando
                        checkInterval = setInterval(() => {
                            if (document.activeElement && document.activeElement.tagName === 'IFRAME') {
                                // El iframe tiene foco, el usuario está interactuando
                                playOverlay.classList.add('hidden');
                                clearInterval(checkInterval);
                            }
                        }, 100);
                    });
                    
                    videoWrapper.addEventListener('mouseleave', () => {
                        mouseOverEmbed = false;
                        if (checkInterval) {
                            clearInterval(checkInterval);
                        }
                    });
                    
                    // También ocultar el botón si se hace clic en el área del wrapper
                    videoWrapper.addEventListener('click', () => {
                        setTimeout(() => playOverlay.classList.add('hidden'), 300);
                    });
                } else {
                    // Si no hay videolink válido, mostrar la imagen normal
                    previewImage.innerHTML = '';
                    previewImage.style.backgroundImage = `url(${project.thumbnail})`;
                    previewImage.style.backgroundSize = 'contain';
                    previewImage.style.backgroundPosition = 'center';
                    previewImage.style.backgroundRepeat = 'no-repeat';
                }
                
                // Actualizar el resto del contenido
                previewDescription.innerHTML = project.description;
                previewLink.href = project.url;
                
                // Mostrar tags
                const tagsContainer = document.querySelector('.preview-tags');
                if (tagsContainer) {
                    tagsContainer.innerHTML = project.tags.map(tag => `<span class="tag">${tag}</span>`).join('');
                }
                
                // Quitar la clase transitioning para el fade in
                preview.classList.remove('transitioning');
            });

            projectList.appendChild(projectElement);
        });

        // Seleccionar el primer proyecto por defecto
        if (filteredProjects.length > 0) {
            const firstProject = filteredProjects[0];
            previewTitle.textContent = firstProject.title;
            
            // Verificar si el primer proyecto tiene un videolink válido (incluyendo shorts)
            const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]+)/;
            const instagramRegex = /(?:https?:\/\/)?(?:www\.)?instagram\.com\/(p|reel|tv)\/([a-zA-Z0-9_-]+)\/?/;
            const videoUrl = firstProject.videolink || '';
            const youtubeMatch = videoUrl.match(youtubeRegex);
            const instagramMatch = videoUrl.match(instagramRegex);
            
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
            } else if (instagramMatch && videoUrl.trim() !== '') {
                // Si hay un link de Instagram válido, crear el embed
                const postType = instagramMatch[1];
                const postId = instagramMatch[2];
                previewImage.innerHTML = `
                    <div class="video-wrapper instagram-wrapper">
                        <div class="video-container instagram-container">
                            <blockquote class="instagram-media" 
                                data-instgrm-captioned 
                                data-instgrm-permalink="https://www.instagram.com/${postType}/${postId}/" 
                                data-instgrm-version="14"
                                style="background:#FFF; border:0; border-radius:3px; box-shadow:0 0 1px 0 rgba(0,0,0,0.5),0 1px 10px 0 rgba(0,0,0,0.15); margin: 1px; max-width:540px; min-width:326px; padding:0; width:99.375%; width:-webkit-calc(100% - 2px); width:calc(100% - 2px);">
                            </blockquote>
                        </div>
                        <div class="instagram-play-overlay">
                            <svg viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z"/>
                            </svg>
                        </div>
                    </div>
                    <div class="backup-image" style="display: none; width: 100%; height: 100%; background-image: url(${firstProject.thumbnail}); background-size: contain; background-position: center; background-repeat: no-repeat;"></div>
                `;
                previewImage.style.backgroundImage = 'none';
                
                // Agregar evento para ocultar el botón de play después de que se cargue el HTML
                setTimeout(() => {
                    const playOverlay = previewImage.querySelector('.instagram-play-overlay');
                    const videoWrapper = previewImage.querySelector('.instagram-wrapper');
                    
                    if (playOverlay && videoWrapper) {
                        // Detectar interacción con el iframe de Instagram
                        let checkInterval;
                        
                        videoWrapper.addEventListener('mouseenter', () => {
                            // Iniciar verificación de si el usuario está interactuando
                            checkInterval = setInterval(() => {
                                if (document.activeElement && document.activeElement.tagName === 'IFRAME') {
                                    // El iframe tiene foco, el usuario está interactuando
                                    playOverlay.classList.add('hidden');
                                    clearInterval(checkInterval);
                                }
                            }, 100);
                        });
                        
                        videoWrapper.addEventListener('mouseleave', () => {
                            if (checkInterval) {
                                clearInterval(checkInterval);
                            }
                        });
                        
                        // También ocultar el botón si se hace clic en el área del wrapper
                        videoWrapper.addEventListener('click', () => {
                            setTimeout(() => playOverlay.classList.add('hidden'), 300);
                        });
                    }
                }, 100);
                
                // Cargar el script de Instagram si no está cargado
                if (!window.instgrm) {
                    const script = document.createElement('script');
                    script.async = true;
                    script.src = '//www.instagram.com/embed.js';
                    document.body.appendChild(script);
                    script.onload = () => {
                        if (window.instgrm) {
                            window.instgrm.Embeds.process();
                        }
                    };
                } else {
                    window.instgrm.Embeds.process();
                }
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
        updateURLWithFilters();
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
            
            // Renderizar proyectos filtrados y actualizar URL
            renderProjects(selectedFilters, currentSearch);
            updateURLWithFilters();
        });
    });

    // Función para precargar el video de YouTube
    async function preloadYoutubeVideo(videoUrl) {
        return new Promise((resolve) => {
            const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]+)/;
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
        
        currentProjectIndex = (currentProjectIndex - 1 + projectItems.length) % projectItems.length;
        projectItems[currentProjectIndex].click();
    }

    // Función para cambiar al siguiente proyecto en el slideshow
    function nextProject() {
        const projectItems = document.querySelectorAll('.project-item');
        if (projectItems.length === 0) return;
        
        currentProjectIndex = (currentProjectIndex + 1) % projectItems.length;
        projectItems[currentProjectIndex].click();
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

    // Cargar filtros desde URL y renderizar proyectos
    loadFiltersFromURL();
    renderProjects(selectedFilters, currentSearch);
});

// ... (rest of the code remains the same)
