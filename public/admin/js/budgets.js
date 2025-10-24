const budgetModal = new bootstrap.Modal(document.getElementById('budgetModal'));
let budgetItemCounter = 0;

// Referencias (proyectos) para presupuestos
let availableProjects = [];
let selectedReferences = [];

// Load budgets when tab is clicked
document.getElementById('budgets-tab').addEventListener('click', loadBudgets);

// Load all budgets
async function loadBudgets() {
    const tbody = document.getElementById('budgetsList');
    tbody.innerHTML = '<tr><td colspan="6" class="text-center"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Cargando...</span></div></td></tr>';
    
    try {
        const apiUrl = CONFIG.apiUrl;
        console.log('Cargando presupuestos desde:', `${apiUrl}/api/budgets`);
        const response = await fetch(`${apiUrl}/api/budgets`);
        const budgets = await response.json();
        tbody.innerHTML = '';
        
        if (budgets.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-5">
                        <div class="text-muted">
                            <i class="bi bi-inbox" style="font-size: 3rem;"></i>
                            <p class="mt-3 mb-0">No hay presupuestos disponibles</p>
                            <p class="small">Crea tu primer presupuesto usando el botón "Crear Presupuesto"</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }
        
        budgets.forEach(budget => {
            const fullscreenUrl = `https://fullscreencode.com/presupuesto.html?presupuesto=${budget.code}`;
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${budget.code}</strong></td>
                <td>${budget.projectName}</td>
                <td>${budget.client}</td>
                <td><strong>$${budget.total.toFixed(2)}</strong></td>
                <td>
                    <a href="${fullscreenUrl}" target="_blank" class="text-truncate d-inline-block" style="max-width: 300px">
                        ${fullscreenUrl}
                    </a>
                </td>
                <td>
                    <div class="btn-group">
                        <button class="btn btn-sm btn-primary" onclick="editBudget('${budget._id}')">
                            <i class="bi bi-pencil"></i> Edit
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteBudget('${budget._id}')">
                            <i class="bi bi-trash"></i> Delete
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error('Error loading budgets:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-5">
                    <div class="alert alert-danger d-inline-block">
                        <i class="bi bi-exclamation-triangle"></i>
                        <strong>Error al cargar presupuestos</strong><br>
                        <small>${error.message}</small>
                    </div>
                </td>
            </tr>
        `;
    }
}

// Show add budget form
function showAddBudgetForm() {
    document.getElementById('budgetForm').reset();
    document.getElementById('budgetId').value = '';
    document.getElementById('budgetCode').value = '';
    document.getElementById('budgetModalTitle').textContent = 'Crear Presupuesto';
    document.getElementById('budgetItemsContainer').innerHTML = '';
    document.getElementById('budgetLinkDisplay').style.display = 'none';
    budgetItemCounter = 0;

    // Reset referencias UI
    selectedReferences = [];
    const sel = document.getElementById('selectedReferences');
    const selBox = document.getElementById('referencesSelector');
    const list = document.getElementById('referencesList');
    if (sel) sel.innerHTML = '';
    if (list) list.innerHTML = '';
    if (selBox) selBox.style.display = 'none';

    // Add one initial item
    addBudgetItem();

    // Pre-cargar proyectos para referencias
    loadProjectsForReferences();

    budgetModal.show();
}

// Add budget item row
function addBudgetItem(item = null) {
    budgetItemCounter++;
    const container = document.getElementById('budgetItemsContainer');
    const itemDiv = document.createElement('div');
    itemDiv.className = 'budget-item mb-2 p-3 border rounded';
    itemDiv.dataset.itemId = budgetItemCounter;
    
    itemDiv.innerHTML = `
        <div class="row align-items-end">
            <div class="col-md-5">
                <label class="form-label">Descripción</label>
                <input type="text" class="form-control item-description" value="${item?.description || ''}" required>
            </div>
            <div class="col-md-2">
                <label class="form-label">Cantidad</label>
                <input type="number" class="form-control item-quantity" value="${item?.quantity || 1}" min="1" required onchange="calculateBudgetTotal()">
            </div>
            <div class="col-md-2">
                <label class="form-label">Precio Unit.</label>
                <input type="number" class="form-control item-price" value="${item?.unitPrice || 0}" min="0" step="0.01" required onchange="calculateBudgetTotal()">
            </div>
            <div class="col-md-2">
                <label class="form-label">Total</label>
                <input type="text" class="form-control item-total" value="$${item?.total.toFixed(2) || '0.00'}" readonly>
            </div>
            <div class="col-md-1">
                <button type="button" class="btn btn-danger btn-sm w-100" onclick="removeBudgetItem(${budgetItemCounter})">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        </div>
    `;
    
    container.appendChild(itemDiv);
    calculateBudgetTotal();
}

// Remove budget item
function removeBudgetItem(itemId) {
    const item = document.querySelector(`[data-item-id="${itemId}"]`);
    if (item) {
        item.remove();
        calculateBudgetTotal();
    }
}

// Calculate budget total
function calculateBudgetTotal() {
    let total = 0;
    const items = document.querySelectorAll('.budget-item');
    
    items.forEach(item => {
        const quantity = parseFloat(item.querySelector('.item-quantity').value) || 0;
        const price = parseFloat(item.querySelector('.item-price').value) || 0;
        const itemTotal = quantity * price;
        
        item.querySelector('.item-total').value = `$${itemTotal.toFixed(2)}`;
        total += itemTotal;
    });
    
    document.getElementById('budgetTotalDisplay').textContent = total.toFixed(2);
}

// Save budget
async function saveBudget() {
    // Clear previous error messages
    const existingAlert = document.querySelector('#budgetModal .alert-danger');
    if (existingAlert) existingAlert.remove();
    
    try {
        const budgetId = document.getElementById('budgetId').value;
        const projectName = document.getElementById('budgetProjectName').value;
        const description = document.getElementById('budgetDescription').value;
        const client = document.getElementById('budgetClient').value;
        const paymentTerms = document.getElementById('budgetPaymentTerms').value;
        const technicalRequirements = document.getElementById('budgetTechnicalRequirements').value;
        
        // Collect items
        const items = [];
        document.querySelectorAll('.budget-item').forEach(itemDiv => {
            const itemDescription = itemDiv.querySelector('.item-description').value;
            const quantity = parseFloat(itemDiv.querySelector('.item-quantity').value);
            const unitPrice = parseFloat(itemDiv.querySelector('.item-price').value);
            
            items.push({
                description: itemDescription,
                quantity,
                unitPrice
            });
        });
        
        if (items.length === 0) {
            showBudgetError('Debes agregar al menos un item al presupuesto');
            return;
        }
        
        const references = selectedReferences.map(p => ({
            id: p.id,
            title: p.title,
            url: p.url || '',
            thumbnail: p.thumbnail || ''
        }));
        
        const budgetData = {
            projectName,
            description,
            client,
            paymentTerms,
            technicalRequirements,
            items,
            references
        };
        
        const apiUrl = CONFIG.apiUrl;
        const endpoint = budgetId ? `${apiUrl}/api/budgets/${budgetId}` : `${apiUrl}/api/budgets`;
        const method = budgetId ? 'PUT' : 'POST';
        
        console.log('Guardando presupuesto en:', endpoint);
        console.log('Datos:', budgetData);
        
        const response = await fetch(endpoint, {
            method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(budgetData)
        });
        
        // Manejo robusto de errores no-JSON
        if (!response.ok) {
            const contentType = response.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
                const error = await response.json();
                throw new Error(error.message || 'Error al guardar');
            } else {
                const text = await response.text();
                console.error('Respuesta no-JSON del servidor al guardar presupuesto:', text.substring(0, 200));
                const envMsg = CONFIG.isLocal ? 'Verifica que el servidor Node esté corriendo en http://localhost:3243' : 'Verifica la ruta en el VPS: https://vps-4455523-x.dattaweb.com/jpupper';
                throw new Error(`El servidor no respondió en formato JSON (status ${response.status}). ${envMsg}.`);
            }
        }
        
        const savedBudget = await response.json();
        
        // Show the FullScreen link
        const fullscreenUrl = `https://fullscreencode.com/presupuesto.html?presupuesto=${savedBudget.code}`;
        document.getElementById('budgetFullScreenLink').href = fullscreenUrl;
        document.getElementById('budgetFullScreenLink').textContent = fullscreenUrl;
        document.getElementById('budgetLinkDisplay').style.display = 'block';
        
        // Update form to edit mode
        document.getElementById('budgetId').value = savedBudget._id;
        document.getElementById('budgetCode').value = savedBudget.code;
        document.getElementById('budgetModalTitle').textContent = 'Editar Presupuesto';
        
        showBudgetSuccess('Presupuesto guardado exitosamente!');
        loadBudgets();
    } catch (error) {
        console.error('Error saving budget:', error);
        showBudgetError(`Error al guardar el presupuesto: ${error.message}`);
    }
}

// Edit budget
async function editBudget(id) {
    try {
        const apiUrl = CONFIG.apiUrl;
        const endpoint = `${apiUrl}/api/budgets/${id}`;
        console.log('Cargando presupuesto desde:', endpoint);
        const response = await fetch(endpoint);
        const budget = await response.json();
        
        document.getElementById('budgetId').value = budget._id;
        document.getElementById('budgetCode').value = budget.code;
        document.getElementById('budgetProjectName').value = budget.projectName;
        document.getElementById('budgetDescription').value = budget.description;
        document.getElementById('budgetClient').value = budget.client;
        document.getElementById('budgetPaymentTerms').value = budget.paymentTerms;
        document.getElementById('budgetTechnicalRequirements').value = budget.technicalRequirements;
        document.getElementById('budgetModalTitle').textContent = 'Editar Presupuesto';
        
        // Clear and add items
        document.getElementById('budgetItemsContainer').innerHTML = '';
        budgetItemCounter = 0;
        budget.items.forEach(item => addBudgetItem(item));
        
        // Referencias
        selectedReferences = Array.isArray(budget.references) ? budget.references : [];
        renderSelectedReferencesChips();
        // Pre-cargar lista de proyectos y marcar checks
        await loadProjectsForReferences();
        // Marcar seleccionados en lista
        selectedReferences.forEach(ref => {
            const chk = document.querySelector(`#referencesList input[data-id="${ref.id}"]`);
            if (chk) chk.checked = true;
        });
        
        // Show FullScreen link
        const fullscreenUrl = `https://fullscreencode.com/presupuesto.html?presupuesto=${budget.code}`;
        document.getElementById('budgetFullScreenLink').href = fullscreenUrl;
        document.getElementById('budgetFullScreenLink').textContent = fullscreenUrl;
        document.getElementById('budgetLinkDisplay').style.display = 'block';
        
        budgetModal.show();
    } catch (error) {
        console.error('Error loading budget:', error);
        showBudgetError(`Error al cargar el presupuesto: ${error.message}`);
    }
}

// Referencias: cargar proyectos y UI
async function loadProjectsForReferences() {
    try {
        const apiUrl = CONFIG.apiUrl;
        const resp = await fetch(`${apiUrl}/api/projects`);
        const projects = await resp.json();
        availableProjects = Array.isArray(projects) ? projects : [];
        const list = document.getElementById('referencesList');
        if (!list) return;
        list.innerHTML = '';
        availableProjects.forEach(p => {
            const thumb = (typeof CONFIG.getImagePath === 'function') ? CONFIG.getImagePath(p.thumbnail) : p.thumbnail;
            const item = document.createElement('div');
            item.className = 'form-check mb-2';
            item.innerHTML = `
                <input class="form-check-input" type="checkbox" id="ref-${p.id}" data-id="${p.id}" onchange="onReferenceToggle(event)">
                <label class="form-check-label" for="ref-${p.id}">
                    <img src="${thumb}" alt="${p.title}" style="width:28px;height:28px;object-fit:cover;border-radius:4px;margin-right:8px;vertical-align:middle;"> ${p.title}
                </label>
            `;
            list.appendChild(item);
        });
    } catch (err) {
        console.error('Error cargando proyectos para referencias:', err);
    }
}

function toggleReferencesSelector() {
    const box = document.getElementById('referencesSelector');
    if (!box) return;
    if (box.style.display === 'none' || box.style.display === '') {
        box.style.display = 'block';
        if (availableProjects.length === 0) loadProjectsForReferences();
    } else {
        box.style.display = 'none';
    }
}

function onReferenceToggle(event) {
    const id = event.target.getAttribute('data-id');
    if (!id) return;
    const project = availableProjects.find(p => p.id === id);
    if (!project) return;
    if (event.target.checked) {
        if (!selectedReferences.find(r => r.id === project.id)) {
            selectedReferences.push({ id: project.id, title: project.title, url: project.url, thumbnail: project.thumbnail });
        }
    } else {
        selectedReferences = selectedReferences.filter(r => r.id !== project.id);
    }
    renderSelectedReferencesChips();
}

function renderSelectedReferencesChips() {
    const sel = document.getElementById('selectedReferences');
    if (!sel) return;
    sel.innerHTML = '';
    selectedReferences.forEach(r => {
        const chip = document.createElement('span');
        chip.className = 'badge bg-primary me-2 mb-2';
        chip.style.cursor = 'pointer';
        chip.title = 'Click para quitar';
        chip.innerHTML = `<i class="bi bi-link-45deg"></i> ${r.title}`;
        chip.onclick = () => {
            // uncheck in list
            const chk = document.querySelector(`#referencesList input[data-id="${r.id}"]`);
            if (chk) chk.checked = false;
            selectedReferences = selectedReferences.filter(x => x.id !== r.id);
            renderSelectedReferencesChips();
        };
        sel.appendChild(chip);
    });
}

function filterReferences() {
    const term = (document.getElementById('referencesSearch')?.value || '').toLowerCase();
    const list = document.getElementById('referencesList');
    if (!list) return;
    list.querySelectorAll('.form-check').forEach(div => {
        const label = div.querySelector('.form-check-label');
        const txt = label?.textContent?.toLowerCase() || '';
        div.style.display = txt.includes(term) ? '' : 'none';
    });
}

// Delete budget
async function deleteBudget(id) {
    if (!confirm('¿Estás seguro de que quieres eliminar este presupuesto?')) {
        return;
    }
    
    try {
        const apiUrl = CONFIG.apiUrl;
        const endpoint = `${apiUrl}/api/budgets/${id}`;
        console.log('Eliminando presupuesto:', endpoint);
        const response = await fetch(endpoint, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            loadBudgets();
        } else {
            throw new Error('Error al eliminar');
        }
    } catch (error) {
        console.error('Error deleting budget:', error);
        const tbody = document.getElementById('budgetsList');
        const errorRow = document.createElement('tr');
        errorRow.innerHTML = `
            <td colspan="6" class="text-center">
                <div class="alert alert-danger d-inline-block">
                    <i class="bi bi-exclamation-triangle"></i>
                    Error al eliminar el presupuesto: ${error.message}
                </div>
            </td>
        `;
        tbody.insertBefore(errorRow, tbody.firstChild);
        setTimeout(() => errorRow.remove(), 5000);
    }
}

// Copy budget link to clipboard
function copyBudgetLink() {
    const link = document.getElementById('budgetFullScreenLink').textContent;
    navigator.clipboard.writeText(link).then(() => {
        const btn = event.target.closest('button');
        const originalHTML = btn.innerHTML;
        btn.innerHTML = '<i class="bi bi-check"></i> Copiado!';
        btn.classList.add('btn-success');
        btn.classList.remove('btn-outline-primary');
        setTimeout(() => {
            btn.innerHTML = originalHTML;
            btn.classList.remove('btn-success');
            btn.classList.add('btn-outline-primary');
        }, 2000);
    }).catch(err => {
        console.error('Error copying link:', err);
        showBudgetError('Error al copiar el link');
    });
}

// Helper functions for showing messages
function showBudgetError(message) {
    const modalBody = document.querySelector('#budgetModal .modal-body');
    const existingAlert = modalBody.querySelector('.alert-danger');
    if (existingAlert) existingAlert.remove();
    
    const alert = document.createElement('div');
    alert.className = 'alert alert-danger alert-dismissible fade show';
    alert.innerHTML = `
        <i class="bi bi-exclamation-triangle"></i> ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    modalBody.insertBefore(alert, modalBody.firstChild);
}

function showBudgetSuccess(message) {
    const modalBody = document.querySelector('#budgetModal .modal-body');
    const existingAlert = modalBody.querySelector('.alert-success');
    if (existingAlert) existingAlert.remove();
    
    const alert = document.createElement('div');
    alert.className = 'alert alert-success alert-dismissible fade show';
    alert.innerHTML = `
        <i class="bi bi-check-circle"></i> ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    modalBody.insertBefore(alert, modalBody.firstChild);
    setTimeout(() => alert.remove(), 5000);
}
