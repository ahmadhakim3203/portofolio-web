// js/github-storage.js
class GitHubStorage {
    constructor(config) {
        this.config = config;
        this.apiBase = 'https://api.github.com';
        this.dataCache = null;
        this.lastSync = null;
    }

    // Headers untuk API GitHub
    getHeaders() {
        return {
            'Authorization': `token ${this.config.token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/vnd.github.v3+json'
        };
    }

    // Ambil data dari GitHub
    async loadData() {
        try {
            const url = `${this.apiBase}/repos/${this.config.username}/${this.config.repo}/contents/${this.config.dataPath}`;
            
            const response = await fetch(url, {
                headers: this.getHeaders()
            });

            if (response.ok) {
                const fileData = await response.json();
                // Decode base64 content
                const content = atob(fileData.content.replace(/\n/g, ''));
                const data = JSON.parse(content);
                
                this.dataCache = data;
                this.lastSync = new Date();
                
                // Simpan SHA untuk update nanti
                this.currentSHA = fileData.sha;
                
                console.log('✅ Data loaded from GitHub');
                return data;
            } else if (response.status === 404) {
                // File belum ada, buat baru
                console.log('⚠️ Data file not found, creating new...');
                const defaultData = this.getDefaultData();
                await this.createFile(defaultData);
                return defaultData;
            } else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
        } catch (error) {
            console.error('❌ Load data error:', error);
            // Fallback ke localStorage
            const localData = localStorage.getItem('portfolioData');
            return localData ? JSON.parse(localData) : this.getDefaultData();
        }
    }

    // Simpan data ke GitHub
    async saveData(data) {
        try {
            const url = `${this.apiBase}/repos/${this.config.username}/${this.config.repo}/contents/${this.config.dataPath}`;
            
            const body = {
                message: `📝 Update portfolio data - ${new Date().toLocaleString('id-ID')}`,
                content: btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2)))),
                branch: this.config.branch
            };

            // Jika file sudah ada, tambahkan SHA
            if (this.currentSHA) {
                body.sha = this.currentSHA;
            }

            const response = await fetch(url, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify(body)
            });

            if (response.ok) {
                const result = await response.json();
                this.currentSHA = result.content.sha;
                this.dataCache = data;
                this.lastSync = new Date();
                
                // Backup ke localStorage
                localStorage.setItem('portfolioData', JSON.stringify(data));
                
                console.log('✅ Data saved to GitHub');
                return true;
            } else {
                const error = await response.json();
                throw new Error(error.message || 'Save failed');
            }
        } catch (error) {
            console.error('❌ Save data error:', error);
            
            // Simpan ke localStorage sebagai backup
            localStorage.setItem('portfolioData', JSON.stringify(data));
            localStorage.setItem('portfolioData_backup', JSON.stringify({
                timestamp: new Date().toISOString(),
                data: data
            }));
            
            return false;
        }
    }

    // Buat file baru di GitHub
    async createFile(data) {
        try {
            const url = `${this.apiBase}/repos/${this.config.username}/${this.config.repo}/contents/${this.config.dataPath}`;
            
            const body = {
                message: '🎉 Initialize portfolio data',
                content: btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2)))),
                branch: this.config.branch
            };

            const response = await fetch(url, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify(body)
            });

            if (response.ok) {
                const result = await response.json();
                this.currentSHA = result.content.sha;
                this.dataCache = data;
                console.log('✅ New file created on GitHub');
                return true;
            }
        } catch (error) {
            console.error('❌ Create file error:', error);
        }
        return false;
    }

    // Ambil history commit (untuk version control)
    async getHistory() {
        try {
            const url = `${this.apiBase}/repos/${this.config.username}/${this.config.repo}/commits?path=${this.config.dataPath}&per_page=10`;
            
            const response = await fetch(url, {
                headers: this.getHeaders()
            });

            if (response.ok) {
                const commits = await response.json();
                return commits.map(commit => ({
                    sha: commit.sha,
                    message: commit.commit.message,
                    date: commit.commit.author.date,
                    author: commit.commit.author.name
                }));
            }
        } catch (error) {
            console.error('❌ Get history error:', error);
        }
        return [];
    }

    // Rollback ke versi sebelumnya
    async rollback(commitSHA) {
        try {
            // Ambil data dari commit tertentu
            const url = `${this.apiBase}/repos/${this.config.username}/${this.config.repo}/contents/${this.config.dataPath}?ref=${commitSHA}`;
            
            const response = await fetch(url, {
                headers: this.getHeaders()
            });

            if (response.ok) {
                const fileData = await response.json();
                const content = atob(fileData.content.replace(/\n/g, ''));
                const data = JSON.parse(content);
                
                // Simpan data ini
                await this.saveData(data);
                return data;
            }
        } catch (error) {
            console.error('❌ Rollback error:', error);
        }
        return null;
    }

    // Data default jika kosong
    getDefaultData() {
        return {
            metadata: {
                version: '1.0.0',
                lastUpdated: new Date().toISOString(),
                totalVisits: 0
            },
            personal: {
                name: 'Nama Anda',
                title: 'Professional Title',
                email: 'email@example.com',
                phone: '+62 812-3456-7890',
                linkedin: 'linkedin.com/in/username',
                github: 'github.com/username',
                website: '',
                photo: '',
                summary: 'Tulis ringkasan profesional Anda di sini...',
                location: 'Kota, Indonesia'
            },
            work: [],
            organization: [],
            training: [],
            certificate: [],
            education: [],
            skill: [],
            project: [],
            language: [],
            social: []
        };
    }

    // Hit counter (opsional)
    async incrementVisits() {
        if (this.dataCache && this.dataCache.metadata) {
            this.dataCache.metadata.totalVisits = (this.dataCache.metadata.totalVisits || 0) + 1;
            // Simpan setiap 10 kunjungan untuk mengurangi API calls
            if (this.dataCache.metadata.totalVisits % 10 === 0) {
                await this.saveData(this.dataCache);
            }
        }
    }
}

// Inisialisasi storage
const githubStorage = new GitHubStorage(GITHUB_CONFIG);
