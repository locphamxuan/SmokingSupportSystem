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