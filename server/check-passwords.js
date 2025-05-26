const sql = require('mssql');

const config = {
  user: 'sa',
  password: '12345',
  server: 'localhost',
  database: 'SmokingSupportPlatform',
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};

async function checkPasswords() {
  try {
    await sql.connect(config);
    console.log('✅ Connected to database');
    
    // Check actual passwords
    const usersResult = await sql.query('SELECT Username, Email, Password, Role FROM Users');
    console.log('\n📋 Users and their passwords:');
    
    usersResult.recordset.forEach((user, index) => {
      console.log(`${index + 1}. ${user.Email}`);
      console.log(`   Username: ${user.Username}`);
      console.log(`   Role: ${user.Role}`);
      console.log(`   Password: ${user.Password}`);
      console.log(`   Password length: ${user.Password.length}`);
      console.log(`   Is bcrypt hash: ${user.Password.startsWith('$2') ? 'Yes' : 'No'}`);
      console.log('');
    });
    
    await sql.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkPasswords(); 