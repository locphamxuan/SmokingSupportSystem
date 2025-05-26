const sql = require('mssql');

const config = {
  user: 'sa',
  password: '12345',
  server: 'localhost',
  database: 'master',
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};

async function checkDatabase() {
  try {
    await sql.connect(config);
    console.log('✅ Connected to SQL Server');
    
    // Check if database exists
    const result = await sql.query(`
      SELECT name FROM sys.databases 
      WHERE name = 'SmokingSupportPlatform'
    `);
    
    if (result.recordset.length > 0) {
      console.log('✅ Database SmokingSupportPlatform exists');
      
      // Test connection to the specific database
      await sql.close();
      
      const appConfig = {
        ...config,
        database: 'SmokingSupportPlatform'
      };
      
      await sql.connect(appConfig);
      console.log('✅ Connected to SmokingSupportPlatform database');
      
      // Check if Users table exists
      const tableResult = await sql.query(`
        SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_NAME = 'Users'
      `);
      
      if (tableResult.recordset.length > 0) {
        console.log('✅ Users table exists');
      } else {
        console.log('❌ Users table does not exist');
        console.log('💡 You need to run the SQL script to create tables');
      }
      
    } else {
      console.log('❌ Database SmokingSupportPlatform does not exist');
      console.log('💡 You need to run the SQL script to create the database');
    }
    
    await sql.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkDatabase(); 