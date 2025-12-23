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

// Get dashboard statistics
router.get('/stats', requireAuth, (req, res) => {
    try {
        // Count mata pelajaran
        const mapelCount = db.prepare('SELECT COUNT(*) as count FROM mata_pelajaran WHERE user_id = ?').get(req.session.userId);

        // Count nilai entries
        const nilaiCount = db.prepare('SELECT COUNT(*) as count FROM nilai WHERE user_id = ?').get(req.session.userId);

        // Get average nilai
        const avgNilai = db.prepare('SELECT AVG(nilai) as average FROM nilai WHERE user_id = ?').get(req.session.userId);

        // Get nilai per semester for chart
        const nilaiPerSemester = db.prepare(`
            SELECT semester, AVG(nilai) as rata_rata
            FROM nilai
            WHERE user_id = ?
            GROUP BY semester
            ORDER BY semester
        `).all(req.session.userId);

        // Get top subjects
        const topSubjects = db.prepare(`
            SELECT mp.nama_mapel, AVG(n.nilai) as rata_rata
            FROM nilai n
            JOIN mata_pelajaran mp ON n.mapel_id = mp.id
            WHERE n.user_id = ?
            GROUP BY n.mapel_id
            ORDER BY rata_rata DESC
            LIMIT 5
        `).all(req.session.userId);

        // Count recommended PTN (passing grade <= user avg + 5)
        const userAvg = avgNilai.average || 0;
        const ptnCount = db.prepare('SELECT COUNT(DISTINCT ptn_id) as count FROM jurusan WHERE passing_grade <= ?').get(userAvg + 5);

        res.json({
            success: true,
            data: {
                jumlahMapel: mapelCount.count,
                jumlahNilai: nilaiCount.count,
                rataRata: parseFloat(avgNilai.average || 0).toFixed(2),
                jumlahPTN: ptnCount.count,
                nilaiPerSemester,
                topSubjects
            }
        });
    } catch (error) {
        console.error('Get dashboard stats error:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
    }
});

// Get recent activity
router.get('/activity', requireAuth, (req, res) => {
    try {
        // Get recent nilai entries
        const recentNilai = db.prepare(`
            SELECT n.*, mp.nama_mapel, n.created_at
            FROM nilai n
            JOIN mata_pelajaran mp ON n.mapel_id = mp.id
            WHERE n.user_id = ?
            ORDER BY n.created_at DESC
            LIMIT 10
        `).all(req.session.userId);

        // Get recent mapel
        const recentMapel = db.prepare(`
            SELECT * FROM mata_pelajaran
            WHERE user_id = ?
            ORDER BY created_at DESC
            LIMIT 5
        `).all(req.session.userId);

        res.json({
            success: true,
            data: {
                recentNilai,
                recentMapel
            }
        });
    } catch (error) {
        console.error('Get activity error:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
    }
});

module.exports = router;
