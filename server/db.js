const sql = require('mssql');
require('dotenv').config();

const config = {
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || '12345',
  server: process.env.DB_SERVER || 'localhost', // hoặc tên instance SQL Server
  database: process.env.DB_NAME || 'SmokingSupportPlatform',
  options: {
    encrypt: false, // true nếu dùng Azure
    trustServerCertificate: true, // dùng cho local dev
    charset: 'utf8',
    // collate: 'Vietnamese_CI_AS' // Thử collation cụ thể nếu utf8 không đủ
  }
};

const connectDB = async () => {
  try {
    await sql.connect(config);
    console.log('✅ Connected to SQL Server successfully');
  } catch (error) {
    console.error('❌ SQL Server connection error:', error);
    process.exit(1);
  }
};

module.exports = { connectDB, sql }; 