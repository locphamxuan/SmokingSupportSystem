const sql = require('mssql');
const bcrypt = require('bcryptjs');

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

async function fixPasswords() {
  try {
    await sql.connect(config);
    console.log('✅ Connected to database');
    
    // Get users with plain text passwords
    const usersResult = await sql.query(`
      SELECT Id, Username, Email, Password, Role 
      FROM Users 
      WHERE Password NOT LIKE '$2%'
    `);
    
    console.log(`\n🔧 Found ${usersResult.recordset.length} users with plain text passwords`);
    
    for (const user of usersResult.recordset) {
      console.log(`\nProcessing: ${user.Email}`);
      console.log(`Current password: ${user.Password}`);
      
      // Hash the plain text password
      const hashedPassword = await bcrypt.hash(user.Password, 10);
      console.log(`New hashed password: ${hashedPassword.substring(0, 20)}...`);
      
      // Update the password in database
      await sql.query`
        UPDATE Users 
        SET Password = ${hashedPassword}
        WHERE Id = ${user.Id}
      `;
      
      console.log(`✅ Updated password for ${user.Email}`);
    }
    
    console.log('\n🎉 All passwords have been hashed successfully!');
    console.log('\n📋 Test accounts you can use:');
    console.log('1. admin@smoking.com / admin123');
    console.log('2. member1@gmail.com / member123');
    console.log('3. coach1@gmail.com / coach123');
    
    await sql.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixPasswords(); 