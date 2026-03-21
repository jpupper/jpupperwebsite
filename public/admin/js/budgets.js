const budgetModal = new bootstrap.Modal(document.getElementById('budgetModal'));
let budgetItemCounter = 0;

// Referencias (proyectos) para presupuestos
let availableProjects = [];
let selectedReferences = [];
let selectedRefTags = [];

// Load budgets when tab is clicked
document.getElementById('budgets-tab').addEventListener('click', loadBudgets);

// Helper to VPS API
function getApiUrlBase() {
    return 'https://vps-4455523-x.dattaweb.com/jpupper/api';
}

// Load all budgets
async function loadBudgets() {
    const tbody = document.getElementById('budgetsList');
    tbody.innerHTML = '<tr><td colspan="6" class="text-center"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Cargando...</span></div></td></tr>';
    
    try {
        const apiUrl = getApiUrlBase();
        console.log('Cargando presupuestos desde:', `${apiUrl}/budgets`);
        const response = await fetch(`${apiUrl}/budgets`);
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
    document.getElementById('budgetProjectName').value = '';
    document.getElementById('budgetClient').value = '';
    document.getElementById('budgetDescription').value = '';
    document.getElementById('budgetTechnicalRequirements').value = '';
    document.getElementById('budgetPaymentTerms').value = '4. CONDICIONES DE PAGO Y FACTURACIÓN\nMedios de Pago: Se acepta Factura C, Criptomonedas, Dólares (efectivo/transferencia) o Pesos.\nCotización: Para pagos en pesos, se tomará la cotización del dólar del día en que se realice la inversión inicial.\nMora en el Pago: Una vez realizada la entrega final, el cliente dispone de 15 días corridos para cancelar el saldo. Pasado ese período, se aplicará un recargo del 10% sobre el presupuesto total por demora.';
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

    // Add one initial item (Optional)
    // addBudgetItem();

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
                <input type="text" class="form-control item-total" value="$${item?.total?.toFixed(2) || '0.00'}" readonly>
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
    const existingAlert = document.querySelector('#budgetModal .alert-danger');
    if (existingAlert) existingAlert.remove();
    
    try {
        const budgetId = document.getElementById('budgetId').value;
        const projectName = document.getElementById('budgetProjectName').value;
        const description = document.getElementById('budgetDescription').value;
        const client = document.getElementById('budgetClient').value;
        const paymentTerms = document.getElementById('budgetPaymentTerms').value;
        const technicalRequirements = document.getElementById('budgetTechnicalRequirements').value;
        
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
        
        /* 
        if (items.length === 0) {
            showBudgetError('Debes agregar al menos un item al presupuesto');
            return;
        }
        */
        
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
        
        const apiUrl = getApiUrlBase();
        const endpoint = budgetId ? `${apiUrl}/budgets/${budgetId}` : `${apiUrl}/budgets`;
        const method = budgetId ? 'PUT' : 'POST';
        
        const response = await fetch(endpoint, {
            method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(budgetData)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Error al guardar');
        }
        
        const savedBudget = await response.json();
        
        const fullscreenUrl = `https://fullscreencode.com/presupuesto.html?presupuesto=${savedBudget.code}`;
        document.getElementById('budgetFullScreenLink').href = fullscreenUrl;
        document.getElementById('budgetFullScreenLink').textContent = fullscreenUrl;
        document.getElementById('budgetLinkDisplay').style.display = 'block';
        
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
        const apiUrl = getApiUrlBase();
        const endpoint = `${apiUrl}/budgets/${id}`;
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
        
        document.getElementById('budgetItemsContainer').innerHTML = '';
        budgetItemCounter = 0;
        budget.items.forEach(item => addBudgetItem(item));
        
        selectedReferences = Array.isArray(budget.references) ? budget.references : [];
        renderSelectedReferencesChips();
        await loadProjectsForReferences();
        selectedReferences.forEach(ref => {
            const chk = document.querySelector(`#referencesList input[data-id="${ref.id}"]`);
            if (chk) chk.checked = true;
        });
        
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

// Additional helper functions for tags filtering and preview... (from FullScreen version)
async function loadProjectsForReferences() {
    try {
        const apiUrl = getApiUrlBase();
        const resp = await fetch(`${apiUrl}/projects`);
        const projects = await resp.json();
        availableProjects = Array.isArray(projects) ? projects : [];
        const list = document.getElementById('referencesList');
        if (!list) return;
        list.innerHTML = '';

        try {
            const uniqueTags = Array.from(new Set(availableProjects.flatMap(p => Array.isArray(p.tags) ? p.tags : [])));
            renderReferencesTagFilters(uniqueTags);
        } catch (e) {}

        availableProjects.forEach(p => {
            const thumb = (typeof CONFIG.getImagePath === 'function') ? CONFIG.getImagePath(p.thumbnail) : p.thumbnail;
            const item = document.createElement('div');
            item.className = 'form-check mb-2';
            item.dataset.tags = (Array.isArray(p.tags) ? p.tags.join(',') : '');
            item.innerHTML = `
                <input class="form-check-input" type="checkbox" id="ref-${p.id}" data-id="${p.id}" onchange="onReferenceToggle(event)">
                <label class="form-check-label" for="ref-${p.id}">
                    <img src="${thumb}" alt="${p.title}" style="width:28px;height:28px;object-fit:cover;border-radius:4px;margin-right:8px;vertical-align:middle;"> ${p.title}
                </label>
                <button type="button" class="btn btn-outline-secondary btn-sm ms-2" onclick="previewReference('${p.id}')">
                    <i class="bi bi-eye"></i>
                </button>
            `;
            list.appendChild(item);
        });
    } catch (err) {
        console.error('Error cargando proyectos para referencias:', err);
    }
}

function renderReferencesTagFilters(tags) {
    const box = document.getElementById('referencesTagFilters');
    if (!box) return;
    box.innerHTML = '';
    tags.forEach(tag => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn btn-sm btn-outline-secondary me-1 mb-1';
        btn.textContent = tag;
        btn.onclick = () => {
            const idx = selectedRefTags.indexOf(tag);
            if (idx >= 0) {
                selectedRefTags.splice(idx, 1);
                btn.classList.remove('active');
            } else {
                selectedRefTags.push(tag);
                btn.classList.add('active');
            }
            applyReferencesFilters();
        };
        box.appendChild(btn);
    });
}

function applyReferencesFilters() {
    const term = (document.getElementById('referencesSearch')?.value || '').toLowerCase();
    const list = document.getElementById('referencesList');
    if (!list) return;
    const hasTags = selectedRefTags.length > 0;
    list.querySelectorAll('.form-check').forEach(div => {
        const label = div.querySelector('.form-check-label');
        const txt = label?.textContent?.toLowerCase() || '';
        const itemTags = (div.dataset.tags || '').split(',').filter(Boolean);
        const matchTerm = txt.includes(term);
        const matchTags = !hasTags || selectedRefTags.every(t => itemTags.includes(t));
        div.style.display = matchTerm && matchTags ? '' : 'none';
    });
}

function onReferenceToggle(event) {
    const id = event.target.getAttribute('data-id');
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
        chip.innerHTML = `<i class="bi bi-link-45deg"></i> ${r.title}`;
        chip.onclick = () => {
            const chk = document.querySelector(`#referencesList input[data-id="${r.id}"]`);
            if (chk) chk.checked = false;
            selectedReferences = selectedReferences.filter(x => x.id !== r.id);
            renderSelectedReferencesChips();
        };
        sel.appendChild(chip);
    });
}

function previewReference(id) {
    const project = availableProjects.find(p => p.id === id);
    const box = document.getElementById('referencePreview');
    if (!project || !box) return;
    const thumb = (typeof CONFIG.getImagePath === 'function') ? CONFIG.getImagePath(project.thumbnail) : project.thumbnail;
    box.innerHTML = `
        <div class="border rounded p-2 mt-2">
            <strong>${project.title}</strong>
            <img src="${thumb}" class="img-fluid rounded mt-1">
        </div>
    `;
}

function toggleReferencesSelector() {
    const box = document.getElementById('referencesSelector');
    if (!box) return;
    box.style.display = box.style.display === 'none' ? 'block' : 'none';
}

function filterReferences() {
    applyReferencesFilters();
}

async function deleteBudget(id) {
    if (!confirm('¿Estás seguro de que quieres eliminar este presupuesto?')) return;
    try {
        const apiUrl = getApiUrlBase();
        const response = await fetch(`${apiUrl}/budgets/${id}`, { method: 'DELETE' });
        if (response.ok) loadBudgets();
    } catch (error) { console.error('Error deleting:', error); }
}

function showBudgetError(message) {
    alert('Error: ' + message);
}

function showBudgetSuccess(message) {
    alert('Éxito: ' + message);
}
