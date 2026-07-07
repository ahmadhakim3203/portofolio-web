// js/export.js
// Export semua data sebagai JSON
function exportAllData() {
    if (!AppState.data) {
        showToast('⚠️ Tidak ada data untuk diexport!', 'warning');
        return;
    }
    
    const dataStr = JSON.stringify(AppState.data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `portfolio-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showToast('✅ Data berhasil diexport!', 'success');
}

// Import data dari JSON
function importData() {
    if (!authManager.isAdmin()) {
        showToast('⚠️ Anda harus login sebagai admin!', 'warning');
        return;
    }
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = async function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = async function(event) {
            try {
                const importedData = JSON.parse(event.target.result);
                
                if (confirm('⚠️ Data yang ada akan ditimpa dengan data dari file. Lanjutkan?')) {
                    AppState.data = importedData;
                    AppState.hasChanges = true;
                    
                    await saveAppData();
                    updateDashboardStats();
                    loadCategoryData(AppState.currentCategory);
                    updateCVPreview();
                    
                    showToast('✅ Data berhasil diimpor!', 'success');
                }
            } catch (error) {
                showToast('❌ File JSON tidak valid!', 'danger');
            }
        };
        reader.readAsText(file);
    };
    
    input.click();
}

// Export ke CSV
function exportToCSV(category) {
    if (!AppState.data || !AppState.data[category]) {
        showToast('⚠️ Tidak ada data!', 'warning');
        return;
    }
    
    const items = AppState.data[category];
    if (items.length === 0) {
        showToast('⚠️ Kategori kosong!', 'warning');
        return;
    }
    
    // Ambil semua keys
    const headers = [...new Set(items.flatMap(item => Object.keys(item)))];
    
    // Buat CSV
    let csv = headers.join(',') + '\n';
    
    items.forEach(item => {
        const row = headers.map(header => {
            let value = (item[header] || '').toString();
            // Escape commas dan quotes
            if (value.includes(',') || value.includes('"') || value.includes('\n')) {
                value = `"${value.replace(/"/g, '""')}"`;
            }
            return value;
        });
        csv += row.join(',') + '\n';
    });
    
    // Download
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${category}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    
    showToast('✅ CSV berhasil diexport!', 'success');
}
