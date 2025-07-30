// Scheduler setup
const schedule = require('node-schedule');
const { sql } = require('../db');
const { sendBulkUnifiedNotification } = require('./emailService');

// Send daily notifications
const sendDailyNotifications = () => {
  schedule.scheduleJob('0 9 * * *', async () => { // Every day at 09:00
    try {
      console.log('Sending daily notifications...');
      
      // Get random daily message
      const dailyMessages = await sql.query`SELECT Message FROM DailyNotifications`;
      if (dailyMessages.recordset.length === 0) return;
      
      const randomMessage = dailyMessages.recordset[Math.floor(Math.random() * dailyMessages.recordset.length)];
      
      // Get all users
      const users = await sql.query`SELECT Id FROM Users WHERE Role IN ('member', 'memberVip')`;
      const userIds = users.recordset.map(user => user.Id);
      
      // Send unified notification (both app and email)
      await sendBulkUnifiedNotification(userIds, randomMessage.Message, 'daily');
      
      console.log(`Daily notifications sent to ${users.recordset.length} users`);
    } catch (error) {
      console.error('Error sending daily notifications:', error);
    }
  });
};

// Send weekly notifications
const sendWeeklyNotifications = () => {
  schedule.scheduleJob('0 10 * * 1', async () => { // Every Monday at 10:00
    try {
      console.log('Sending weekly notifications...');
      
      // Get random weekly message
      const weeklyMessages = await sql.query`SELECT Message FROM WeeklyNotifications`;
      if (weeklyMessages.recordset.length === 0) return;
      
      const randomMessage = weeklyMessages.recordset[Math.floor(Math.random() * weeklyMessages.recordset.length)];
      
      // Get all users
      const users = await sql.query`SELECT Id FROM Users WHERE Role IN ('member', 'memberVip')`;
      const userIds = users.recordset.map(user => user.Id);
      
      // Send unified notification (both app and email)
      await sendBulkUnifiedNotification(userIds, randomMessage.Message, 'weekly');
      
      console.log(`Weekly notifications sent to ${users.recordset.length} users`);
    } catch (error) {
      console.error('Error sending weekly notifications:', error);
    }
  });
};

// Send motivation notifications (can be triggered manually or on certain events)
const sendMotivationNotification = async (userId) => {
  try {
    const motivationMessages = await sql.query`SELECT Message FROM MotivationNotifications`;
    if (motivationMessages.recordset.length === 0) return;
    
    const randomMessage = motivationMessages.recordset[Math.floor(Math.random() * motivationMessages.recordset.length)];
    
    // Import the unified service here to avoid circular dependency
    const { sendUnifiedNotification } = require('./emailService');
    await sendUnifiedNotification(userId, randomMessage.Message, 'motivation');
    
    console.log(`Motivation notification sent to user ${userId}`);
  } catch (error) {
    console.error('Error sending motivation notification:', error);
  }
};

module.exports = { 
  sendDailyNotifications, 
  sendWeeklyNotifications, 
  sendMotivationNotification 
};