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

// Get all mata pelajaran for current user
router.get('/', requireAuth, (req, res) => {
    try {
        const mapel = db.prepare(`
            SELECT mp.*, 
                   (SELECT AVG(n.nilai) FROM nilai n WHERE n.mapel_id = mp.id) as rata_rata
            FROM mata_pelajaran mp 
            WHERE mp.user_id = ? 
            ORDER BY mp.nama_mapel
        `).all(req.session.userId);

        res.json({ success: true, data: mapel });
    } catch (error) {
        console.error('Get mapel error:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
    }
});

// Get single mata pelajaran with nilai
router.get('/:id', requireAuth, (req, res) => {
    try {
        const mapel = db.prepare('SELECT * FROM mata_pelajaran WHERE id = ? AND user_id = ?').get(req.params.id, req.session.userId);

        if (!mapel) {
            return res.status(404).json({ success: false, message: 'Mata pelajaran tidak ditemukan' });
        }

        const nilai = db.prepare('SELECT * FROM nilai WHERE mapel_id = ? ORDER BY semester').all(req.params.id);

        res.json({
            success: true,
            data: { ...mapel, nilai }
        });
    } catch (error) {
        console.error('Get single mapel error:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
    }
});

// Create mata pelajaran
router.post('/', requireAuth, (req, res) => {
    try {
        const { nama_mapel, kategori, semester_tersedia } = req.body;

        if (!nama_mapel) {
            return res.status(400).json({ success: false, message: 'Nama mata pelajaran harus diisi' });
        }

        const semTersedia = semester_tersedia || '1,2,3,4,5';
        const result = db.prepare('INSERT INTO mata_pelajaran (user_id, nama_mapel, kategori, semester_tersedia) VALUES (?, ?, ?, ?)').run(req.session.userId, nama_mapel, kategori || 'Wajib', semTersedia);

        res.status(201).json({
            success: true,
            message: 'Mata pelajaran berhasil ditambahkan',
            data: { id: result.lastInsertRowid, nama_mapel, kategori: kategori || 'Wajib', semester_tersedia: semTersedia }
        });
    } catch (error) {
        console.error('Create mapel error:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
    }
});

// Update mata pelajaran
router.put('/:id', requireAuth, (req, res) => {
    try {
        const { nama_mapel, kategori, semester_tersedia } = req.body;

        // Check ownership
        const existing = db.prepare('SELECT id FROM mata_pelajaran WHERE id = ? AND user_id = ?').get(req.params.id, req.session.userId);

        if (!existing) {
            return res.status(404).json({ success: false, message: 'Mata pelajaran tidak ditemukan' });
        }

        const semTersedia = semester_tersedia || '1,2,3,4,5';
        db.prepare('UPDATE mata_pelajaran SET nama_mapel = ?, kategori = ?, semester_tersedia = ? WHERE id = ?').run(nama_mapel, kategori, semTersedia, req.params.id);

        res.json({
            success: true,
            message: 'Mata pelajaran berhasil diupdate'
        });
    } catch (error) {
        console.error('Update mapel error:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
    }
});

// Delete mata pelajaran
router.delete('/:id', requireAuth, (req, res) => {
    try {
        // Check ownership
        const existing = db.prepare('SELECT id FROM mata_pelajaran WHERE id = ? AND user_id = ?').get(req.params.id, req.session.userId);

        if (!existing) {
            return res.status(404).json({ success: false, message: 'Mata pelajaran tidak ditemukan' });
        }

        db.prepare('DELETE FROM mata_pelajaran WHERE id = ?').run(req.params.id);

        res.json({
            success: true,
            message: 'Mata pelajaran berhasil dihapus'
        });
    } catch (error) {
        console.error('Delete mapel error:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
    }
});

module.exports = router;
