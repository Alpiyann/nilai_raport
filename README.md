# 🎓 Portal Akademik

Website portal akademik profesional untuk manajemen nilai dan rekomendasi PTN (Perguruan Tinggi Negeri) Indonesia.

![Portal Akademik Demo](/.gemini/antigravity/brain/2a4cf3b6-7490-4294-b74d-06fd1ed444e2/full_app_test_1766408865778.webp)

## ✨ Fitur Utama

- 🔐 **Autentikasi** - Register & Login dengan session management
- 📊 **Dashboard** - Statistik nilai, grafik perkembangan, top subjects
- 📚 **Kelola Mapel** - CRUD mata pelajaran dengan pilihan semester
- 📈 **Nilai Raport** - Input nilai per semester dengan visualisasi chart
- 🎯 **Rekomendasi PTN** - 15 PTN Indonesia, 100+ jurusan dengan passing grade

## 🚀 Instalasi & Menjalankan

### Prasyarat
- [Node.js](https://nodejs.org/) v14 atau lebih baru
- npm (sudah termasuk dalam Node.js)

### Langkah Instalasi

```bash
# 1. Clone atau download project ini
cd c:\Users\DELL\Downloads\coba

# 2. Install dependencies
npm install

# 3. Jalankan server
npm start

# 4. Buka browser
# http://localhost:3000
```

## 📖 Panduan Penggunaan

### 1. Register Akun Baru
1. Buka `http://localhost:3000`
2. Klik tab **"Daftar"**
3. Isi nama, email, dan password
4. Klik **"Daftar Sekarang"**

### 2. Login
1. Klik tab **"Masuk"**
2. Masukkan email dan password
3. Klik **"Masuk"**

### 3. Menambah Mata Pelajaran
1. Klik menu **"Kelola Mapel"** di sidebar
2. Klik tombol **"Tambah Mapel"**
3. Isi nama mata pelajaran
4. Pilih kategori (Wajib/Peminatan/Lintas Minat)
5. **Centang semester** mana saja mapel ini diajarkan
   - Contoh: Matematika di Sem 1-2 saja → uncheck Sem 3, 4, 5
6. Klik **"Simpan"**

### 4. Input Nilai
1. Di halaman **"Kelola Mapel"**, klik tombol **"Input Nilai"** pada mapel
2. Masukkan nilai (0-100) untuk setiap semester yang tersedia
3. Semester yang tidak tersedia akan ter-disable otomatis
4. Klik **"Simpan Nilai"**

### 5. Lihat Analisis Nilai
1. Klik menu **"Nilai Raport"** di sidebar
2. Lihat:
   - Rata-rata keseluruhan
   - Rata-rata per semester
   - Grafik perkembangan nilai
   - Perbandingan antar mapel

### 6. Lihat Rekomendasi PTN
1. Klik menu **"Rekomendasi PTN"** di sidebar
2. Lihat rekomendasi berdasarkan rata-rata nilai Anda
3. Filter berdasarkan kelompok (Saintek/Soshum)
4. Cari PTN atau jurusan spesifik

## 📁 Struktur Project

```
coba/
├── config/
│   └── database.js      # Konfigurasi SQLite database
├── data/
│   └── portal_akademik.db  # File database (auto-generated)
├── public/
│   ├── pages/
│   │   ├── dashboard.html
│   │   ├── login.html
│   │   ├── mapel.html
│   │   ├── nilai.html
│   │   └── rekomendasi.html
│   ├── styles/
│   │   └── main.css     # Design system & styling
│   └── index.html       # Entry point
├── routes/
│   ├── auth.js          # API autentikasi
│   ├── dashboard.js     # API dashboard stats
│   ├── mapel.js         # API CRUD mapel
│   ├── nilai.js         # API nilai
│   └── rekomendasi.js   # API rekomendasi PTN
├── .env                 # Environment variables
├── package.json
├── server.js            # Main server
└── README.md
```

## 🛠️ Teknologi

| Komponen | Teknologi |
|----------|-----------|
| Backend | Node.js + Express.js |
| Database | SQLite (better-sqlite3) |
| Frontend | HTML, CSS, JavaScript |
| Styling | Glassmorphism Design |
| Charts | Chart.js |
| Icons | Lucide Icons |
| Font | Google Fonts (Inter) |

## 🎓 Data PTN Tersedia

15 PTN top Indonesia dengan passing grade:
- Universitas Indonesia (UI)
- Institut Teknologi Bandung (ITB)
- Universitas Gadjah Mada (UGM)
- Institut Pertanian Bogor (IPB)
- Universitas Airlangga (Unair)
- Institut Teknologi Sepuluh Nopember (ITS)
- Universitas Diponegoro (Undip)
- Universitas Padjadjaran (Unpad)
- Universitas Brawijaya (UB)
- Universitas Hasanuddin (Unhas)
- Dan 5 PTN lainnya...

## ⚙️ Konfigurasi

Edit file `.env` untuk mengubah konfigurasi:

```env
PORT=3000
SESSION_SECRET=your_secret_key
```

## 📝 Catatan

- Database SQLite akan otomatis dibuat saat pertama kali menjalankan
- Data PTN dan jurusan akan otomatis di-seed
- Semester maksimal adalah 5 (Semester 1-5 SMA)
- Setiap mapel bisa dipilih semester mana saja yang tersedia

## 👨‍💻 Dibuat dengan ❤️

Portal Akademik - Membantu siswa Indonesia meraih PTN impian!
