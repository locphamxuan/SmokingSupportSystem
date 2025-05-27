const bcrypt = require('bcryptjs');
const { sql, connectDB } = require('./db');

async function updatePasswords() {
  try {
    // Kết nối database
    await connectDB();
    
    // Hash các mật khẩu
    const adminHash = await bcrypt.hash('admin123', 10);
    const memberHash = await bcrypt.hash('member123', 10);
    const coachHash = await bcrypt.hash('coach123', 10);
    
    console.log('Updating passwords...');
    
    // Cập nhật mật khẩu admin
    await sql.query`UPDATE Users SET Password = ${adminHash} WHERE Username = 'admin'`;
    console.log('✅ Updated admin password');
    
    // Cập nhật mật khẩu member1
    await sql.query`UPDATE Users SET Password = ${memberHash} WHERE Username = 'member1'`;
    console.log('✅ Updated member1 password');
    
    // Cập nhật mật khẩu coach1
    await sql.query`UPDATE Users SET Password = ${coachHash} WHERE Username = 'coach1'`;
    console.log('✅ Updated coach1 password');
    
    // Kiểm tra kết quả
    const result = await sql.query`SELECT Username, Email, Role, LEFT(Password, 20) + '...' as HashedPassword FROM Users`;
    console.log('\nUpdated users:');
    console.table(result.recordset);
    
    console.log('\n🎉 All passwords updated successfully!');
    console.log('You can now login with:');
    console.log('- admin / admin@smoking.com : admin123');
    console.log('- member1 / member1@gmail.com : member123');
    console.log('- coach1 / coach1@gmail.com : coach123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating passwords:', error);
    process.exit(1);
  }
}

updatePasswords(); 