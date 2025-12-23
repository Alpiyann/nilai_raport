const express = require('express');
const cors = require('cors');
const session = require('express-session');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'portal-akademik-secret-key-2024',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false, // Set to true in production with HTTPS
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Import routes
const authRoutes = require('./routes/auth');
const mapelRoutes = require('./routes/mapel');
const nilaiRoutes = require('./routes/nilai');
const rekomendasiRoutes = require('./routes/rekomendasi');
const dashboardRoutes = require('./routes/dashboard');

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/mapel', mapelRoutes);
app.use('/api/nilai', nilaiRoutes);
app.use('/api/rekomendasi', rekomendasiRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Serve frontend pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'pages', 'login.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'pages', 'dashboard.html'));
});

app.get('/mapel', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'pages', 'mapel.html'));
});

app.get('/nilai', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'pages', 'nilai.html'));
});

app.get('/rekomendasi', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'pages', 'rekomendasi.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🎓 Portal Akademik Server Running                        ║
║                                                            ║
║   Local:    http://localhost:${PORT}                         ║
║   Status:   Ready                                          ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
    `);
});

module.exports = app;
