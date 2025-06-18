const { sql } = require('../db');

// Get user rankings
exports.getRankings = async (req, res) => {
  try {
    const result = await sql.query`
      SELECT r.Id, r.UserId, r.TotalDaysWithoutSmoking, r.TotalMoneySaved, r.LastUpdated, u.Username
      FROM Rankings r
      JOIN Users u ON r.UserId = u.Id
      ORDER BY r.TotalDaysWithoutSmoking DESC, r.TotalMoneySaved DESC
    `;

    const rankings = result.recordset.map(ranking => ({
      id: ranking.Id,
      userId: ranking.UserId,
      totalDaysWithoutSmoking: ranking.TotalDaysWithoutSmoking,
      totalMoneySaved: ranking.TotalMoneySaved,
      lastUpdated: ranking.LastUpdated,
      username: ranking.Username
    }));

    res.json(rankings);
  } catch (error) {
    console.error('Get rankings error:', error);
    res.status(500).json({ message: 'Failed to get rankings', error: error.message });
  }
}; 