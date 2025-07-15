const { sql } = require('../db');

// Get user rankings
exports.getRankings = async (req, res) => {
  try {
    const result = await sql.query(`
      SELECT 
        u.Id AS userId,
        u.Username,
        u.Role,
        COUNT(CASE WHEN sdl.Cigarettes = 0 THEN 1 END) AS daysWithoutSmoking
      FROM Users u
      LEFT JOIN SmokingDailyLog sdl ON u.Id = sdl.UserId
      WHERE u.Role IN ('member', 'memberVip')
      GROUP BY u.Id, u.Username, u.Role
      ORDER BY daysWithoutSmoking DESC, u.Id ASC
    `);
    const rows = result.recordset;
    const rankings = rows.map((row, idx) => ({
      rank: idx + 1,
      userId: row.userId,
      username: row.Username,
      daysWithoutSmoking: row.daysWithoutSmoking
    }));
    res.json({ success: true, rankings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi lấy bảng xếp hạng' });
  }
}; 