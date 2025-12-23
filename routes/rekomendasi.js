const express = require('express');
const router = express.Router();
const { db } = require('../config/database');

// Middleware to check authentication
const requireAuth = (req, res, next) => {
    if (!req.session.userId) {
        return res.status(401).json({
            success: false,
            message: 'Silakan login terlebih dahulu'
        });
    }
    next();
};

// Get all PTN
router.get('/ptn', (req, res) => {
    try {
        const ptn = db.prepare('SELECT * FROM ptn ORDER BY nama_ptn').all();
        res.json({ success: true, data: ptn });
    } catch (error) {
        console.error('Get PTN error:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
    }
});

// Get all jurusan
router.get('/jurusan', (req, res) => {
    try {
        const { kelompok, ptn_id } = req.query;

        let query = `
            SELECT j.*, p.nama_ptn, p.lokasi, p.akreditasi
            FROM jurusan j
            JOIN ptn p ON j.ptn_id = p.id
            WHERE 1=1
        `;
        const params = [];

        if (kelompok) {
            query += ' AND j.kelompok = ?';
            params.push(kelompok);
        }

        if (ptn_id) {
            query += ' AND j.ptn_id = ?';
            params.push(ptn_id);
        }

        query += ' ORDER BY j.passing_grade DESC';

        const jurusan = db.prepare(query).all(...params);
        res.json({ success: true, data: jurusan });
    } catch (error) {
        console.error('Get jurusan error:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
    }
});

// Get recommendations based on user's nilai
router.get('/', requireAuth, (req, res) => {
    try {
        const { kelompok } = req.query;

        // Get user's average nilai
        const avgResult = db.prepare('SELECT AVG(nilai) as rata_rata FROM nilai WHERE user_id = ?').get(req.session.userId);

        const userAvg = avgResult.rata_rata || 0;

        if (userAvg === 0) {
            return res.json({
                success: true,
                data: [],
                userAverage: 0,
                message: 'Anda belum memiliki nilai. Silakan tambahkan nilai terlebih dahulu.'
            });
        }

        // Get recommendations - jurusan dengan passing grade <= user average + 15
        let query = `
            SELECT j.*, p.nama_ptn, p.lokasi, p.akreditasi, p.website,
                   CASE 
                       WHEN j.passing_grade <= ? THEN 'Aman'
                       WHEN j.passing_grade <= ? + 5 THEN 'Rekomendasi'
                       WHEN j.passing_grade <= ? + 10 THEN 'Menantang'
                       ELSE 'Sangat Menantang'
                   END as kategori_rekomendasi,
                   (? - j.passing_grade) as selisih
            FROM jurusan j
            JOIN ptn p ON j.ptn_id = p.id
            WHERE j.passing_grade <= ? + 15
        `;
        const params = [userAvg, userAvg, userAvg, userAvg, userAvg];

        if (kelompok && kelompok !== 'all') {
            query += ' AND j.kelompok = ?';
            params.push(kelompok);
        }

        query += ' ORDER BY j.passing_grade DESC LIMIT 50';

        const recommendations = db.prepare(query).all(...params);

        // Get statistics
        const stats = {
            aman: recommendations.filter(r => r.kategori_rekomendasi === 'Aman').length,
            rekomendasi: recommendations.filter(r => r.kategori_rekomendasi === 'Rekomendasi').length,
            menantang: recommendations.filter(r => r.kategori_rekomendasi === 'Menantang').length,
            sangatMenantang: recommendations.filter(r => r.kategori_rekomendasi === 'Sangat Menantang').length
        };

        res.json({
            success: true,
            data: recommendations,
            userAverage: parseFloat(userAvg).toFixed(2),
            stats
        });
    } catch (error) {
        console.error('Get recommendations error:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
    }
});

// Search jurusan
router.get('/search', (req, res) => {
    try {
        const { q } = req.query;

        if (!q || q.length < 2) {
            return res.json({ success: true, data: [] });
        }

        const results = db.prepare(`
            SELECT j.*, p.nama_ptn, p.lokasi, p.akreditasi
            FROM jurusan j
            JOIN ptn p ON j.ptn_id = p.id
            WHERE j.nama_jurusan LIKE ? OR p.nama_ptn LIKE ?
            ORDER BY j.passing_grade DESC
            LIMIT 20
        `).all(`%${q}%`, `%${q}%`);

        res.json({ success: true, data: results });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
    }
});

module.exports = router;
