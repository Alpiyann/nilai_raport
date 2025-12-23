const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'portal_akademik.db');
const db = new Database(dbPath);

console.log('🔄 Updating PTN data with predictive values (Research 2024/2025)...');

// Begin transaction
const update = db.transaction(() => {
    // Clear old data
    db.exec('DELETE FROM jurusan');
    db.exec('DELETE FROM ptn');
    console.log('🗑️  Old data cleared.');

    // PTN Data
    const insertPTN = db.prepare('INSERT INTO ptn (nama_ptn, akreditasi, lokasi, logo_url, website) VALUES (?, ?, ?, ?, ?)');

    // PTN Maps to store IDs
    const ptnMap = {};

    const ptns = [
        ['Universitas Indonesia', 'A', 'Depok, Jawa Barat', '/assets/ptn/ui.png', 'https://www.ui.ac.id'],
        ['Institut Teknologi Bandung', 'A', 'Bandung, Jawa Barat', '/assets/ptn/itb.png', 'https://www.itb.ac.id'],
        ['Universitas Gadjah Mada', 'A', 'Yogyakarta', '/assets/ptn/ugm.png', 'https://www.ugm.ac.id'],
        ['Institut Pertanian Bogor', 'A', 'Bogor, Jawa Barat', '/assets/ptn/ipb.png', 'https://www.ipb.ac.id'],
        ['Universitas Airlangga', 'A', 'Surabaya, Jawa Timur', '/assets/ptn/unair.png', 'https://www.unair.ac.id'],
        ['Institut Teknologi Sepuluh Nopember', 'A', 'Surabaya, Jawa Timur', '/assets/ptn/its.png', 'https://www.its.ac.id'],
        ['Universitas Diponegoro', 'A', 'Semarang, Jawa Tengah', '/assets/ptn/undip.png', 'https://www.undip.ac.id'],
        ['Universitas Padjadjaran', 'A', 'Bandung, Jawa Barat', '/assets/ptn/unpad.png', 'https://www.unpad.ac.id'],
        ['Universitas Brawijaya', 'A', 'Malang, Jawa Timur', '/assets/ptn/ub.png', 'https://www.ub.ac.id'],
        ['Universitas Hasanuddin', 'A', 'Makassar, Sulawesi Selatan', '/assets/ptn/unhas.png', 'https://www.unhas.ac.id']
    ];

    for (const p of ptns) {
        const info = insertPTN.run(...p);
        ptnMap[p[0]] = info.lastInsertRowid;
    }

    // Jurusan Data (Predictive Passing Grades)
    const insertJurusan = db.prepare('INSERT INTO jurusan (ptn_id, nama_jurusan, kelompok, passing_grade, daya_tampung) VALUES (?, ?, ?, ?, ?)');

    const jurusans = {
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
        ]
    };

    let totalJurusan = 0;
    for (const [ptnName, jurusanList] of Object.entries(jurusans)) {
        const id = ptnMap[ptnName];
        if (id) {
            for (const j of jurusanList) {
                insertJurusan.run(id, j[0], j[1], j[2], j[3]);
                totalJurusan++;
            }
        }
    }

    console.log(`✅ Success! Seeded ${ptns.length} PTNs and ${totalJurusan} Majors with researched data.`);
});

update();
