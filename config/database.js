const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config();

// Ensure data directory exists
const dataDir = path.join(__dirname, '..', 'data');
const fs = require('fs');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
}

// Create database file
const dbPath = path.join(dataDir, 'portal_akademik.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize database tables
function initDatabase() {
    try {
        // Check if users table exists
        const tableCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'").get();

        if (!tableCheck) {
            // Create users table
            db.exec(`
                CREATE TABLE users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    nama TEXT NOT NULL,
                    email TEXT UNIQUE NOT NULL,
                    password TEXT NOT NULL,
                    role TEXT DEFAULT 'user',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    is_verified INTEGER DEFAULT 0,
                    otp_code TEXT,
                    reset_token TEXT,
                    reset_expires DATETIME
                )
            `);
            console.log('✅ Tabel users berhasil dibuat');
        } else {
            // Check existing table columns
            const columns = db.pragma('table_info(users)');

            // Add is_verified and otp_code if missing
            if (!columns.some(col => col.name === 'is_verified')) {
                console.log('Menambahkan kolom is_verified...', db.exec('ALTER TABLE users ADD COLUMN is_verified INTEGER DEFAULT 0'));
            }
            if (!columns.some(col => col.name === 'otp_code')) {
                console.log('Menambahkan kolom otp_code...', db.exec('ALTER TABLE users ADD COLUMN otp_code TEXT'));
            }
            if (!columns.some(col => col.name === 'reset_token')) {
                console.log('Menambahkan kolom reset_token...', db.exec('ALTER TABLE users ADD COLUMN reset_token TEXT'));
            }
            if (!columns.some(col => col.name === 'reset_expires')) {
                console.log('Menambahkan kolom reset_expires...', db.exec('ALTER TABLE users ADD COLUMN reset_expires DATETIME'));
            }
        }
        db.exec(`
            CREATE TABLE IF NOT EXISTS mata_pelajaran (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                nama_mapel TEXT NOT NULL,
                kategori TEXT DEFAULT 'Wajib' CHECK(kategori IN ('Wajib', 'Peminatan', 'Lintas Minat')),
                semester_tersedia TEXT DEFAULT '1,2,3,4,5',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // Create nilai table
        db.exec(`
            CREATE TABLE IF NOT EXISTS nilai (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                mapel_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                semester INTEGER NOT NULL,
                nilai REAL NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (mapel_id) REFERENCES mata_pelajaran(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // Create PTN table
        db.exec(`
            CREATE TABLE IF NOT EXISTS ptn (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nama_ptn TEXT NOT NULL,
                akreditasi TEXT,
                lokasi TEXT,
                logo_url TEXT,
                website TEXT
            )
        `);

        // Create jurusan table
        db.exec(`
            CREATE TABLE IF NOT EXISTS jurusan (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ptn_id INTEGER NOT NULL,
                nama_jurusan TEXT NOT NULL,
                kelompok TEXT DEFAULT 'Saintek' CHECK(kelompok IN ('Saintek', 'Soshum', 'Campuran')),
                passing_grade REAL NOT NULL,
                daya_tampung INTEGER,
                FOREIGN KEY (ptn_id) REFERENCES ptn(id) ON DELETE CASCADE
            )
        `);

        console.log('✅ Tabel database berhasil diinisialisasi!');
        return true;
    } catch (error) {
        console.error('❌ Gagal inisialisasi database:', error.message);
        return false;
    }
}

// Seed PTN data
function seedPTNData() {
    try {
        // Check if PTN data already exists
        const count = db.prepare('SELECT COUNT(*) as count FROM ptn').get();
        if (count.count > 0) {
            console.log('ℹ️  Data PTN sudah ada, skip seeding...');
            return true;
        }

        // Insert PTN data
        const insertPTN = db.prepare('INSERT INTO ptn (nama_ptn, akreditasi, lokasi, logo_url, website) VALUES (?, ?, ?, ?, ?)');
        const ptnData = [
            ['Universitas Indonesia', 'A', 'Depok, Jawa Barat', '/assets/ptn/ui.png', 'https://www.ui.ac.id'],
            ['Institut Teknologi Bandung', 'A', 'Bandung, Jawa Barat', '/assets/ptn/itb.png', 'https://www.itb.ac.id'],
            ['Universitas Gadjah Mada', 'A', 'Yogyakarta', '/assets/ptn/ugm.png', 'https://www.ugm.ac.id'],
            ['Institut Pertanian Bogor', 'A', 'Bogor, Jawa Barat', '/assets/ptn/ipb.png', 'https://www.ipb.ac.id'],
            ['Universitas Airlangga', 'A', 'Surabaya, Jawa Timur', '/assets/ptn/unair.png', 'https://www.unair.ac.id'],
            ['Institut Teknologi Sepuluh Nopember', 'A', 'Surabaya, Jawa Timur', '/assets/ptn/its.png', 'https://www.its.ac.id'],
            ['Universitas Diponegoro', 'A', 'Semarang, Jawa Tengah', '/assets/ptn/undip.png', 'https://www.undip.ac.id'],
            ['Universitas Padjadjaran', 'A', 'Bandung, Jawa Barat', '/assets/ptn/unpad.png', 'https://www.unpad.ac.id'],
            ['Universitas Brawijaya', 'A', 'Malang, Jawa Timur', '/assets/ptn/ub.png', 'https://www.ub.ac.id'],
            ['Universitas Hasanuddin', 'A', 'Makassar, Sulawesi Selatan', '/assets/ptn/unhas.png', 'https://www.unhas.ac.id'],
            ['Universitas Negeri Yogyakarta', 'A', 'Yogyakarta', '/assets/ptn/uny.png', 'https://www.uny.ac.id'],
            ['Universitas Sebelas Maret', 'A', 'Surakarta, Jawa Tengah', '/assets/ptn/uns.png', 'https://www.uns.ac.id'],
            ['Universitas Sumatera Utara', 'A', 'Medan, Sumatera Utara', '/assets/ptn/usu.png', 'https://www.usu.ac.id'],
            ['Universitas Andalas', 'A', 'Padang, Sumatera Barat', '/assets/ptn/unand.png', 'https://www.unand.ac.id'],
            ['Universitas Pendidikan Indonesia', 'A', 'Bandung, Jawa Barat', '/assets/ptn/upi.png', 'https://www.upi.edu']
        ];

        for (const ptn of ptnData) {
            insertPTN.run(...ptn);
        }

        // Get PTN IDs and insert jurusan
        const ptnRows = db.prepare('SELECT id, nama_ptn FROM ptn').all();
        const insertJurusan = db.prepare('INSERT INTO jurusan (ptn_id, nama_jurusan, kelompok, passing_grade, daya_tampung) VALUES (?, ?, ?, ?, ?)');

        const jurusanData = {
            'Universitas Indonesia': [
                ['Pendidikan Dokter', 'Saintek', 92.09, 90], // High
                ['Ilmu Komputer', 'Saintek', 91.01, 60],
                ['Farmasi', 'Saintek', 88.49, 45],
                ['Ilmu Hukum', 'Soshum', 92.40, 150],
                ['Akuntansi', 'Soshum', 89.20, 80],
                ['Manajemen', 'Soshum', 91.37, 90],
                ['Psikologi', 'Soshum', 89.50, 100],
                ['Teknik Industri', 'Saintek', 88.10, 60]
            ],
            'Institut Teknologi Bandung': [
                ['Sekolah Teknik Elektro & Informatika (STEI)', 'Saintek', 90.00, 200],
                ['Sekolah Bisnis & Manajemen (SBM)', 'Soshum', 93.38, 250],
                ['Fakultas Teknologi Industri (FTI)', 'Saintek', 89.00, 180],
                ['Desain Komunikasi Visual (FSRD)', 'Soshum', 87.50, 100],
                ['Teknik Sipil (FTSL)', 'Saintek', 88.05, 120]
            ],
            'Universitas Gadjah Mada': [
                ['Kedokteran', 'Saintek', 89.90, 80],
                ['Farmasi', 'Saintek', 86.90, 100],
                ['Teknologi Informasi', 'Saintek', 86.80, 80],
                ['Akuntansi', 'Soshum', 86.14, 75],
                ['Manajemen', 'Soshum', 86.62, 70],
                ['Hukum', 'Soshum', 86.30, 120],
                ['Psikologi', 'Soshum', 86.51, 90]
            ],
            'Institut Pertanian Bogor': [
                ['Ilmu Komputer', 'Saintek', 93.71, 85], // Very high predicted
                ['Manajemen', 'Soshum', 93.81, 100],
                ['Teknologi Pangan', 'Saintek', 93.27, 95],
                ['Agribisnis', 'Soshum', 93.22, 120],
                ['Kedokteran Hewan', 'Saintek', 92.85, 150]
            ],
            'Universitas Airlangga': [
                ['Kedokteran', 'Saintek', 88.50, 100],
                ['Farmasi', 'Saintek', 92.15, 90],
                ['Kesehatan Masyarakat', 'Saintek', 90.83, 100],
                ['Hukum', 'Soshum', 87.20, 120],
                ['Akuntansi', 'Soshum', 86.50, 110]
            ],
            'Institut Teknologi Sepuluh Nopember': [
                ['Teknik Informatika', 'Saintek', 89.50, 90],
                ['Sistem Informasi', 'Saintek', 88.20, 80],
                ['Teknik Sipil', 'Saintek', 86.50, 100],
                ['Arsitektur', 'Saintek', 87.10, 60]
            ],
            'Universitas Diponegoro': [
                ['Kedokteran', 'Saintek', 89.20, 100],
                ['Informatika', 'Saintek', 87.50, 80],
                ['Hukum', 'Soshum', 88.10, 200],
                ['Psikologi', 'Soshum', 87.80, 150]
            ],
            'Universitas Padjadjaran': [
                ['Pendidikan Dokter', 'Saintek', 89.80, 120],
                ['Psikologi', 'Soshum', 88.50, 100],
                ['Hubungan Internasional', 'Soshum', 88.20, 70],
                ['Farmasi', 'Saintek', 87.90, 80]
            ],
            'Universitas Brawijaya': [
                ['Kedokteran', 'Saintek', 89.50, 150],
                ['Ilmu Hukum', 'Soshum', 88.30, 250],
                ['Teknik Informatika', 'Saintek', 87.80, 100],
                ['Manajemen', 'Soshum', 88.10, 120]
            ],
            'Universitas Hasanuddin': [
                ['Pendidikan Dokter', 'Saintek', 88.90, 120],
                ['Kesehatan Masyarakat', 'Saintek', 87.20, 100],
                ['Hukum', 'Soshum', 87.50, 200]
            ],
            'Universitas Negeri Yogyakarta': [
                ['Pendidikan Matematika', 'Saintek', 60.50, 100],
                ['Pendidikan Bahasa Inggris', 'Soshum', 62.30, 90],
                ['Pendidikan Fisika', 'Saintek', 56.80, 80],
                ['Psikologi', 'Soshum', 63.20, 60],
                ['Ilmu Keolahragaan', 'Campuran', 55.40, 70]
            ],
            'Universitas Sebelas Maret': [
                ['Kedokteran', 'Saintek', 67.30, 80],
                ['Teknik Informatika', 'Saintek', 61.50, 90],
                ['Hukum', 'Soshum', 60.80, 130],
                ['Ekonomi', 'Soshum', 59.40, 120],
                ['Farmasi', 'Saintek', 62.70, 70]
            ],
            'Universitas Sumatera Utara': [
                ['Kedokteran', 'Saintek', 66.80, 90],
                ['Teknik Informatika', 'Saintek', 60.30, 100],
                ['Hukum', 'Soshum', 59.50, 140],
                ['Ekonomi', 'Soshum', 58.70, 130],
                ['Farmasi', 'Saintek', 61.20, 80]
            ],
            'Universitas Andalas': [
                ['Kedokteran', 'Saintek', 65.50, 80],
                ['Teknik Informatika', 'Saintek', 58.80, 90],
                ['Hukum', 'Soshum', 58.20, 130],
                ['Ekonomi', 'Soshum', 57.40, 120],
                ['Farmasi', 'Saintek', 59.70, 70]
            ],
            'Universitas Pendidikan Indonesia': [
                ['Pendidikan Matematika', 'Saintek', 59.30, 100],
                ['Pendidikan Bahasa Inggris', 'Soshum', 61.50, 90],
                ['Pendidikan Komputer', 'Saintek', 60.80, 80],
                ['Psikologi', 'Soshum', 62.40, 60],
                ['Pendidikan Ekonomi', 'Soshum', 57.20, 70]
            ]

        };

        for (const ptn of ptnRows) {
            const jurusanList = jurusanData[ptn.nama_ptn];
            if (jurusanList) {
                for (const jurusan of jurusanList) {
                    insertJurusan.run(ptn.id, ...jurusan);
                }
            }
        }

        console.log('✅ Data PTN dan Jurusan berhasil di-seed!');
        return true;
    } catch (error) {
        console.error('❌ Gagal seed data PTN:', error.message);
        return false;
    }
}

module.exports = { db, initDatabase, seedPTNData };
