// js/auth.js
class AuthManager {
    constructor() {
        this.sessionKey = 'portfolio_admin_session';
        this.sessionDuration = 24 * 60 * 60 * 1000; // 24 jam
    }

    // Login
    async login(username, password) {
        // Cek kredensial
        if (username === GITHUB_CONFIG.admin.username && 
            password === GITHUB_CONFIG.admin.password) {
            
            // Buat session
            const session = {
                username: username,
                loginTime: new Date().toISOString(),
                expires: new Date().getTime() + this.sessionDuration,
                token: this.generateToken()
            };
            
            sessionStorage.setItem(this.sessionKey, JSON.stringify(session));
            
            // Catat login
            console.log('✅ Admin logged in');
            return true;
        }
        return false;
    }

    // Logout
    logout() {
        sessionStorage.removeItem(this.sessionKey);
        localStorage.removeItem('portfolioData_backup');
        console.log('👋 Admin logged out');
        
        // Reload halaman
        window.location.href = 'index.html';
    }

    // Cek apakah user adalah admin
    isAdmin() {
        const session = this.getSession();
        if (!session) return false;
        
        // Cek expired
        if (new Date().getTime() > session.expires) {
            this.logout();
            return false;
        }
        
        return true;
    }

    // Ambil session
    getSession() {
        const sessionData = sessionStorage.getItem(this.sessionKey);
        return sessionData ? JSON.parse(sessionData) : null;
    }

    // Generate token random
    generateToken() {
        return Math.random().toString(36).substring(2) + 
               Date.now().toString(36);
    }

    // Proteksi halaman admin
    requireAdmin() {
        if (!this.isAdmin()) {
            window.location.href = 'index.html';
            return false;
        }
        return true;
    }

    // Update session
    refreshSession() {
        const session = this.getSession();
        if (session) {
            session.expires = new Date().getTime() + this.sessionDuration;
            sessionStorage.setItem(this.sessionKey, JSON.stringify(session));
        }
    }
}

const authManager = new AuthManager();

// Auto refresh session setiap aktivitas
document.addEventListener('click', () => authManager.refreshSession());
document.addEventListener('keypress', () => authManager.refreshSession());
