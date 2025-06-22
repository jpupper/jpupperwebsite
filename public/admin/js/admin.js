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

// Login handler
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();
        if (response.ok) {
            token = data.token;
            localStorage.setItem('adminToken', token);
            checkAuth();
        } else {
            alert('Login failed: ' + data.message);
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed');
    }
});

// Load projects
async function loadProjects() {
    try {
        const response = await fetch('/api/projects');
        const projects = await response.json();
        
        const tbody = document.getElementById('projectsList');
        tbody.innerHTML = '';
        
        projects.forEach(project => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><img src="/${project.thumbnail}" alt="${project.title}" class="img-thumbnail"></td>
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
        const response = await fetch(`/api/projects/${id}`);
        const project = await response.json();
        
        document.getElementById('projectId').value = project.id;
        document.getElementById('title').value = project.title;
        document.getElementById('projectUrl').value = project.url;
        document.getElementById('videolink').value = project.videolink || '';
        document.getElementById('description').value = project.description;
        document.getElementById('tags').value = project.tags.join(', ');
        document.getElementById('thumbnailPreview').innerHTML = `
            <img src="/${project.thumbnail}" alt="Current thumbnail" class="thumbnail-preview">
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

    const formData = new FormData();
    const projectId = document.getElementById('projectId').value;
    const title = document.getElementById('title').value;
    const url = document.getElementById('projectUrl').value;
    const videolink = document.getElementById('videolink').value;
    const description = document.getElementById('description').value;
    const tags = document.getElementById('tags').value.split(',').map(tag => tag.trim());
    const thumbnail = document.getElementById('thumbnail').files[0];

    formData.append('title', title);
    formData.append('url', url);
    formData.append('videolink', videolink);
    formData.append('description', description);
    formData.append('tags', JSON.stringify(tags));
    if (thumbnail) {
        formData.append('thumbnail', thumbnail);
    }

    try {
        const method = projectId ? 'PUT' : 'POST';
        const endpoint = projectId ? `/api/projects/${projectId}` : '/api/projects';

        if (!projectId) {
            formData.append('id', title.toLowerCase().replace(/[^a-z0-9]/g, ''));
        }

        const response = await fetch(endpoint, {
            method,
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (response.ok) {
            projectModal.hide();
            loadProjects();
        } else {
            const error = await response.json();
            alert('Failed to save project: ' + error.message);
        }
    } catch (error) {
        console.error('Error saving project:', error);
        alert('Failed to save project');
    }
}

// Delete project
async function deleteProject(id) {
    if (!confirm('Are you sure you want to delete this project?')) {
        return;
    }

    try {
        const response = await fetch(`/api/projects/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
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

// Initialize
checkAuth();
