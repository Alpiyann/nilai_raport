const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'portal_akademik.db');
const db = new Database(dbPath);

const columns = db.pragma('table_info(users)');
console.log('Columns in users table:', columns);
