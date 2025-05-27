const bcrypt = require('bcryptjs');
const { sql, connectDB } = require('./db');

async function testLogin() {
  try {
    // Kết nối database trước
    await connectDB();
    
    // Kiểm tra user admin
    const result = await sql.query`SELECT * FROM Users WHERE Username = 'admin'`;
    const user = result.recordset[0];
    
    if (user) {
      console.log('Admin user found:');
      console.log('Username:', user.Username);
      console.log('Email:', user.Email);
      console.log('Password hash:', user.Password);
      
      // Test password
      const isMatch = await bcrypt.compare('admin123', user.Password);
      console.log('Password "admin123" matches:', isMatch);
      
      if (!isMatch) {
        console.log('Password does not match! Need to update database.');
        console.log('Correct hash for "admin123":', await bcrypt.hash('admin123', 10));
      }
    } else {
      console.log('Admin user not found!');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testLogin(); 