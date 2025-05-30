document.addEventListener('DOMContentLoaded', () => {
    const projectList = document.querySelector('.project-list');
    const previewImage = document.querySelector('.preview-image');
    const previewTitle = document.querySelector('.preview-content h3');
    const previewDescription = document.querySelector('.preview-description');
    const previewLink = document.querySelector('.preview-link');
    const filterButtons = document.querySelectorAll('.filter-btn');

    let currentFilter = 'all';
    let currentSearch = '';

    // Función para renderizar los proyectos
    function renderProjects(filter = 'all', searchTerm = '') {
        const searchLower = searchTerm.toLowerCase();
        projectList.innerHTML = '';
        const filteredProjects = projects.filter(project => {
            // Aplicar filtro de búsqueda
            const matchesSearch = searchTerm === '' || 
                project.title.toLowerCase().includes(searchLower) ||
                project.description.toLowerCase().includes(searchLower);
            
            // Aplicar filtro de categoría
            const matchesFilter = filter === 'all' || project.tags.includes(filter);
            
            return matchesSearch && matchesFilter;
        });

        filteredProjects.forEach(project => {
            const projectElement = document.createElement('div');
            projectElement.classList.add('project-item');
            projectElement.innerHTML = `<h3>${project.title}</h3>`;
            
            projectElement.addEventListener('click', () => {
                // Remover clase active de todos los proyectos
                document.querySelectorAll('.project-item').forEach(item => {
                    item.classList.remove('active');
                });
                
                // Agregar clase active al proyecto seleccionado
                projectElement.classList.add('active');
                
                // Actualizar preview
                previewTitle.textContent = project.title;
                previewImage.style.backgroundImage = `url(${project.thumbnail})`;
                previewDescription.textContent = project.description;
                previewLink.href = project.url;
            });

            projectList.appendChild(projectElement);
        });

        // Seleccionar el primer proyecto por defecto
        if (filteredProjects.length > 0) {
            const firstProject = filteredProjects[0];
            previewTitle.textContent = firstProject.title;
            previewImage.style.backgroundImage = `url(${firstProject.thumbnail})`;
            previewDescription.textContent = firstProject.description;
            previewLink.href = firstProject.url;
            projectList.firstChild.classList.add('active');
        }
    }

    // Event listener para el buscador
    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', (e) => {
        currentSearch = e.target.value;
        renderProjects(currentFilter, currentSearch);
    });

    // Event listeners para los filtros
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            const filter = button.getAttribute('data-filter');
            
            // Actualizar clases active de los botones
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Renderizar proyectos filtrados
            currentFilter = filter;
            renderProjects(filter, currentSearch);
        });
    });

    // Renderizar todos los proyectos inicialmente
    renderProjects(currentFilter, currentSearch);
});
