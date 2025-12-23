const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { db, initDatabase, seedPTNData } = require('../config/database');
const { sendVerificationEmail, sendResetPasswordEmail } = require('../utils/email');

// Initialize database on first request
let dbInitialized = false;

function ensureDbInit() {
    if (!dbInitialized) {
        initDatabase();
        seedPTNData();
        dbInitialized = true;
    }
}

// Register
router.post('/register', async (req, res) => {
    try {
        ensureDbInit();
        const { nama, email, password } = req.body;

        if (!nama || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Semua field harus diisi'
            });
        }

        // Check if email already exists
        const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'Email sudah terdaftar'
            });
        }

        // Hash password
        const hashedPassword = bcrypt.hashSync(password, 10);

        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Insert user with OTP and unverified status
        const insertUser = db.prepare('INSERT INTO users (nama, email, password, role, is_verified, otp_code) VALUES (?, ?, ?, ?, 0, ?)');
        const result = insertUser.run(nama, email, hashedPassword, 'user', otp);

        // Send verification email
        await sendVerificationEmail(email, otp);

        res.status(201).json({
            success: true,
            message: 'Registrasi berhasil. Silakan cek email untuk kode verifikasi.',
            userId: result.lastInsertRowid,
            requireVerification: true,
            email: email
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server'
        });
    }
});

// Verify OTP
router.post('/verify', (req, res) => {
    try {
        ensureDbInit();
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message: 'Email dan OTP harus diisi'
            });
        }

        const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User tidak ditemukan'
            });
        }

        if (user.otp_code !== otp) {
            return res.status(400).json({
                success: false,
                message: 'Kode OTP salah'
            });
        }

        // Update user status
        db.prepare('UPDATE users SET is_verified = 1, otp_code = NULL WHERE id = ?').run(user.id);

        res.json({
            success: true,
            message: 'Verifikasi berhasil. Silakan login.'
        });

    } catch (error) {
        console.error('Verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server'
        });
    }
});

// Forgot Password
router.post('/forgot-password', async (req, res) => {
    try {
        ensureDbInit();
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ success: false, message: 'Email harus diisi' });
        }

        const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
        if (!user) {
            // Return success even if email not found (security practice)
            return res.json({ success: true, message: 'Jika email terdaftar, kode reset akan dikirim.' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expires = Date.now() + 15 * 60 * 1000; // 15 mins

        db.prepare('UPDATE users SET reset_token = ?, reset_expires = ? WHERE id = ?')
            .run(otp, expires, user.id);

        await sendResetPasswordEmail(email, otp);

        res.json({ success: true, message: 'Jika email terdaftar, kode reset akan dikirim.' });

    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ success: false, message: 'Gagal memproses permintaan' });
    }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
    try {
        ensureDbInit();
        const { email, otp, newPassword } = req.body;

        if (!email || !otp || !newPassword) {
            return res.status(400).json({ success: false, message: 'Semua data harus diisi' });
        }

        const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

        if (!user || user.reset_token !== otp || user.reset_expires < Date.now()) {
            return res.status(400).json({ success: false, message: 'Kode OTP salah atau kadaluarsa' });
        }

        const hashedPassword = bcrypt.hashSync(newPassword, 10);

        db.prepare('UPDATE users SET password = ?, reset_token = NULL, reset_expires = NULL WHERE id = ?')
            .run(hashedPassword, user.id);

        res.json({ success: true, message: 'Password berhasil diubah. Silakan login.' });

    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ success: false, message: 'Gagal mereset password' });
    }
});

// Login
router.post('/login', (req, res) => {
    try {
        ensureDbInit();
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email dan password harus diisi'
            });
        }

        // Find user
        const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Email atau password salah'
            });
        }

        // Check password
        const isMatch = bcrypt.compareSync(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Email atau password salah'
            });
        }

        // Check verification status
        if (user.is_verified === 0) {
            // Resend OTP if needed logic could be added here
            return res.status(403).json({
                success: false,
                message: 'Akun belum diverifikasi. Silakan cek email Anda.',
                requireVerification: true,
                email: user.email
            });
        }

        // Set session
        req.session.userId = user.id;
        req.session.userName = user.nama;
        req.session.userEmail = user.email;

        res.json({
            success: true,
            message: 'Login berhasil',
            user: {
                id: user.id,
                nama: user.nama,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server'
        });
    }
});

// Logout
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Gagal logout'
            });
        }
        res.json({
            success: true,
            message: 'Logout berhasil'
        });
    });
});

// Check auth status
router.get('/status', (req, res) => {
    if (req.session.userId) {
        res.json({
            success: true,
            isAuthenticated: true,
            user: {
                id: req.session.userId,
                nama: req.session.userName,
                email: req.session.userEmail
            }
        });
    } else {
        res.json({
            success: true,
            isAuthenticated: false
        });
    }
});

// Get current user
router.get('/me', (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({
                success: false,
                message: 'Tidak terautentikasi'
            });
        }

        const user = db.prepare('SELECT id, nama, email, created_at FROM users WHERE id = ?').get(req.session.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User tidak ditemukan'
            });
        }

        res.json({
            success: true,
            user
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server'
        });
    }
});

module.exports = router;
