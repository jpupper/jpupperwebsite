// Credenciales de admin
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'vamossusan';

let token = localStorage.getItem('adminToken');
const projectModal = new bootstrap.Modal(document.getElementById('projectModal'));
const tagModal = new bootstrap.Modal(document.getElementById('tagModal'));

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
        
        // Si hay thumbnail manual, usarlo
        if (thumbnail) {
            formData.append('thumbnail', thumbnail);
            console.log('Agregando thumbnail manual:', thumbnail.name, thumbnail.size, thumbnail.type);
        } else if (videolink) {
            // Si hay videolink pero no thumbnail manual, el servidor lo descargará automáticamente
            console.log('El servidor descargará el thumbnail automáticamente desde:', videolink);
        } else {
            console.log('No se ha seleccionado thumbnail, se usará el predeterminado');
        }

        const method = projectId ? 'PUT' : 'POST';
        const apiUrl = CONFIG.apiUrl;
        const endpoint = projectId ? `${apiUrl}/api/projects/${projectId}` : `${apiUrl}/api/projects`;
        console.log('=== GUARDANDO PROYECTO ===');
        console.log(`Endpoint: ${endpoint}`);
        console.log(`Method: ${method}`);
        console.log('FormData contiene:', [...formData.entries()]);
        console.log('Video link:', videolink);

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

        console.log('Respuesta recibida:', response.status, response.statusText);

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

// Función para extraer thumbnail de YouTube
function getYoutubeThumbnail(url) {
    const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]+)/;
    const match = url.match(youtubeRegex);
    if (match && match[1]) {
        const videoId = match[1];
        // YouTube ofrece varias calidades de thumbnails
        // maxresdefault (1280x720) > sddefault (640x480) > hqdefault (480x360) > mqdefault (320x180) > default (120x90)
        return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    }
    return null;
}

// Función para extraer ID de Instagram
function getInstagramPostId(url) {
    const instagramRegex = /(?:https?:\/\/)?(?:www\.)?instagram\.com\/(p|reel|tv)\/([a-zA-Z0-9_-]+)\/?/;
    const match = url.match(instagramRegex);
    if (match) {
        return {
            type: match[1],
            postId: match[2],
            mediaUrl: `https://www.instagram.com/${match[1]}/${match[2]}/media/?size=l`
        };
    }
    return null;
}

// Event listener para videolink - extraer thumbnail automáticamente
document.getElementById('videolink').addEventListener('input', async function(e) {
    const videoUrl = e.target.value.trim();
    if (!videoUrl) return;

    const thumbnailPreview = document.getElementById('thumbnailPreview');
    
    // Intentar extraer thumbnail de YouTube
    const youtubeThumbnail = getYoutubeThumbnail(videoUrl);
    if (youtubeThumbnail) {
        thumbnailPreview.innerHTML = `
            <div class="alert alert-info">
                <strong>✓ Thumbnail de YouTube detectado</strong>
                <img src="${youtubeThumbnail}" alt="YouTube thumbnail" class="thumbnail-preview mt-2" 
                     onerror="this.src='https://img.youtube.com/vi/${videoUrl.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]+)/)?.[1]}/hqdefault.jpg'">
                <p class="mb-0 mt-2"><small>Este thumbnail se usará automáticamente si no subes una imagen personalizada</small></p>
            </div>
        `;
        return;
    }

    // Intentar extraer thumbnail de Instagram
    const instagramData = getInstagramPostId(videoUrl);
    if (instagramData) {
        thumbnailPreview.innerHTML = `
            <div class="alert alert-success">
                <strong>✓ Video de Instagram detectado</strong>
                <img src="${instagramData.mediaUrl}" alt="Instagram thumbnail" class="thumbnail-preview mt-2" 
                     onerror="this.parentElement.innerHTML='<div class=\\'alert alert-warning\\'><strong>⚠ Video de Instagram detectado</strong><p class=\\'mb-0 mt-2\\'><small>No se pudo cargar el preview. El thumbnail se intentará descargar al guardar.</small></p></div>'">
                <p class="mb-0 mt-2"><small>Este thumbnail se usará automáticamente si no subes una imagen personalizada</small></p>
            </div>
        `;
        return;
    }
});

// Thumbnail preview
document.getElementById('thumbnail').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('thumbnailPreview').innerHTML = `
                <img src="${e.target.result}" alt="Thumbnail preview" class="thumbnail-preview">
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

// ==================== TAGS MANAGEMENT ====================

// Load tags
async function loadTags() {
    try {
        const apiUrl = CONFIG.apiUrl;
        console.log('Cargando tags desde:', `${apiUrl}/api/tags`);
        const response = await fetch(`${apiUrl}/api/tags`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const tags = await response.json();
        
        const tbody = document.getElementById('tagsList');
        tbody.innerHTML = '';
        
        if (tags.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted">No hay tags creados. Agrega tu primer tag!</td></tr>';
            return;
        }
        
        tags.forEach(tag => {
            const tr = document.createElement('tr');
            const createdDate = new Date(tag.createdAt).toLocaleDateString();
            tr.innerHTML = `
                <td><strong>${tag.displayName}</strong></td>
                <td>${createdDate}</td>
                <td>
                    <div class="btn-group">
                        <button class="btn btn-sm btn-primary" onclick="editTag('${tag._id}')">
                            <i class="bi bi-pencil"></i> Edit
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteTag('${tag._id}')">
                            <i class="bi bi-trash"></i> Delete
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error('Error loading tags:', error);
        const tbody = document.getElementById('tagsList');
        tbody.innerHTML = '<tr><td colspan="3" class="text-center text-danger">Error al cargar tags. Verifica que el servidor esté corriendo.</td></tr>';
    }
}

// Show add tag form
function showAddTagForm() {
    document.getElementById('tagForm').reset();
    document.getElementById('tagId').value = '';
    document.getElementById('tagModalTitle').textContent = 'Add New Tag';
    tagModal.show();
}

// Edit tag
async function editTag(id) {
    try {
        const apiUrl = CONFIG.apiUrl;
        const endpoint = `${apiUrl}/api/tags`;
        const response = await fetch(endpoint);
        const tags = await response.json();
        const tag = tags.find(t => t._id === id);
        
        if (!tag) {
            console.error('Tag not found');
            return;
        }
        
        document.getElementById('tagId').value = tag._id;
        document.getElementById('tagName').value = tag.displayName;
        document.getElementById('tagModalTitle').textContent = 'Edit Tag';
        
        tagModal.show();
    } catch (error) {
        console.error('Error loading tag:', error);
        console.error('Failed to load tag details');
    }
}

// Save tag
async function saveTag() {
    const form = document.getElementById('tagForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    try {
        const tagId = document.getElementById('tagId').value;
        const displayName = document.getElementById('tagName').value.trim();
        const name = displayName.toLowerCase().replace(/\s+/g, '');

        const method = tagId ? 'PUT' : 'POST';
        const apiUrl = CONFIG.apiUrl;
        const endpoint = tagId ? `${apiUrl}/api/tags/${tagId}` : `${apiUrl}/api/tags`;
        
        console.log(`Guardando tag en: ${endpoint} (${method})`);
        console.log('Datos:', { name, displayName });

        const response = await fetch(endpoint, {
            method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, displayName })
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers.get('content-type'));

        if (response.ok) {
            tagModal.hide();
            loadTags();
        } else {
            // Intentar leer como JSON, si falla leer como texto
            const contentType = response.headers.get('content-type');
            let errorMessage = 'Error desconocido';
            
            if (contentType && contentType.includes('application/json')) {
                const error = await response.json();
                errorMessage = error.message || 'Error desconocido';
            } else {
                const text = await response.text();
                console.error('Respuesta no-JSON del servidor:', text.substring(0, 200));
                errorMessage = `El servidor no está respondiendo correctamente. Status: ${response.status}. Verifica que el servidor esté corriendo en el puerto 3243.`;
            }
            
            console.error('Error al guardar tag:', errorMessage);
        }
    } catch (error) {
        console.error('Error al guardar tag:', error);
        console.error('Error al guardar tag:', error.message, '- ¿Está el servidor corriendo?');
    }
}

// Delete tag
async function deleteTag(id) {
    if (!confirm('Are you sure you want to delete this tag?')) {
        return;
    }

    try {
        const apiUrl = CONFIG.apiUrl;
        const endpoint = `${apiUrl}/api/tags/${id}`;
        console.log(`Eliminando tag: ${endpoint}`);
        const response = await fetch(endpoint, {
            method: 'DELETE'
        });

        if (response.ok) {
            loadTags();
        } else {
            const error = await response.json();
            console.error('Failed to delete tag:', error.message);
        }
    } catch (error) {
        console.error('Error deleting tag:', error);
        console.error('Failed to delete tag');
    }
}

// Event listener para el tab de Tags Library
document.getElementById('tags-tab')?.addEventListener('click', function() {
    loadTags();
});

// Initialize
checkAuth();
updateEnvironmentIndicator();
