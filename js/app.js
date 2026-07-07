// js/app.js
// State aplikasi
const AppState = {
    currentCategory: 'work',
    currentView: 'dashboard',
    isEditing: false,
    editIndex: null,
    data: null,
    storage: githubStorage,
    isLoading: false
};

// Inisialisasi aplikasi
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Portfolio App Starting...');
    
    // Tampilkan loading
    showLoading(true, 'Memuat data dari GitHub...');
    
    // Load data
    await loadAppData();
    
    // Setup UI
    setupNavigation();
    setupEventListeners();
    updateDashboardStats();
    loadCategoryData('work');
    updateCVPreview();
    
    // Increment visitor counter
    AppState.storage.incrementVisits();
    
    // Tampilkan toast welcome
    showToast('✅ Data berhasil dimuat!', 'success');
    
    showLoading(false);
    
    // Auto-save setiap 30 detik jika ada perubahan
    setInterval(() => {
        if (AppState.hasChanges) {
            saveAppData();
            AppState.hasChanges = false;
        }
    }, 30000);
});

// Load data dari GitHub
async function loadAppData() {
    try {
        const data = await AppState.storage.loadData();
        if (data) {
            AppState.data = data;
            console.log('✅ Data loaded:', data);
            return true;
        }
    } catch (error) {
        console.error('❌ Load error:', error);
        showToast('⚠️ Gagal memuat data dari GitHub, menggunakan data lokal', 'warning');
    }
    return false;
}

// Save data ke GitHub
async function saveAppData() {
    if (!AppState.data) return false;
    
    try {
        AppState.data.metadata.lastUpdated = new Date().toISOString();
        const success = await AppState.storage.saveData(AppState.data);
        
        if (success) {
            showToast('✅ Data tersimpan ke GitHub!', 'success');
            return true;
        } else {
            showToast('⚠️ Gagal menyimpan ke GitHub, data tersimpan lokal', 'warning');
        }
    } catch (error) {
        console.error('❌ Save error:', error);
        showToast('❌ Error menyimpan data', 'danger');
    }
    return false;
}

// Setup Navigasi
function setupNavigation() {
    // Navigasi utama
    document.querySelectorAll('[data-nav]').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const target = this.dataset.nav;
            navigateTo(target);
        });
    });
    
    // Cek admin
    if (authManager.isAdmin()) {
        document.body.classList.add('admin-mode');
        showAdminFeatures();
    }
}

// Navigasi halaman
function navigateTo(page) {
    // Sembunyikan semua section
    document.querySelectorAll('.page-section').forEach(section => {
        section.style.display = 'none';
        section.classList.remove('active');
    });
    
    // Tampilkan section yang dipilih
    const targetSection = document.getElementById(`${page}-section`);
    if (targetSection) {
        targetSection.style.display = 'block';
        targetSection.classList.add('active');
        AppState.currentView = page;
        
        // Update active nav
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[data-nav="${page}"]`)?.classList.add('active');
    }
    
    // Load data sesuai halaman
    if (page === 'dashboard') updateDashboardStats();
    if (page === 'cv') updateCVPreview();
}

// Setup Event Listeners
function setupEventListeners() {
    // Login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const username = document.getElementById('login-username').value;
            const password = document.getElementById('login-password').value;
            
            const success = await authManager.login(username, password);
            if (success) {
                document.body.classList.add('admin-mode');
                showAdminFeatures();
                showToast('✅ Login berhasil!', 'success');
                
                // Tutup modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
                modal?.hide();
                
                // Reload data
                await loadAppData();
                updateDashboardStats();
            } else {
                showToast('❌ Username atau password salah!', 'danger');
            }
        });
    }
    
    // Logout button
    document.getElementById('btn-logout')?.addEventListener('click', () => {
        authManager.logout();
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Ctrl+S untuk save
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            if (authManager.isAdmin()) {
                saveAppData();
            }
        }
        
        // Escape untuk close modal
        if (e.key === 'Escape') {
            const openModal = document.querySelector('.modal.show');
            if (openModal) {
                bootstrap.Modal.getInstance(openModal)?.hide();
            }
        }
    });
}

// Tampilkan fitur admin
function showAdminFeatures() {
    document.querySelectorAll('.admin-only').forEach(el => {
        el.style.display = 'block';
    });
    
    document.querySelectorAll('.public-only').forEach(el => {
        el.style.display = 'none';
    });
    
    // Update navbar
    const adminMenu = document.getElementById('admin-menu');
    if (adminMenu) {
        adminMenu.innerHTML = `
            <li class="nav-item dropdown">
                <a class="nav-link dropdown-toggle" href="#" data-bs-toggle="dropdown">
                    <i class="bi bi-shield-lock-fill"></i> Admin Panel
                </a>
                <ul class="dropdown-menu dropdown-menu-end">
                    <li><a class="dropdown-item" href="#" onclick="syncFromGitHub()">
                        <i class="bi bi-cloud-download"></i> Sync dari GitHub
                    </a></li>
                    <li><a class="dropdown-item" href="#" onclick="forceSaveToGitHub()">
                        <i class="bi bi-cloud-upload"></i> Force Save
                    </a></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item" href="#" onclick="showVersionHistory()">
                        <i class="bi bi-clock-history"></i> Version History
                    </a></li>
                    <li><a class="dropdown-item" href="#" onclick="exportAllData()">
                        <i class="bi bi-download"></i> Export Backup
                    </a></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item text-danger" href="#" onclick="authManager.logout()">
                        <i class="bi bi-box-arrow-right"></i> Logout
                    </a></li>
                </ul>
            </li>
        `;
    }
}

// Update Dashboard Statistics
function updateDashboardStats() {
    if (!AppState.data) return;
    
    const stats = {
        'stat-work': AppState.data.work?.length || 0,
        'stat-organization': AppState.data.organization?.length || 0,
        'stat-training': AppState.data.training?.length || 0,
        'stat-certificate': AppState.data.certificate?.length || 0,
        'stat-education': AppState.data.education?.length || 0,
        'stat-skill': AppState.data.skill?.length || 0,
        'stat-project': AppState.data.project?.length || 0
    };
    
    Object.entries(stats).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            // Animasi counting
            animateValue(element, 0, value, 500);
        }
    });
    
    // Update last sync time
    const syncTime = document.getElementById('last-sync');
    if (syncTime && AppState.storage.lastSync) {
        syncTime.textContent = new Date(AppState.storage.lastSync).toLocaleString('id-ID');
    }
    
    // Update visitor count
    const visitorCount = document.getElementById('visitor-count');
    if (visitorCount && AppState.data.metadata) {
        visitorCount.textContent = AppState.data.metadata.totalVisits || 0;
    }
}

// Animasi angka
function animateValue(element, start, end, duration) {
    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
            element.textContent = Math.round(end);
            clearInterval(timer);
        } else {
            element.textContent = Math.round(current);
        }
    }, 16);
}

// Loading indicator
function showLoading(show, message = 'Loading...') {
    const loader = document.getElementById('loading-overlay');
    if (!loader) {
        // Buat loading overlay jika belum ada
        const overlay = document.createElement('div');
        overlay.id = 'loading-overlay';
        overlay.innerHTML = `
            <div class="loading-content">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-2" id="loading-message">${message}</p>
            </div>
        `;
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(255,255,255,0.9);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
        `;
        document.body.appendChild(overlay);
    }
    
    const loadingOverlay = document.getElementById('loading-overlay');
    const loadingMessage = document.getElementById('loading-message');
    
    if (show) {
        loadingOverlay.style.display = 'flex';
        if (loadingMessage) loadingMessage.textContent = message;
    } else {
        loadingOverlay.style.display = 'none';
    }
}

// Toast notification
function showToast(message, type = 'info') {
    // Buat container toast jika belum ada
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
        `;
        document.body.appendChild(toastContainer);
    }
    
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    
    const toast = document.createElement('div');
    toast.className = `alert alert-${type} alert-dismissible fade show`;
    toast.innerHTML = `
        ${icons[type] || ''} ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    toast.style.animation = 'slideInRight 0.3s ease-out';
    
    toastContainer.appendChild(toast);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Sync dari GitHub (admin)
async function syncFromGitHub() {
    showLoading(true, 'Syncing dari GitHub...');
    const success = await loadAppData();
    if (success) {
        updateDashboardStats();
        loadCategoryData(AppState.currentCategory);
        updateCVPreview();
        showToast('✅ Data berhasil disinkronkan!', 'success');
    }
    showLoading(false);
}

// Force save (admin)
async function forceSaveToGitHub() {
    showLoading(true, 'Menyimpan ke GitHub...');
    const success = await saveAppData();
    showLoading(false);
    if (success) {
        showToast('✅ Data berhasil disimpan ke GitHub!', 'success');
    }
}

// Show version history
async function showVersionHistory() {
    showLoading(true, 'Memuat history...');
    const history = await AppState.storage.getHistory();
    showLoading(false);
    
    if (history && history.length > 0) {
        let historyHTML = history.map((commit, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${commit.message}</td>
                <td>${new Date(commit.date).toLocaleString('id-ID')}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="rollbackTo('${commit.sha}')">
                        <i class="bi bi-arrow-counterclockwise"></i> Rollback
                    </button>
                </td>
            </tr>
        `).join('');
        
        const modal = new bootstrap.Modal(document.getElementById('historyModal'));
        document.getElementById('history-table-body').innerHTML = historyHTML;
        modal.show();
    } else {
        showToast('Belum ada history perubahan', 'info');
    }
}

// Rollback
async function rollbackTo(sha) {
    if (confirm('Rollback ke versi ini? Data saat ini akan ditimpa.')) {
        showLoading(true, 'Melakukan rollback...');
        const data = await AppState.storage.rollback(sha);
        if (data) {
            AppState.data = data;
            updateDashboardStats();
            loadCategoryData(AppState.currentCategory);
            updateCVPreview();
            showToast('✅ Rollback berhasil!', 'success');
        }
        showLoading(false);
    }
}
