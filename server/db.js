<<<<<<< HEAD
// Database connection configuration
const mongoose = require('mongoose');
require('dotenv').config();

// Sử dụng connection string từ biến môi trường hoặc mặc định (không authentication)
const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/SmokingSupportPlatform';
=======
const sql = require('mssql');
require('dotenv').config();

const config = {
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || '12345',
  server: process.env.DB_SERVER || 'localhost', // hoặc tên instance SQL Server
  database: process.env.DB_NAME || 'SmokingSupportPlatform',
  options: {
    encrypt: false, // true nếu dùng Azure
    trustServerCertificate: true // dùng cho local dev
  }
};
>>>>>>> Loc

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