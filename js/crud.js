// js/crud.js
// Load category data
function loadCategoryData(category) {
    AppState.currentCategory = category;
    
    // Update title
    const titles = {
        work: '💼 Pengalaman Kerja',
        organization: '👥 Organisasi',
        training: '📚 Pelatihan & Webinar',
        certificate: '🎖️ Sertifikat',
        education: '🎓 Pendidikan',
        skill: '⚡ Keahlian',
        project: '🚀 Proyek',
        language: '🌐 Bahasa'
    };
    
    const titleElement = document.getElementById('category-title');
    if (titleElement) {
        titleElement.textContent = titles[category] || category;
    }
    
    // Update active sidebar
    document.querySelectorAll('.category-link').forEach(link => {
        link.classList.remove('active');
    });
    document.querySelector(`[data-category="${category}"]`)?.classList.add('active');
    
    // Load items
    const items = AppState.data?.[category] || [];
    renderItems(items, category);
}

// Render items
function renderItems(items, category) {
    const container = document.getElementById('items-container');
    if (!container) return;
    
    if (!items || items.length === 0) {
        container.innerHTML = `
            <div class="empty-state text-center py-5">
                <i class="bi bi-inbox display-1 text-muted"></i>
                <h4 class="text-muted mt-3">Belum ada data</h4>
                <p class="text-muted">Klik tombol "Tambah" untuk menambahkan item</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = items.map((item, index) => `
        <div class="item-card fade-in" data-index="${index}">
            <div class="row">
                <div class="col-md-9">
                    <div class="d-flex align-items-start">
                        ${item.logo ? `<img src="${item.logo}" class="item-logo me-3" alt="logo">` : ''}
                        <div>
                            <h5 class="item-title">${item.title || 'Untitled'}</h5>
                            <p class="item-subtitle text-primary">
                                ${item.company || item.organization || item.institution || ''}
                            </p>
                            ${item.position ? `<p class="item-position"><i class="bi bi-person-badge"></i> ${item.position}</p>` : ''}
                            <p class="item-date">
                                <i class="bi bi-calendar3"></i>
                                ${formatDate(item.startDate)} ${item.endDate ? ' - ' + formatDate(item.endDate) : '- Sekarang'}
                            </p>
                            <p class="item-description">${item.description || ''}</p>
                            ${item.tags ? renderTags(item.tags) : ''}
                        </div>
                    </div>
                </div>
                ${authManager.isAdmin() ? `
                <div class="col-md-3 text-end">
                    <div class="btn-group">
                        <button class="btn btn-sm btn-outline-primary" onclick="editItem('${category}', ${index})" title="Edit">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteItem('${category}', ${index})" title="Hapus">
                            <i class="bi bi-trash"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-secondary" onclick="moveItem('${category}', ${index}, 'up')" title="Naik" ${index === 0 ? 'disabled' : ''}>
                            <i class="bi bi-arrow-up"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-secondary" onclick="moveItem('${category}', ${index}, 'down')" title="Turun" ${index === items.length - 1 ? 'disabled' : ''}>
                            <i class="bi bi-arrow-down"></i>
                        </button>
                    </div>
                </div>
                ` : ''}
            </div>
        </div>
    `).join('');
}

// Render tags
function renderTags(tags) {
    if (typeof tags === 'string') {
        tags = tags.split(',').map(t => t.trim());
    }
    
    return `
        <div class="item-tags mt-2">
            ${tags.map(tag => `
                <span class="badge bg-primary me-1">${tag}</span>
            `).join('')}
        </div>
    `;
}

// Format date
function formatDate(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long' };
    return date.toLocaleDateString('id-ID', options);
}

// Add new item
function addNewItem() {
    if (!authManager.isAdmin()) {
        showToast('⚠️ Anda harus login sebagai admin!', 'warning');
        return;
    }
    
    AppState.editIndex = null;
    AppState.isEditing = false;
    
    const modal = new bootstrap.Modal(document.getElementById('itemModal'));
    document.getElementById('modal-title').textContent = '➕ Tambah Item Baru';
    document.getElementById('modal-body').innerHTML = generateFormHTML(AppState.currentCategory);
    modal.show();
}

// Edit item
function editItem(category, index) {
    if (!authManager.isAdmin()) {
        showToast('⚠️ Anda harus login sebagai admin!', 'warning');
        return;
    }
    
    AppState.editIndex = index;
    AppState.isEditing = true;
    AppState.currentCategory = category;
    
    const item = AppState.data[category][index];
    const modal = new bootstrap.Modal(document.getElementById('itemModal'));
    document.getElementById('modal-title').textContent = '✏️ Edit Item';
    document.getElementById('modal-body').innerHTML = generateFormHTML(category, item);
    modal.show();
}

// Save item
async function saveItem() {
    const category = AppState.currentCategory;
    const formData = getFormData();
    
    // Validasi
    if (!formData.title) {
        showToast('⚠️ Judul harus diisi!', 'warning');
        return;
    }
    
    if (!AppState.data[category]) {
        AppState.data[category] = [];
    }
    
    if (AppState.isEditing && AppState.editIndex !== null) {
        // Update existing
        AppState.data[category][AppState.editIndex] = formData;
    } else {
        // Add new
        AppState.data[category].push(formData);
    }
    
    // Update metadata
    AppState.data.metadata.lastUpdated = new Date().toISOString();
    AppState.hasChanges = true;
    
    // Save to GitHub
    await saveAppData();
    
    // Refresh UI
    loadCategoryData(category);
    updateDashboardStats();
    updateCVPreview();
    
    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('itemModal'));
    modal.hide();
    
    showToast('✅ Item berhasil disimpan!', 'success');
}

// Delete item
async function deleteItem(category, index) {
    if (!authManager.isAdmin()) {
        showToast('⚠️ Anda harus login sebagai admin!', 'warning');
        return;
    }
    
    if (confirm('Apakah Anda yakin ingin menghapus item ini? Tindakan ini tidak dapat dibatalkan.')) {
        AppState.data[category].splice(index, 1);
        AppState.hasChanges = true;
        
        await saveAppData();
        loadCategoryData(category);
        updateDashboardStats();
        updateCVPreview();
        
        showToast('🗑️ Item berhasil dihapus', 'warning');
    }
}

// Move item
async function moveItem(category, index, direction) {
    const items = AppState.data[category];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (newIndex >= 0 && newIndex < items.length) {
        // Swap
        [items[index], items[newIndex]] = [items[newIndex], items[index]];
        AppState.hasChanges = true;
        
        await saveAppData();
        loadCategoryData(category);
    }
}

// Generate form based on category
function generateFormHTML(category, data = {}) {
    const forms = {
        work: `
            <div class="mb-3">
                <label class="form-label">Posisi / Jabatan *</label>
                <input type="text" class="form-control" name="title" value="${data.title || ''}" required>
            </div>
            <div class="mb-3">
                <label class="form-label">Perusahaan</label>
                <input type="text" class="form-control" name="company" value="${data.company || ''}">
            </div>
            <div class="mb-3">
                <label class="form-label">Logo Perusahaan (URL)</label>
                <input type="url" class="form-control" name="logo" value="${data.logo || ''}" placeholder="https://example.com/logo.png">
            </div>
            <div class="row">
                <div class="col-md-6 mb-3">
                    <label class="form-label">Tanggal Mulai</label>
                    <input type="date" class="form-control" name="startDate" value="${data.startDate || ''}">
                </div>
                <div class="col-md-6 mb-3">
                    <label class="form-label">Tanggal Selesai</label>
                    <input type="date" class="form-control" name="endDate" value="${data.endDate || ''}">
                    <small class="text-muted">Kosongkan jika masih bekerja</small>
                </div>
            </div>
            <div class="mb-3">
                <label class="form-label">Deskripsi Pekerjaan</label>
                <textarea class="form-control" name="description" rows="4">${data.description || ''}</textarea>
            </div>
            <div class="mb-3">
                <label class="form-label">Skills / Tags</label>
                <input type="text" class="form-control" name="tags" value="${data.tags || ''}" placeholder="Pisahkan dengan koma">
            </div>
        `,
        training: `
            <div class="mb-3">
                <label class="form-label">Nama Pelatihan / Webinar *</label>
                <input type="text" class="form-control" name="title" value="${data.title || ''}" required>
            </div>
            <div class="mb-3">
                <label class="form-label">Penyelenggara</label>
                <input type="text" class="form-control" name="organization" value="${data.organization || ''}">
            </div>
            <div class="mb-3">
                <label class="form-label">Tanggal</label>
                <input type="date" class="form-control" name="startDate" value="${data.startDate || ''}">
            </div>
            <div class="mb-3">
                <label class="form-label">Durasi (jam)</label>
                <input type="number" class="form-control" name="duration" value="${data.duration || ''}">
            </div>
            <div class="mb-3">
                <label class="form-label">Deskripsi</label>
                <textarea class="form-control" name="description" rows="3">${data.description || ''}</textarea>
            </div>
            <div class="mb-3">
                <label class="form-label">Link Sertifikat</label>
                <input type="url" class="form-control" name="certificateUrl" value="${data.certificateUrl || ''}">
            </div>
        `,
        skill: `
            <div class="mb-3">
                <label class="form-label">Nama Keahlian *</label>
                <input type="text" class="form-control" name="title" value="${data.title || ''}" required>
            </div>
            <div class="mb-3">
                <label class="form-label">Kategori</label>
                <select class="form-select" name="category">
                    <option value="technical" ${data.category === 'technical' ? 'selected' : ''}>Technical Skill</option>
                    <option value="soft" ${data.category === 'soft' ? 'selected' : ''}>Soft Skill</option>
                    <option value="language" ${data.category === 'language' ? 'selected' : ''}>Bahasa</option>
                    <option value="other" ${data.category === 'other' ? 'selected' : ''}>Lainnya</option>
                </select>
            </div>
            <div class="mb-3">
                <label class="form-label">Level (1-100)</label>
                <input type="range" class="form-range" name="level" min="1" max="100" value="${data.level || 50}" oninput="document.getElementById('level-value').textContent = this.value + '%'">
                <small class="text-muted">Level: <span id="level-value">${data.level || 50}%</span></small>
            </div>
        `
    };
    
    return forms[category] || `
        <div class="mb-3">
            <label class="form-label">Judul *</label>
            <input type="text" class="form-control" name="title" value="${data.title || ''}" required>
        </div>
        <div class="mb-3">
            <label class="form-label">Deskripsi</label>
            <textarea class="form-control" name="description" rows="3">${data.description || ''}</textarea>
        </div>
    `;
}

// Get form data
function getFormData() {
    const formElements = document.querySelectorAll('#modal-body [name]');
    const data = {};
    
    formElements.forEach(element => {
        if (element.type === 'checkbox') {
            data[element.name] = element.checked;
        } else if (element.type === 'number' || element.name === 'level') {
            data[element.name] = Number(element.value) || 0;
        } else {
            data[element.name] = element.value;
        }
    });
    
    return data;
}
