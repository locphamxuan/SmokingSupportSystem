const { sql, connectDB } = require('./db');

async function checkPasswords() {
  try {
    // Kết nối database
    await connectDB();
    
    // Kiểm tra tất cả users
    const result = await sql.query`SELECT Username, Email, Role, Password FROM Users`;
    console.log('Current users and passwords:');
    console.table(result.recordset);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking passwords:', error);
    process.exit(1);
  }
}

checkPasswords(); 