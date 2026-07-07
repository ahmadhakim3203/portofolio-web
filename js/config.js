// js/config.js
// ⚠️ GANTI DENGAN DATA GITHUB ANDA!

const GITHUB_CONFIG = {
    // Username GitHub Anda
    username: 'ahmadhakim3203',
    
    // Nama repository
    repo: 'portofolio-web',
    
    // Branch yang digunakan
    branch: 'main',
    
    // Path file JSON di repository
    dataPath: 'data/portfolio.json',
    
    // Personal Access Token GitHub
    // Cara dapatkan: GitHub Settings > Developer settings > Personal access tokens > Tokens (classic)
    // Izinkan akses: repo (semua)
    token: 'ghp_xxxxxxxxxxxxxxxxxxxx', // GANTI INI!
    
    // Kredensial Admin
    admin: {
        username: 'admin',
        password: 'admin123456' // GANTI dengan password kuat!
    }
};

// Jangan commit token ke repository publik!
// Untuk production, gunakan environment variable atau secrets
