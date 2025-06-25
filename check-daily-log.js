const { sql } = require('./db');

async function checkDailyLog() {
  try {
    console.log('🔍 Checking SmokingDailyLog table...');
    
    // Kiểm tra 10 records mới nhất
    const latestRecords = await sql.query`
      SELECT TOP 10 Id, UserId, LogDate, Cigarettes, Feeling, PlanId, SuggestedPlanId
      FROM SmokingDailyLog 
      ORDER BY Id DESC
    `;
    
    console.log('📊 Latest 10 records in SmokingDailyLog:');
    console.table(latestRecords.recordset);
    
    // Kiểm tra records của user phong (UserId = 9)
    const userRecords = await sql.query`
      SELECT Id, UserId, LogDate, Cigarettes, Feeling, PlanId, SuggestedPlanId
      FROM SmokingDailyLog 
      WHERE UserId = 9
      ORDER BY Id DESC
    `;
    
    console.log('👤 Records for user phong (UserId = 9):');
    console.table(userRecords.recordset);
    
    // Kiểm tra record với SuggestedPlanId = 3
    const planRecords = await sql.query`
      SELECT Id, UserId, LogDate, Cigarettes, Feeling, PlanId, SuggestedPlanId
      FROM SmokingDailyLog 
      WHERE SuggestedPlanId = 3
      ORDER BY Id DESC
    `;
    
    console.log('📋 Records with SuggestedPlanId = 3:');
    console.table(planRecords.recordset);
    
    // Kiểm tra record hôm nay
    const todayRecords = await sql.query`
      SELECT Id, UserId, LogDate, Cigarettes, Feeling, PlanId, SuggestedPlanId
      FROM SmokingDailyLog 
      WHERE LogDate = '2025-06-24'
      ORDER BY Id DESC
    `;
    
    console.log('📅 Records for today (2025-06-24):');
    console.table(todayRecords.recordset);
    
    console.log('✅ Database check completed!');
    
  } catch (error) {
    console.error('❌ Error checking database:', error);
  } finally {
    process.exit(0);
  }
}

checkDailyLog(); 