// Credenciales de admin
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'admin';

let token = localStorage.getItem('adminToken');
const projectModal = new bootstrap.Modal(document.getElementById('projectModal'));

// Check authentication
function checkAuth() {
    if (!token) {
        document.getElementById('loginForm').style.display = 'block';
        document.getElementById('projectsPanel').style.display = 'none';
    } else {
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('projectsPanel').style.display = 'block';
        loadProjects();
    }
}

// Login handler - Validación local simple
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // Validación simple contra credenciales hardcodeadas
    if (username === ADMIN_USER && password === ADMIN_PASS) {
        token = 'local-admin-token';
        localStorage.setItem('adminToken', token);
        checkAuth();
    } else {
        alert('Login failed: Invalid credentials');
    }
});

// Load projects
async function loadProjects() {
    try {
        updateEnvironmentIndicator();
        const apiUrl = CONFIG.apiUrl;
        console.log('Cargando proyectos desde:', `${apiUrl}/api/projects`);
        const response = await fetch(`${apiUrl}/api/projects`);
        const projects = await response.json();
        
        const tbody = document.getElementById('projectsList');
        tbody.innerHTML = '';
        
        projects.forEach(project => {
            console.log(`📦 Proyecto: "${project.title}"`);
            console.log(`   - Thumbnail original: "${project.thumbnail}"`);
            const thumbnailUrl = CONFIG.getImagePath(project.thumbnail);
            console.log(`   - Thumbnail URL final: "${thumbnailUrl}"`);
            console.log('---');
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><img src="${thumbnailUrl}" alt="${project.title}" class="img-thumbnail" onerror="console.error('❌ Error cargando imagen: ${thumbnailUrl}');"></td>
                <td><strong>${project.title}</strong></td>
                <td><div class="description-cell">${project.description}</div></td>
                <td><a href="${project.url}" target="_blank" class="text-truncate d-inline-block" style="max-width: 200px">${project.url}</a></td>
                <td>${project.tags.map(tag => `<span class="tag-badge">${tag}</span>`).join(' ')}</td>
                <td>
                    <div class="btn-group">
                        <button class="btn btn-sm btn-primary" onclick="editProject('${project.id}')">
                            <i class="bi bi-pencil"></i> Edit
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteProject('${project.id}')">
                            <i class="bi bi-trash"></i> Delete
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error('Error loading projects:', error);
        alert('Failed to load projects');
    }
}

// Show add project form
function showAddProjectForm() {
    document.getElementById('projectForm').reset();
    document.getElementById('projectId').value = '';
    document.getElementById('modalTitle').textContent = 'Add New Project';
    document.getElementById('thumbnailPreview').innerHTML = '';
    projectModal.show();
}

// Edit project
async function editProject(id) {
    try {
        const apiUrl = CONFIG.apiUrl;
        const endpoint = `${apiUrl}/api/projects/${id}`;
        console.log(`Obteniendo detalles del proyecto: ${endpoint}`);
        const response = await fetch(endpoint);
        const project = await response.json();
        
        document.getElementById('projectId').value = project.id;
        document.getElementById('title').value = project.title;
        document.getElementById('projectUrl').value = project.url;
        document.getElementById('videolink').value = project.videolink || '';
        document.getElementById('description').value = project.description;
        document.getElementById('tags').value = project.tags.join(', ');
        document.getElementById('thumbnailPreview').innerHTML = `
            <img src="${CONFIG.getImagePath(project.thumbnail)}" alt="Current thumbnail" class="thumbnail-preview">
        `;
        document.getElementById('modalTitle').textContent = 'Edit Project';
        
        projectModal.show();
    } catch (error) {
        console.error('Error loading project:', error);
        alert('Failed to load project details');
    }
}

// Save project
async function saveProject() {
    const form = document.getElementById('projectForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    try {
        const formData = new FormData();
        const projectId = document.getElementById('projectId').value;
        const title = document.getElementById('title').value;
        const url = document.getElementById('projectUrl').value;
        const videolink = document.getElementById('videolink').value;
        const description = document.getElementById('description').value;
        const tags = document.getElementById('tags').value.split(',').map(tag => tag.trim());
        const thumbnail = document.getElementById('thumbnail').files[0];

        // Generar un ID basado en el título si es un nuevo proyecto
        const id = projectId || title.toLowerCase().replace(/[^a-z0-9]/g, '');
        
        // Agregar todos los campos al FormData
        formData.append('title', title);
        formData.append('url', url);
        formData.append('videolink', videolink);
        formData.append('description', description);
        formData.append('tags', JSON.stringify(tags));
        
        // Siempre incluir el ID en el FormData
        if (!projectId) {
            formData.append('id', id);
        }
        
        // Agregar el thumbnail solo si existe
        if (thumbnail) {
            formData.append('thumbnail', thumbnail);
            console.log('Agregando thumbnail:', thumbnail.name, thumbnail.size, thumbnail.type);
        } else {
            console.log('No se ha seleccionado thumbnail, se usará el predeterminado');
        }

        const method = projectId ? 'PUT' : 'POST';
        const apiUrl = CONFIG.apiUrl;
        const endpoint = projectId ? `${apiUrl}/api/projects/${projectId}` : `${apiUrl}/api/projects`;
        console.log(`Guardando proyecto en: ${endpoint} (${method})`);
        console.log('FormData contiene:', [...formData.entries()]);

        // Limpiar cualquier listener previo para evitar errores
        if (window.stopListeners && typeof window.stopListeners === 'function') {
            try {
                window.stopListeners();
            } catch (e) {
                console.log('No se pudieron detener los listeners previos');
            }
        }

        const response = await fetch(endpoint, {
            method,
            body: formData
        });

        if (response.ok) {
            projectModal.hide();
            loadProjects();
            alert('Proyecto guardado correctamente');
        } else {
            try {
                const error = await response.json();
                console.error('Error del servidor:', error);
                alert('Error al guardar proyecto: ' + (error.message || 'Error desconocido'));
            } catch (parseError) {
                console.error('Error al parsear respuesta:', parseError);
                alert(`Error al guardar proyecto (${response.status}): No se pudo procesar la respuesta del servidor`);
            }
        }
    } catch (error) {
        console.error('Error al guardar proyecto:', error);
        alert('Error al guardar proyecto: ' + (error.message || 'Error de conexión'));
    }
}

// Delete project
async function deleteProject(id) {
    if (!confirm('Are you sure you want to delete this project?')) {
        return;
    }

    try {
        const apiUrl = CONFIG.apiUrl;
        const endpoint = `${apiUrl}/api/projects/${id}`;
        console.log(`Eliminando proyecto: ${endpoint}`);
        const response = await fetch(endpoint, {
            method: 'DELETE'
        });

        if (response.ok) {
            loadProjects();
        } else {
            const error = await response.json();
            alert('Failed to delete project: ' + error.message);
        }
    } catch (error) {
        console.error('Error deleting project:', error);
        alert('Failed to delete project');
    }
}

// Thumbnail preview
document.getElementById('thumbnail').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('thumbnailPreview').innerHTML = `
                <img src="${e.target.result}" alt="Thumbnail preview">
            `;
        };
        reader.readAsDataURL(file);
    }
});

// Update environment indicator
function updateEnvironmentIndicator() {
    const envElement = document.getElementById('currentEnvironment');
    if (envElement) {
        const env = CONFIG.isLocal ? 'Local (localhost:3243)' : 'VPS (vps-4455523-x.dattaweb.com)';
        envElement.textContent = env;
        console.log('🌐 Ambiente actual:', env);
        console.log('🔗 API URL:', CONFIG.apiUrl);
        console.log('🖼️ Ejemplo de imagen:', CONFIG.getImagePath('img/projects/test.jpg'));
    }
    
    // Actualizar botones activos
    const buttons = document.querySelectorAll('.btn-group button');
    buttons.forEach(btn => {
        btn.classList.remove('active');
        if ((CONFIG.isLocal && btn.textContent.includes('Local')) || 
            (!CONFIG.isLocal && btn.textContent.includes('VPS'))) {
            btn.classList.add('active');
        }
    });
}

// Initialize
checkAuth();
updateEnvironmentIndicator();
