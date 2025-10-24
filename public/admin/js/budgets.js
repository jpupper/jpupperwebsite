const budgetModal = new bootstrap.Modal(document.getElementById('budgetModal'));
let budgetItemCounter = 0;

// Helpers de origen de referencias y variable global
let referencesOrigin = 'local';
function getOriginBase(origin) {
    return origin === 'vps' ? 'https://vps-4455523-x.dattaweb.com/jpupper' : 'http://localhost:3243';
}
function getImagePathForOrigin(src, origin) {
    if (!src) return '';
    if (/^https?:\/\//i.test(src)) return src;
    const base = getOriginBase(origin);
    const clean = src.startsWith('/') ? src : `/${src}`;
    return `${base}${clean}`;
}

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
            const fullscreenUrl = `${CONFIG.fullscreenUrl}/presupuesto.html?presupuesto=${budget.code}`;
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
async function loadReferenceProjects(selectedRefs = []) {
    try {
        const apiUrl = CONFIG.apiUrl;
        const response = await fetch(`${apiUrl}/api/projects`);
        const projects = await response.json();
        const select = document.getElementById('budgetReferences');
        if (!select) return;
        select.innerHTML = '';
        projects.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.id; // usar el campo id del modelo Project
            opt.textContent = p.title;
            if (selectedRefs.includes(p.id)) opt.selected = true;
            select.appendChild(opt);
        });
    } catch (error) {
        console.error('Error cargando proyectos para referencias:', error);
    }
}

let currentBudgetImages = [];

function showAddBudgetForm() {
    document.getElementById('budgetForm').reset();
    document.getElementById('budgetId').value = '';
    document.getElementById('budgetCode').value = '';
    document.getElementById('budgetModalTitle').textContent = 'Crear Presupuesto';
    document.getElementById('budgetItemsContainer').innerHTML = '';
    document.getElementById('budgetLinkDisplay').style.display = 'none';
    budgetItemCounter = 0;
    currentBudgetImages = [];
    
    // Default currency
    const currencySelect = document.getElementById('budgetCurrency');
    if (currencySelect) currencySelect.value = 'USD';
    
    // Reset referencias seleccionadas
    selectedReferenceIds = [];

    // Cargar referencias (según origen seleccionado)
    const btnLocal = document.getElementById('btnRefOriginLocal');
    const btnVps = document.getElementById('btnRefOriginVps');
    referencesOrigin = 'local';
    if (btnLocal && btnVps) {
        btnLocal.classList.add('active');
        btnVps.classList.remove('active');
        btnLocal.onclick = (e) => { e.preventDefault(); referencesOrigin = 'local'; btnLocal.classList.add('active'); btnVps.classList.remove('active'); initReferencePicker(selectedReferenceIds); };
        btnVps.onclick = (e) => { e.preventDefault(); referencesOrigin = 'vps'; btnVps.classList.add('active'); btnLocal.classList.remove('active'); initReferencePicker(selectedReferenceIds); };
    }
    
    // Cargar referencias iniciales
    initReferencePicker([]);
    
    // Add one initial item
    addBudgetItem();
    
    budgetModal.show();
}

async function readFilesAsBase64(fileList) {
    const files = Array.from(fileList || []);
    const promises = files.map(file => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    }));
    return Promise.all(promises);
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
        const currency = document.getElementById('budgetCurrency').value;
        const references = selectedReferenceIds;
         
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
        
        // Imágenes
        const imagesInput = document.getElementById('budgetImages');
        let images = await readFilesAsBase64(imagesInput.files);
        if (budgetId && (!images || images.length === 0)) {
            images = currentBudgetImages; // conservar imágenes si no se suben nuevas
        }
        
        const budgetData = {
            projectName,
            description,
            client,
            paymentTerms,
            technicalRequirements,
            currency,
            references,
            images,
            items,
            referencesOrigin
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
        const fullscreenUrl = `${CONFIG.fullscreenUrl}/presupuesto.html?presupuesto=${savedBudget.code}`;
        document.getElementById('budgetFullScreenLink').href = fullscreenUrl;
        document.getElementById('budgetFullScreenLink').textContent = fullscreenUrl;
        document.getElementById('budgetLinkDisplay').style.display = 'block';
        
        // Update form to edit mode
        document.getElementById('budgetId').value = savedBudget._id;
        document.getElementById('budgetCode').value = savedBudget.code;
        document.getElementById('budgetModalTitle').textContent = 'Editar Presupuesto';
        currentBudgetImages = savedBudget.images || [];
        
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
        const currencySelect = document.getElementById('budgetCurrency');
        if (currencySelect) currencySelect.value = budget.currency || 'USD';
        currentBudgetImages = budget.images || [];
        
        // Clear and add items
        document.getElementById('budgetItemsContainer').innerHTML = '';
        budgetItemCounter = 0;
        budget.items.forEach(item => addBudgetItem(item));
        
        // Origen de referencias desde presupuesto
        referencesOrigin = budget.referencesOrigin || 'local';
        const btnLocal = document.getElementById('btnRefOriginLocal');
        const btnVps = document.getElementById('btnRefOriginVps');
        if (btnLocal && btnVps) {
            if (referencesOrigin === 'vps') { btnVps.classList.add('active'); btnLocal.classList.remove('active'); }
            else { btnLocal.classList.add('active'); btnVps.classList.remove('active'); }
            btnLocal.onclick = (e) => { e.preventDefault(); referencesOrigin = 'local'; btnLocal.classList.add('active'); btnVps.classList.remove('active'); initReferencePicker(selectedReferenceIds); };
            btnVps.onclick = (e) => { e.preventDefault(); referencesOrigin = 'vps'; btnVps.classList.add('active'); btnLocal.classList.remove('active'); initReferencePicker(selectedReferenceIds); };
        }
        // Cargar referencias y preseleccionar
        await initReferencePicker(budget.references || []);
        
        // Show FullScreen link
        const fullscreenUrl = `${CONFIG.fullscreenUrl}/presupuesto.html?presupuesto=${budget.code}`;
        document.getElementById('budgetFullScreenLink').href = fullscreenUrl;
        document.getElementById('budgetFullScreenLink').textContent = fullscreenUrl;
        document.getElementById('budgetLinkDisplay').style.display = 'block';
        
        budgetModal.show();
    } catch (error) {
        console.error('Error loading budget:', error);
        showBudgetError(`Error al cargar el presupuesto: ${error.message}`);
    }
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

// Replace select-based references loader with tag-filtered picker
let selectedReferenceIds = [];
let refProjects = [];
let selectedRefTagNames = [];

async function initReferencePicker(selectedRefs = []) {
    selectedReferenceIds = Array.isArray(selectedRefs) ? [...selectedRefs] : [];
    const base = referencesOrigin === 'vps' ? 'https://vps-4455523-x.dattaweb.com/jpupper' : 'http://localhost:3243';
    const tagsEl = document.getElementById('budgetRefTags');
    const gridEl = document.getElementById('budgetRefGrid');
    const selectedEl = document.getElementById('budgetRefSelected');
    if (!tagsEl || !gridEl) return;

    // Load projects
    const projRes = await fetch(`${base}/api/projects`);
    refProjects = await projRes.json();

    // Load tags (fallback infer)
    let tagList = [];
    try {
        const tagRes = await fetch(`${base}/api/tags`);
        if (tagRes.ok) tagList = await tagRes.json();
    } catch (_) {}
    if (!Array.isArray(tagList) || tagList.length === 0) {
        const set = new Set();
        refProjects.forEach(p => (p.tags || []).forEach(t => set.add(t)));
        tagList = Array.from(set).map(t => ({ name: t, displayName: t }));
    }

    // Build tag chips (multi-select con Ctrl)
    tagsEl.innerHTML = '';
    selectedRefTagNames = [];
    const allBtn = document.createElement('button');
    allBtn.className = 'btn btn-sm btn-outline-primary me-2 mb-2 active';
    allBtn.textContent = 'Todos';
    allBtn.dataset.tag = '__all__';
    allBtn.type = 'button';
    allBtn.addEventListener('click', (e) => {
        e.preventDefault();
        selectedRefTagNames = [];
        tagsEl.querySelectorAll('.btn').forEach(b => b.classList.remove('active'));
        allBtn.classList.add('active');
        applyTagFilter();
    });
    tagsEl.appendChild(allBtn);
    tagList.forEach(tag => {
        const btn = document.createElement('button');
        btn.className = 'btn btn-sm btn-outline-primary me-2 mb-2';
        btn.textContent = tag.displayName || tag.name;
        btn.dataset.tag = tag.name;
        btn.type = 'button';
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const t = tag.name;
            const isCtrl = e.ctrlKey || e.metaKey; // soportar Cmd en Mac
            if (isCtrl) {
                const idx = selectedRefTagNames.indexOf(t);
                if (idx === -1) selectedRefTagNames.push(t); else selectedRefTagNames.splice(idx, 1);
                // actualizar estilos
                btn.classList.toggle('active', selectedRefTagNames.includes(t));
                allBtn.classList.toggle('active', selectedRefTagNames.length === 0);
            } else {
                selectedRefTagNames = [t];
                tagsEl.querySelectorAll('.btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            }
            applyTagFilter();
        });
        tagsEl.appendChild(btn);
    });

    // Build grid
    gridEl.innerHTML = '';
    refProjects.forEach(p => {
        const col = document.createElement('div');
        col.className = 'col-4 col-sm-3 col-lg-2';
        const card = document.createElement('div');
        card.className = 'card h-100 p-2';
        card.dataset.id = p.id;
        card.dataset.tags = JSON.stringify(p.tags || []);
        const thumbSrc = getImagePathForOrigin(p.thumbnail || '', referencesOrigin);
        const thumb = thumbSrc || 'https://via.placeholder.com/200x150?text=Sin+imagen';
        card.innerHTML = `
            <img src="${thumb}" class="card-img-top" alt="${p.title || ''}" style="height:100px;object-fit:cover;border-radius:.25rem;">
            <div class="card-body p-2">
                <h6 class="card-title small text-truncate" title="${p.title || ''}">${p.title || ''}</h6>
                <div class="d-flex flex-wrap gap-1">${(p.tags || []).map(t => `<span class='badge text-bg-light'>${t}</span>`).join('')}</div>
                <div class="d-flex justify-content-end mt-2">
                    <button type="button" class="btn btn-sm btn-outline-secondary">Ver</button>
                </div>
            </div>
        `;
        if (selectedReferenceIds.includes(p.id)) card.classList.add('border-primary');
        card.style.cursor = 'pointer';
        card.style.maxWidth = '180px';
        // Click en card: seleccionar/quitar referencia
        card.onclick = (ev) => {
            // evitar que el botón "Ver" dispare el toggle
            const targetBtn = ev.target.closest('button');
            if (targetBtn) return; 
            toggleReference(p.id);
        };
        // Click en "Ver": setear preview activo
        const viewBtn = card.querySelector('button.btn');
        if (viewBtn) viewBtn.onclick = (e) => { e.preventDefault(); e.stopPropagation(); showReferencePreview(p.id); };
        col.appendChild(card);
        gridEl.appendChild(col);
    });

    syncSelectedChips();
    // Mostrar preview inicial
    const initialPreviewId = selectedReferenceIds[0] || (refProjects[0] ? refProjects[0].id : null);
    if (initialPreviewId) showReferencePreview(initialPreviewId);
    // Aplicar filtro inicial (Todos)
    applyTagFilter();
}

function applyTagFilter(tagNameOptional) {
    // Si pasaron un tagName directo, tratarlo como selección única
    if (typeof tagNameOptional === 'string' && tagNameOptional !== '__all__') {
        selectedRefTagNames = [tagNameOptional];
    }
    // Actualizar estilos de chips
    const tagsEl = document.getElementById('budgetRefTags');
    const allBtn = tagsEl.querySelector(".btn[data-tag='__all__']");
    tagsEl.querySelectorAll('.btn').forEach(b => {
        const t = b.dataset.tag;
        if (t === '__all__') {
            b.classList.toggle('active', selectedRefTagNames.length === 0);
        } else {
            b.classList.toggle('active', selectedRefTagNames.includes(t));
        }
    });

    // Mostrar/ocultar cards
    const cards = document.querySelectorAll('#budgetRefGrid .card');
    cards.forEach(card => {
        if (selectedRefTagNames.length === 0) {
            card.parentElement.style.display = '';
        } else {
            const tags = JSON.parse(card.dataset.tags || '[]');
            const matches = selectedRefTagNames.every(t => tags.includes(t));
            card.parentElement.style.display = matches ? '' : 'none';
        }
    });
}

function toggleReference(projectId) {
    const idx = selectedReferenceIds.indexOf(projectId);
    if (idx === -1) selectedReferenceIds.push(projectId); else selectedReferenceIds.splice(idx, 1);
    const card = document.querySelector(`#budgetRefGrid .card[data-id='${projectId}']`);
    if (card) card.classList.toggle('border-primary');
    syncSelectedChips();
}

function syncSelectedChips() {
  const chipsEl = document.getElementById('budgetRefSelected');
  if (!chipsEl) return;
  chipsEl.innerHTML = '';
  (selectedReferenceIds || []).forEach(id => {
    const project = (refProjects || []).find(p => String(p.id) === String(id));
    if (!project) return;
    const chip = document.createElement('span');
    chip.className = 'badge bg-secondary me-2 mb-2';
    chip.textContent = project.title || project.name || 'Proyecto';
    chip.style.cursor = 'pointer';
    chip.title = 'Quitar referencia';
    chip.onclick = () => toggleReference(project.id, false);
    chipsEl.appendChild(chip);
  });
}

// Renderizar grilla con paginación 5/10/20 y botones Ver/Seleccionar
function renderRefGrid() {
  const gridEl = document.getElementById('budgetRefGrid');
  if (!gridEl) return;
  const all = Array.isArray(filteredProjectsCache) ? filteredProjectsCache : (refProjects || []);

  const sizeSelect = document.getElementById('budgetRefPageSize');
  const pageSize = sizeSelect ? Number(sizeSelect.value) || 10 : 10;
  const start = (refPage || 0) * pageSize;
  const slice = all.slice(start, start + pageSize);

  gridEl.innerHTML = '';

  slice.forEach(p => {
    const card = document.createElement('div');
    card.className = 'card m-2';
    card.style.width = '220px';
    const imgSrc = getImagePathForOrigin(p.thumbnail || '', referencesOrigin || null);
    const isSelected = (selectedReferenceIds || []).includes(p.id);
    card.innerHTML = `
      <img src="${imgSrc}" class="card-img-top" alt="${p.title || ''}" style="height:120px;object-fit:cover;"/>
      <div class="card-body p-2">
        <div class="d-flex align-items-center justify-content-between">
          <span class="small">${p.title || p.name || ''}</span>
          <div class="btn-group">
            <button type="button" class="btn btn-sm btn-outline-primary" data-action="view">Ver</button>
            <button type="button" class="btn btn-sm ${isSelected ? 'btn-success' : 'btn-outline-success'}" data-action="toggle">${isSelected ? '✓' : '+'}</button>
          </div>
        </div>
      </div>
    `;
    const viewBtn = card.querySelector('[data-action="view"]');
    const toggleBtn = card.querySelector('[data-action="toggle"]');
    viewBtn.onclick = () => showReferencePreview(p.id);
    toggleBtn.onclick = () => toggleReference(p.id);
    gridEl.appendChild(card);
  });

  const totalPages = Math.max(1, Math.ceil(all.length / pageSize));
  const pageLabel = document.getElementById('budgetRefPageLabel');
  if (pageLabel) pageLabel.textContent = `${(refPage || 0) + 1} / ${totalPages}`;
  const prevBtn = document.getElementById('budgetRefPrev');
  const nextBtn = document.getElementById('budgetRefNext');
  if (prevBtn) prevBtn.disabled = (refPage || 0) <= 0;
  if (nextBtn) nextBtn.disabled = (refPage || 0) >= (totalPages - 1);
}

function getFilteredProjects() {
  const tags = Array.from(selectedRefTagNames || []);
  if (!tags.length) return refProjects || [];
  return (refProjects || []).filter(p => Array.isArray(p.tags) && tags.every(t => p.tags.includes(t)));
}

function ensureRefGridControls() {
  const controlsHost = document.getElementById('budgetRefControlsHost');
  const gridEl = document.getElementById('budgetRefGrid');
  if (!gridEl) return;
  if (!controlsHost) {
    const wrapper = document.createElement('div');
    wrapper.id = 'budgetRefControlsHost';
    wrapper.className = 'd-flex align-items-center justify-content-between my-2';
    wrapper.innerHTML = `
      <div class="d-flex align-items-center gap-2">
        <label class="me-1 small">Items por página:</label>
        <select id="budgetRefPageSize" class="form-select form-select-sm" style="width:90px">
          <option value="5">5</option>
          <option value="10" selected>10</option>
          <option value="20">20</option>
        </select>
      </div>
      <div class="d-flex align-items-center gap-2">
        <button id="budgetRefPrev" type="button" class="btn btn-sm btn-outline-secondary">Prev</button>
        <span id="budgetRefPageLabel" class="small">1 / 1</span>
        <button id="budgetRefNext" type="button" class="btn btn-sm btn-outline-secondary">Next</button>
      </div>
    `;
    gridEl.parentElement.insertBefore(wrapper, gridEl);
    const pageSizeSelect = wrapper.querySelector('#budgetRefPageSize');
    pageSizeSelect.onchange = () => { refPage = 0; renderRefGrid(); };
    wrapper.querySelector('#budgetRefPrev').onclick = () => { if ((refPage || 0) > 0) { refPage--; renderRefGrid(); } };
    wrapper.querySelector('#budgetRefNext').onclick = () => {
      const all = Array.isArray(filteredProjectsCache) ? filteredProjectsCache : (refProjects || []);
      const pageSize = Number(pageSizeSelect.value) || 10;
      const totalPages = Math.max(1, Math.ceil(all.length / pageSize));
      if ((refPage || 0) < totalPages - 1) { refPage++; renderRefGrid(); }
    };
  }
}

function applyTagFilter(tagName, isMultiSelect) {
  const tagButtons = document.querySelectorAll('#budgetRefTags .btn');
  if (!isMultiSelect) selectedRefTagNames.clear();
  if (tagName) {
    if (selectedRefTagNames.has(tagName) && isMultiSelect) {
      selectedRefTagNames.delete(tagName);
    } else {
      selectedRefTagNames.add(tagName);
    }
  }
  tagButtons.forEach(btn => {
    const t = btn.dataset.tag;
    btn.classList.toggle('btn-primary', selectedRefTagNames.has(t));
    btn.classList.toggle('btn-outline-primary', !selectedRefTagNames.has(t));
  });
  filteredProjectsCache = getFilteredProjects();
  refPage = 0;
  renderRefGrid();
}

function initReferencePicker(selectedRefs = []) {
  selectedReferenceIds = Array.isArray(selectedRefs) ? selectedRefs.map(String) : [];
  const base = document.getElementById('btnRefOriginVps')?.classList.contains('active')
    ? 'https://vps-4455523-x.dattaweb.com/jpupper/api'
    : 'http://localhost:3243/api';
  fetch(`${base}/projects`).then(r => r.json()).then(projects => {
    refProjects = projects || [];
    const tagsContainer = document.getElementById('budgetRefTags');
    if (tagsContainer) {
      const tagSet = new Set();
      refProjects.forEach(p => (p.tags || []).forEach(t => tagSet.add(t)));
      tagsContainer.innerHTML = '';
      Array.from(tagSet).sort().forEach(t => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'btn btn-sm btn-outline-primary me-2 mb-2';
        b.dataset.tag = t;
        b.textContent = t;
        b.onclick = (e) => applyTagFilter(t, (e.ctrlKey || e.metaKey));
        tagsContainer.appendChild(b);
      });
    }
    ensureRefGridControls();
    filteredProjectsCache = getFilteredProjects();
    refPage = 0;
    renderRefGrid();
    syncSelectedChips();
    if (selectedReferenceIds.length) showReferencePreview(selectedReferenceIds[0]);
  }).catch(err => console.error('Error cargando proyectos para selector:', err));
}
