const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'portal_akademik.db');
const db = new Database(dbPath);

console.log('📋 Daftar User Terdaftar:');
console.log('------------------------------------------------');
const users = db.prepare('SELECT id, nama, email, role, is_verified, otp_code FROM users').all();

if (users.length === 0) {
    console.log('Belum ada user yang terdaftar.');
} else {
    users.forEach(u => {
        console.log(`ID: ${u.id} | Nama: ${u.nama} | Email: ${u.email}`);
        console.log(`   Role: ${u.role} | Verified: ${u.is_verified ? '✅ YES' : '❌ NO'} | OTP: ${u.otp_code || '-'}`);
        console.log('------------------------------------------------');
    });
}
