const { sql } = require('../db');
const { sendUnifiedNotification } = require('./emailService');

// Check and award badges based on user progress
const checkAndAwardBadges = async (userId) => {
  try {
    console.log(`Checking badges for user ${userId}...`);
    
    // Calculate current streak of smoke-free days
    const streakResult = await calculateSmokeFreeDays(userId);
    const currentStreak = streakResult.streak;
    
    // Calculate total money saved
    const moneySaved = await calculateMoneySaved(userId);
    
    console.log(`User ${userId} - Streak: ${currentStreak} days, Money saved: ${moneySaved} VND`);
    
    const newBadges = [];
    
    // Badge criteria based on smoke-free days
    const daysBadges = [
      { days: 1, badgeId: 1, name: '1 ngày không hút thuốc' },
      { days: 3, badgeId: 2, name: '3 ngày không hút thuốc' },
      { days: 5, badgeId: 3, name: '5 ngày không hút thuốc' },
      { days: 7, badgeId: 4, name: '7 ngày không hút thuốc' },
      { days: 14, badgeId: 5, name: '14 ngày không hút thuốc' },
      { days: 30, badgeId: 6, name: '30 ngày không hút thuốc' },
      { days: 60, badgeId: 7, name: '60 ngày không hút thuốc' }
    ];
    
    // Check each badge criteria
    for (const badge of daysBadges) {
      if (currentStreak >= badge.days) {
        // Check if user already has this badge
        const existingBadge = await sql.query`
          SELECT Id FROM UserBadges 
          WHERE UserId = ${userId} AND BadgeId = ${badge.badgeId}
        `;
        
        if (existingBadge.recordset.length === 0) {
          // Award the badge
          await sql.query`
            INSERT INTO UserBadges (UserId, BadgeId, AwardedAt)
            VALUES (${userId}, ${badge.badgeId}, GETDATE())
          `;
          
          // Get badge details
          const badgeInfo = await sql.query`
            SELECT Name, Description FROM Badges WHERE Id = ${badge.badgeId}
          `;
          
          if (badgeInfo.recordset.length > 0) {
            const badgeData = badgeInfo.recordset[0];
            newBadges.push(badgeData);
            
            // Send unified achievement notification (both app and email)
            const achievementMessage = `🎉 Chúc mừng! Bạn đã đạt được thành tích "${badgeData.Name}"! ${badgeData.Description}`;
            await sendUnifiedNotification(userId, achievementMessage, 'achievement');
            
            console.log(`Badge awarded: ${badgeData.Name} to user ${userId}`);
          }
        }
      }
    }
    
    // Check money-saved milestones (additional feature)
    const moneyMilestones = [
      { amount: 50000, message: '💰 Tuyệt vời! Bạn đã tiết kiệm được 50,000 VND!' },
      { amount: 100000, message: '💰 Xuất sắc! Bạn đã tiết kiệm được 100,000 VND!' },
      { amount: 500000, message: '💰 Không thể tin được! Bạn đã tiết kiệm được 500,000 VND!' },
      { amount: 1000000, message: '💸 Chúc mừng! Bạn đã tiết kiệm được 1,000,000 VND!' }
    ];
    
    for (const milestone of moneyMilestones) {
      if (moneySaved >= milestone.amount) {
        // Check if we've already sent this milestone notification
        const existingNotification = await sql.query`
          SELECT Id FROM Notifications 
          WHERE UserId = ${userId} 
          AND Message LIKE '%${milestone.amount}%' 
          AND Type = 'money_milestone'
        `;
        
        if (existingNotification.recordset.length === 0) {
          await sendUnifiedNotification(userId, milestone.message, 'money_milestone');
          console.log(`Money milestone notification sent: ${milestone.amount} VND to user ${userId}`);
        }
      }
    }
    
    return {
      newBadges,
      currentStreak,
      moneySaved
    };
    
  } catch (error) {
    console.error('Error checking and awarding badges:', error);
    return { newBadges: [], currentStreak: 0, moneySaved: 0 };
  }
};

// Calculate consecutive smoke-free days
const calculateSmokeFreeDays = async (userId) => {
  try {
    // Get recent smoking logs ordered by date desc
    const logs = await sql.query`
      SELECT Cigarettes, LogDate 
      FROM SmokingDailyLog 
      WHERE UserId = ${userId} 
      ORDER BY LogDate DESC
    `;
    
    let streak = 0;
    let totalSmokeFree = 0;
    
    // Calculate current streak (consecutive days without smoking)
    for (const log of logs.recordset) {
      if (Number(log.Cigarettes) === 0) {
        if (streak === totalSmokeFree) { // Still in current streak
          streak++;
        }
        totalSmokeFree++;
      } else {
        if (streak === totalSmokeFree) { // Break current streak
          break;
        }
        totalSmokeFree++;
      }
    }
    
    return { streak, totalSmokeFree };
  } catch (error) {
    console.error('Error calculating smoke-free days:', error);
    return { streak: 0, totalSmokeFree: 0 };
  }
};

// Calculate total money saved
const calculateMoneySaved = async (userId) => {
  try {
    const result = await sql.query`
      SELECT ISNULL(SUM(SavedMoney), 0) as TotalSaved
      FROM SmokingDailyLog 
      WHERE UserId = ${userId}
    `;
    
    return result.recordset[0]?.TotalSaved || 0;
  } catch (error) {
    console.error('Error calculating money saved:', error);
    return 0;
  }
};

module.exports = {
  checkAndAwardBadges,
  calculateSmokeFreeDays,
  calculateMoneySaved
};