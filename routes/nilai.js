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

// Get all nilai for current user
router.get('/', requireAuth, (req, res) => {
    try {
        const nilai = db.prepare(`
            SELECT n.*, mp.nama_mapel, mp.kategori
            FROM nilai n
            JOIN mata_pelajaran mp ON n.mapel_id = mp.id
            WHERE n.user_id = ?
            ORDER BY mp.nama_mapel, n.semester
        `).all(req.session.userId);

        res.json({ success: true, data: nilai });
    } catch (error) {
        console.error('Get nilai error:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
    }
});

// Get nilai by mapel
router.get('/mapel/:mapelId', requireAuth, (req, res) => {
    try {
        const nilai = db.prepare(`
            SELECT n.*, mp.nama_mapel
            FROM nilai n
            JOIN mata_pelajaran mp ON n.mapel_id = mp.id
            WHERE n.mapel_id = ? AND n.user_id = ?
            ORDER BY n.semester
        `).all(req.params.mapelId, req.session.userId);

        res.json({ success: true, data: nilai });
    } catch (error) {
        console.error('Get nilai by mapel error:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
    }
});

// Get nilai summary (rata-rata per semester dan keseluruhan)
router.get('/summary', requireAuth, (req, res) => {
    try {
        // Rata-rata per semester
        const perSemester = db.prepare(`
            SELECT semester, AVG(nilai) as rata_rata, COUNT(*) as jumlah_mapel
            FROM nilai
            WHERE user_id = ?
            GROUP BY semester
            ORDER BY semester
        `).all(req.session.userId);

        // Rata-rata keseluruhan
        const overall = db.prepare(`
            SELECT AVG(nilai) as rata_rata_keseluruhan, COUNT(DISTINCT mapel_id) as total_mapel
            FROM nilai
            WHERE user_id = ?
        `).get(req.session.userId);

        // Rata-rata per mapel
        const perMapel = db.prepare(`
            SELECT mp.nama_mapel, mp.kategori, AVG(n.nilai) as rata_rata
            FROM nilai n
            JOIN mata_pelajaran mp ON n.mapel_id = mp.id
            WHERE n.user_id = ?
            GROUP BY n.mapel_id
            ORDER BY rata_rata DESC
        `).all(req.session.userId);

        res.json({
            success: true,
            data: {
                perSemester,
                perMapel,
                rataRataKeseluruhan: overall.rata_rata_keseluruhan || 0,
                totalMapel: overall.total_mapel || 0
            }
        });
    } catch (error) {
        console.error('Get nilai summary error:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
    }
});

// Add or update nilai
router.post('/', requireAuth, (req, res) => {
    try {
        const { mapel_id, semester, nilai } = req.body;

        if (!mapel_id || !semester || nilai === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Mapel, semester, dan nilai harus diisi'
            });
        }

        if (nilai < 0 || nilai > 100) {
            return res.status(400).json({
                success: false,
                message: 'Nilai harus antara 0-100'
            });
        }

        // Check if mapel belongs to user
        const mapel = db.prepare('SELECT id FROM mata_pelajaran WHERE id = ? AND user_id = ?').get(mapel_id, req.session.userId);

        if (!mapel) {
            return res.status(404).json({
                success: false,
                message: 'Mata pelajaran tidak ditemukan'
            });
        }

        // Check if nilai for this semester already exists
        const existing = db.prepare('SELECT id FROM nilai WHERE mapel_id = ? AND semester = ? AND user_id = ?').get(mapel_id, semester, req.session.userId);

        if (existing) {
            // Update existing
            db.prepare('UPDATE nilai SET nilai = ? WHERE id = ?').run(nilai, existing.id);
            res.json({ success: true, message: 'Nilai berhasil diupdate' });
        } else {
            // Insert new
            const result = db.prepare('INSERT INTO nilai (mapel_id, user_id, semester, nilai) VALUES (?, ?, ?, ?)').run(mapel_id, req.session.userId, semester, nilai);
            res.status(201).json({
                success: true,
                message: 'Nilai berhasil ditambahkan',
                data: { id: result.lastInsertRowid }
            });
        }
    } catch (error) {
        console.error('Add/update nilai error:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
    }
});

// Batch update nilai for a mapel
router.post('/batch', requireAuth, (req, res) => {
    try {
        const { mapel_id, nilai_list } = req.body;
        // nilai_list: [{ semester: 1, nilai: 85 }, { semester: 2, nilai: 90 }, ...]

        if (!mapel_id || !nilai_list || !Array.isArray(nilai_list)) {
            return res.status(400).json({
                success: false,
                message: 'Format data tidak valid'
            });
        }

        // Check if mapel belongs to user
        const mapel = db.prepare('SELECT id FROM mata_pelajaran WHERE id = ? AND user_id = ?').get(mapel_id, req.session.userId);

        if (!mapel) {
            return res.status(404).json({
                success: false,
                message: 'Mata pelajaran tidak ditemukan'
            });
        }

        // Process each nilai
        for (const item of nilai_list) {
            if (item.nilai !== null && item.nilai !== undefined && item.nilai !== '') {
                const nilaiNum = parseFloat(item.nilai);
                if (nilaiNum >= 0 && nilaiNum <= 100) {
                    const existing = db.prepare('SELECT id FROM nilai WHERE mapel_id = ? AND semester = ? AND user_id = ?').get(mapel_id, item.semester, req.session.userId);

                    if (existing) {
                        db.prepare('UPDATE nilai SET nilai = ? WHERE id = ?').run(nilaiNum, existing.id);
                    } else {
                        db.prepare('INSERT INTO nilai (mapel_id, user_id, semester, nilai) VALUES (?, ?, ?, ?)').run(mapel_id, req.session.userId, item.semester, nilaiNum);
                    }
                }
            }
        }

        res.json({ success: true, message: 'Nilai berhasil disimpan' });
    } catch (error) {
        console.error('Batch update nilai error:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
    }
});

// Delete nilai
router.delete('/:id', requireAuth, (req, res) => {
    try {
        const existing = db.prepare('SELECT id FROM nilai WHERE id = ? AND user_id = ?').get(req.params.id, req.session.userId);

        if (!existing) {
            return res.status(404).json({ success: false, message: 'Nilai tidak ditemukan' });
        }

        db.prepare('DELETE FROM nilai WHERE id = ?').run(req.params.id);

        res.json({ success: true, message: 'Nilai berhasil dihapus' });
    } catch (error) {
        console.error('Delete nilai error:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
    }
});

module.exports = router;
