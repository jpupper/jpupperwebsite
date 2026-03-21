// Acceso al panel
const ACCESS_CODE_REQUIRED = 'vamossusan';

let token = localStorage.getItem('adminToken');
const projectModal = new bootstrap.Modal(document.getElementById('projectModal'));
const tagModal = new bootstrap.Modal(document.getElementById('tagModal'));

// Helper mapping to VPS API
function getApiUrlBase() {
    return 'https://vps-4455523-x.dattaweb.com/jpupper/api';
}

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

// Logout function
function logout() {
    localStorage.removeItem('adminToken');
    window.location.reload();
}

// Login handler
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const accessCode = document.getElementById('accessCode').value;

    if (accessCode === ACCESS_CODE_REQUIRED) {
        token = 'local-admin-token';
        localStorage.setItem('adminToken', token);
        checkAuth();
    } else {
        alert('Código de acceso incorrecto');
    }
});

// Load projects
async function loadProjects() {
    try {
        updateEnvironmentIndicator();
        const apiUrl = getApiUrlBase();
        const response = await fetch(`${apiUrl}/projects`);
        const projects = await response.json();
        
        const tbody = document.getElementById('projectsList');
        tbody.innerHTML = '';
        
        projects.forEach(project => {
            const thumbnailUrl = CONFIG.getImagePath(project.thumbnail);
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><img src="${thumbnailUrl}" class="img-thumbnail"></td>
                <td><strong>${project.title}</strong></td>
                <td><div class="description-cell">${project.description}</div></td>
                <td><a href="${project.url}" target="_blank">${project.url}</a></td>
                <td>${project.tags.map(tag => `<span class="tag-badge">${tag}</span>`).join(' ')}</td>
                <td>
                    <div class="btn-group">
                        <button class="btn btn-sm btn-primary" onclick="editProject('${project.id}')">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteProject('${project.id}')">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error('Error loading projects:', error);
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
        const apiUrl = getApiUrlBase();
        const response = await fetch(`${apiUrl}/projects/${id}`);
        const project = await response.json();
        
        document.getElementById('projectId').value = project.id;
        document.getElementById('title').value = project.title;
        document.getElementById('projectUrl').value = project.url;
        document.getElementById('videolink').value = project.videolink || '';
        document.getElementById('description').value = project.description;
        document.getElementById('tags').value = project.tags.join(', ');
        document.getElementById('thumbnailPreview').innerHTML = `
            <img src="${CONFIG.getImagePath(project.thumbnail)}" class="thumbnail-preview">
        `;
        document.getElementById('modalTitle').textContent = 'Edit Project';
        projectModal.show();
    } catch (error) {
        console.error('Error loading project:', error);
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

        const id = projectId || title.toLowerCase().replace(/[^a-z0-9]/g, '');
        
        formData.append('title', title);
        formData.append('url', url);
        formData.append('videolink', videolink);
        formData.append('description', description);
        formData.append('tags', JSON.stringify(tags));
        if (!projectId) formData.append('id', id);
        if (thumbnail) formData.append('thumbnail', thumbnail);

        const method = projectId ? 'PUT' : 'POST';
        const apiUrl = getApiUrlBase();
        const endpoint = projectId ? `${apiUrl}/projects/${projectId}` : `${apiUrl}/projects`;

        const response = await fetch(endpoint, {
            method,
            body: formData
        });

        if (response.ok) {
            projectModal.hide();
            loadProjects();
            alert('Proyecto guardado correctamente');
        } else {
            console.error('Error saving project');
        }
    } catch (error) {
        console.error('Error in saveProject:', error);
    }
}

// Delete project
async function deleteProject(id) {
    if (!confirm('Are you sure?')) return;
    try {
        const apiUrl = getApiUrlBase();
        await fetch(`${apiUrl}/projects/${id}`, { method: 'DELETE' });
        loadProjects();
    } catch (error) { console.error('Error deleting project:', error); }
}

// Environment management (Removed)

// Tags Management
async function loadTags() {
    try {
        const apiUrl = getApiUrlBase();
        const response = await fetch(`${apiUrl}/tags`);
        const tags = await response.json();
        const tbody = document.getElementById('tagsList');
        tbody.innerHTML = '';
        
        tags.forEach(tag => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${tag.displayName}</strong></td>
                <td>${new Date(tag.createdAt).toLocaleDateString()}</td>
                <td>
                    <button class="btn btn-sm btn-danger" onclick="deleteTag('${tag._id}')">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (e) { console.error('Error loading tags:', e); }
}

function showAddTagForm() {
    document.getElementById('tagForm').reset();
    document.getElementById('tagId').value = '';
    tagModal.show();
}

async function saveTag() {
    const displayName = document.getElementById('tagName').value.trim();
    if (!displayName) return;
    const name = displayName.toLowerCase().replace(/\s+/g, '');
    const apiUrl = getApiUrlBase();
    await fetch(`${apiUrl}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, displayName })
    });
    tagModal.hide();
    loadTags();
}

async function deleteTag(id) {
    if (!confirm('Are you sure?')) return;
    const apiUrl = getApiUrlBase();
    await fetch(`${apiUrl}/tags/${id}`, { method: 'DELETE' });
    loadTags();
}

document.getElementById('tags-tab')?.addEventListener('click', loadTags);

// Initialize
checkAuth();
updateEnvironmentIndicator();

// Handle tab switching via URL hash
window.addEventListener('load', () => {
    const hash = window.location.hash;
    if (hash) {
        const tabEl = document.querySelector(`button[data-bs-target="${hash}-content"]`);
        if (tabEl) {
            const tab = new bootstrap.Tab(tabEl);
            tab.show();
        }
    }
});
