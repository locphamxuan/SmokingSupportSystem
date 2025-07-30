const { sql } = require('../db');

// Get user notifications
exports.getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await sql.query`
      SELECT * FROM Notifications 
      WHERE UserId = ${userId} 
      ORDER BY CreatedAt DESC
    `;

    const notifications = result.recordset.map(notification => ({
      id: notification.Id,
      userId: notification.UserId,
      message: notification.Message,
      type: notification.Type,
      createdAt: notification.CreatedAt,
      isRead: notification.IsRead
    }));

    res.json(notifications);
  } catch (error) {
    console.error('Get user notifications error:', error);
    res.status(500).json({ message: 'Failed to get notifications', error: error.message });
  }
};

// Mark notification as read
exports.markNotificationAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const notificationId = req.params.notificationId;

    const result = await sql.query`
      UPDATE Notifications 
      SET IsRead = 1 
      WHERE Id = ${notificationId} AND UserId = ${userId}
    `;

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ message: 'Notification marked as read successfully' });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({ message: 'Failed to mark notification as read', error: error.message });
  }
};

// Create notification
exports.createNotification = async (userId, message, type = 'general') => {
  try {
    await sql.query`
      INSERT INTO Notifications (UserId, Message, Type, CreatedAt, IsRead)
      VALUES (${userId}, ${message}, ${type}, GETDATE(), 0)
    `;
  } catch (error) {
    console.error('Create notification error:', error);
  }
};

// Send achievement notification when badge is earned
exports.sendAchievementNotification = async (userId, badgeName, badgeDescription) => {
  try {
    const message = `🎉 Chúc mừng! Bạn đã đạt được thành tích "${badgeName}"! ${badgeDescription}`;
    await exports.createNotification(userId, message, 'achievement');
    console.log(`Achievement notification sent to user ${userId}: ${badgeName}`);
  } catch (error) {
    console.error('Error sending achievement notification:', error);
  }
};

// Send motivational notification
exports.sendMotivationalMessage = async (userId) => {
  try {
    // Get random motivational message
    const result = await sql.query`SELECT Message FROM MotivationNotifications`;
    if (result.recordset.length > 0) {
      const randomMessage = result.recordset[Math.floor(Math.random() * result.recordset.length)];
      await exports.createNotification(userId, randomMessage.Message, 'motivation');
      console.log(`Motivational notification sent to user ${userId}`);
    }
  } catch (error) {
    console.error('Error sending motivational notification:', error);
  }
};

// Get notification statistics
exports.getNotificationStats = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const stats = await sql.query`
      SELECT 
        COUNT(*) as TotalNotifications,
        SUM(CASE WHEN IsRead = 1 THEN 1 ELSE 0 END) as ReadNotifications,
        SUM(CASE WHEN IsRead = 0 THEN 1 ELSE 0 END) as UnreadNotifications,
        COUNT(CASE WHEN Type = 'achievement' THEN 1 END) as AchievementNotifications,
        COUNT(CASE WHEN Type = 'daily' THEN 1 END) as DailyNotifications,
        COUNT(CASE WHEN Type = 'weekly' THEN 1 END) as WeeklyNotifications
      FROM Notifications 
      WHERE UserId = ${userId}
    `;
    
    res.json(stats.recordset[0]);
  } catch (error) {
    console.error('Get notification stats error:', error);
    res.status(500).json({ message: 'Failed to get notification statistics', error: error.message });
  }
};

exports.getPublicNotifications = async (req, res) => {
  try {
    const reward = await sql.query`SELECT * FROM RewardNotifications`;
    const daily = await sql.query`SELECT * FROM DailyNotifications`;
    const weekly = await sql.query`SELECT * FROM WeeklyNotifications`;
    const motivation = await sql.query`SELECT * FROM MotivationNotifications`;
    res.json({
      reward: reward.recordset,
      daily: daily.recordset,
      weekly: weekly.recordset,
      motivation: motivation.recordset
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get public notifications', error: error.message });
  }
}; 