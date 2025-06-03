const { connectDB, sql } = require('./db');

async function testAdminUsers() {
  try {
    console.log('=== Testing admin getUsers ===');
    
    // Connect to database using connectDB function
    console.log('Connecting to database...');
    await connectDB();
    console.log('✅ Connected successfully!');
    
    // Test basic user query
    console.log('\n1. Testing basic Users query...');
    const userResult = await sql.query`
      SELECT Id, Username, Email, Role, IsMember, PhoneNumber, Address, CreatedAt
      FROM Users
      ORDER BY CreatedAt DESC
    `;
    console.log('Users found:', userResult.recordset.length);
    console.log('Users data:', userResult.recordset);
    
    // Test smoking profiles query
    console.log('\n2. Testing SmokingProfiles query...');
    const profilesResult = await sql.query`
      SELECT UserId, cigarettesPerDay, costPerPack, smokingFrequency, healthStatus, cigaretteType, QuitReason
      FROM SmokingProfiles
    `;
    console.log('Profiles found:', profilesResult.recordset.length);
    console.log('Profiles data:', profilesResult.recordset);
    
    // Test daily logs query
    console.log('\n3. Testing SmokingDailyLog query...');
    const today = new Date().toISOString().split('T')[0];
    console.log('Today date:', today);
    const dailyLogsResult = await sql.query`
      SELECT UserId, Cigarettes, Feeling
      FROM SmokingDailyLog
      WHERE LogDate = ${today}
    `;
    console.log('Daily logs found:', dailyLogsResult.recordset.length);
    console.log('Daily logs data:', dailyLogsResult.recordset);
    
  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    process.exit(0);
  }
}

testAdminUsers(); 