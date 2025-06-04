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

async function fixDatabaseSchema() {
  try {
    await sql.connect(config);
    console.log('✅ Connected to database');
    
    // Kiểm tra xem cột cigaretteType đã tồn tại chưa
    const checkColumn = await sql.query`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'SmokingProfiles' AND COLUMN_NAME = 'cigaretteType'
    `;
    
    if (checkColumn.recordset.length === 0) {
      console.log('🔧 Adding cigaretteType column to SmokingProfiles...');
      
      // Thêm cột cigaretteType
      await sql.query`
        ALTER TABLE SmokingProfiles
        ADD cigaretteType NVARCHAR(100)
      `;
      
      console.log('✅ Added cigaretteType column successfully');
    } else {
      console.log('✅ cigaretteType column already exists');
    }
    
    // Kiểm tra xem cột QuitReason đã tồn tại chưa
    const checkQuitReasonColumn = await sql.query`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'SmokingProfiles' AND COLUMN_NAME = 'QuitReason'
    `;
    
    if (checkQuitReasonColumn.recordset.length === 0) {
      console.log('🔧 Adding QuitReason column to SmokingProfiles...');
      
      // Thêm cột QuitReason
      await sql.query`
        ALTER TABLE SmokingProfiles
        ADD QuitReason NVARCHAR(500)
      `;
      
      console.log('✅ Added QuitReason column successfully');
    } else {
      console.log('✅ QuitReason column already exists');
    }
    
    // Kiểm tra cấu trúc bảng cuối cùng
    const columns = await sql.query`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'SmokingProfiles'
      ORDER BY ORDINAL_POSITION
    `;
    
    console.log('\n📋 SmokingProfiles table structure:');
    columns.recordset.forEach(col => {
      console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE} (${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'})`);
    });
    
    await sql.close();
    console.log('\n🎉 Database schema updated successfully!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixDatabaseSchema(); 