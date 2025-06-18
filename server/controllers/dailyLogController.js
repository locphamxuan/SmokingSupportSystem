const { sql } = require('../db');

// Get user's daily smoking log
exports.getDailyLog = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await sql.query`
      SELECT * FROM SmokingDailyLog WHERE UserId = ${userId} ORDER BY LogDate DESC
    `;
    const logs = result.recordset.map(log => ({
      id: log.Id,
      userId: log.UserId,
      progressId: log.ProgressId,
      logDate: log.LogDate,
      cigarettes: log.Cigarettes,
      feeling: log.Feeling
    }));
    res.json(logs);
  } catch (error) {
    console.error('Get daily log error:', error);
    res.status(500).json({ message: 'Failed to get daily log', error: error.message });
  }
};

// Add daily smoking log entry
exports.addDailyLog = async (req, res) => {
  try {
    const userId = req.user.id;
    const { cigarettes, feeling, logDate } = req.body;
    if (typeof cigarettes !== 'number') {
      return res.status(400).json({ message: 'Cigarettes is required and must be a number' });
    }
    const result = await sql.query`
      INSERT INTO SmokingDailyLog (UserId, Cigarettes, Feeling, LogDate)
      VALUES (${userId}, ${cigarettes}, ${feeling || ''}, ${logDate || new Date().toISOString().slice(0,10)})
      SELECT SCOPE_IDENTITY() AS Id;
    `;
    const logId = result.recordset[0].Id;
    res.status(201).json({
      message: 'Daily log entry added successfully',
      logEntry: {
        id: logId,
        userId,
        cigarettes,
        feeling: feeling || '',
        logDate: logDate || new Date().toISOString().slice(0,10)
      }
    });
  } catch (error) {
    console.error('Add daily log error:', error);
    res.status(500).json({ message: 'Failed to add daily log', error: error.message });
  }
}; 