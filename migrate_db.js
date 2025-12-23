const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'portal_akademik.db');
const db = new Database(dbPath);

console.log('🔄 Checking database schema...');

try {
    const columns = db.pragma('table_info(users)');
    const hasVerified = columns.some(col => col.name === 'is_verified');
    const hasOtp = columns.some(col => col.name === 'otp_code');
    const hasRole = columns.some(col => col.name === 'role');
    const hasResetToken = columns.some(col => col.name === 'reset_token');
    const hasResetExpires = columns.some(col => col.name === 'reset_expires');

    if (!hasRole) {
        console.log('➕ Adding column role...');
        db.exec("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'");
    } else {
        console.log('✅ Column role already exists.');
    }

    if (!hasResetToken) {
        console.log('➕ Adding column reset_token...');
        db.exec("ALTER TABLE users ADD COLUMN reset_token TEXT");
    } else {
        console.log('✅ Column reset_token already exists.');
    }

    if (!hasResetExpires) {
        console.log('➕ Adding column reset_expires...');
        db.exec("ALTER TABLE users ADD COLUMN reset_expires INTEGER");
    } else {
        console.log('✅ Column reset_expires already exists.');
    }

    if (!hasVerified) {
        console.log('➕ Adding column is_verified...');
        db.exec('ALTER TABLE users ADD COLUMN is_verified INTEGER DEFAULT 0');
    } else {
        console.log('✅ Column is_verified already exists.');
    }

    if (!hasOtp) {
        console.log('➕ Adding column otp_code...');
        db.exec('ALTER TABLE users ADD COLUMN otp_code TEXT');
    } else {
        console.log('✅ Column otp_code already exists.');
    }

    console.log('✅ Migration successful!');
} catch (error) {
    console.error('❌ Migration failed:', error);
}
