const { sql, connectDB } = require('./db');

async function debugLogin() {
  try {
    await connectDB();
    
    const emailOrUsername = 'admin@smoking.com';
    const password = 'admin123';
    
    console.log('Testing login for:', emailOrUsername);
    console.log('With password:', password);
    
    // Test database query
    const result = await sql.query`
      SELECT * FROM Users 
      WHERE Email = ${emailOrUsername} OR Username = ${emailOrUsername}
    `;
    
    console.log('Query result:', result.recordset.length, 'users found');
    
    if (result.recordset.length > 0) {
      const user = result.recordset[0];
      console.log('Found user:');
      console.log('- Username:', user.Username);
      console.log('- Email:', user.Email);
      console.log('- Role:', user.Role);
      console.log('- Password in DB:', user.Password);
      console.log('- Input password:', password);
      console.log('- Passwords match:', password === user.Password);
      
      if (password === user.Password) {
        console.log('✅ Login should succeed!');
      } else {
        console.log('❌ Password mismatch!');
      }
    } else {
      console.log('❌ No user found!');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

debugLogin(); 