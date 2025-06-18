const { sql } = require('../db');

// Get user statistics
exports.getUserStatistics = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user statistics
    const result = await sql.query`
      SELECT * FROM UserStatistics WHERE UserId = ${userId}
    `;

    if (result.recordset.length === 0) {
      // Create default statistics if not exists
      await sql.query`
        INSERT INTO UserStatistics (UserId, TotalDaysWithoutSmoking, TotalMoneySaved, HealthImprovements, LastUpdated)
        VALUES (${userId}, 0, 0, '', GETDATE())
      `;
      
      return res.json({
        id: null,
        userId: userId,
        totalDaysWithoutSmoking: 0,
        totalMoneySaved: 0,
        healthImprovements: '',
        lastUpdated: new Date().toISOString()
      });
    }

    const stats = result.recordset[0];
    res.json({
      id: stats.Id,
      userId: stats.UserId,
      totalDaysWithoutSmoking: stats.TotalDaysWithoutSmoking || 0,
      totalMoneySaved: stats.TotalMoneySaved || 0,
      healthImprovements: stats.HealthImprovements || '',
      lastUpdated: stats.LastUpdated
    });
  } catch (error) {
    console.error('Get user statistics error:', error);
    res.status(500).json({ message: 'Failed to get user statistics', error: error.message });
  }
};

// Update user statistics
exports.updateUserStatistics = async (req, res) => {
  try {
    const userId = req.user.id;
    const { totalDaysWithoutSmoking, totalMoneySaved, healthImprovements } = req.body;

    // Check if statistics exist
    const checkResult = await sql.query`
      SELECT * FROM UserStatistics WHERE UserId = ${userId}
    `;

    if (checkResult.recordset.length === 0) {
      // Create new statistics
      await sql.query`
        INSERT INTO UserStatistics (UserId, TotalDaysWithoutSmoking, TotalMoneySaved, HealthImprovements, LastUpdated)
        VALUES (${userId}, ${totalDaysWithoutSmoking || 0}, ${totalMoneySaved || 0}, ${healthImprovements || ''}, GETDATE())
      `;
    } else {
      // Update existing statistics
      await sql.query`
        UPDATE UserStatistics 
        SET TotalDaysWithoutSmoking = ${totalDaysWithoutSmoking || 0},
            TotalMoneySaved = ${totalMoneySaved || 0},
            HealthImprovements = ${healthImprovements || ''},
            LastUpdated = GETDATE()
        WHERE UserId = ${userId}
      `;
    }

    res.json({ message: 'User statistics updated successfully' });
  } catch (error) {
    console.error('Update user statistics error:', error);
    res.status(500).json({ message: 'Failed to update user statistics', error: error.message });
  }
}; 