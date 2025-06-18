const { sql } = require('../db');

// Submit a report
exports.submitReport = async (req, res) => {
  try {
    const userId = req.user.id;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ message: 'Report content is required' });
    }

    const result = await sql.query`
      INSERT INTO Reports (UserId, Content, CreatedAt)
      VALUES (${userId}, ${content}, GETDATE());
      SELECT SCOPE_IDENTITY() AS Id;
    `;

    const reportId = result.recordset[0].Id;

    res.status(201).json({
      message: 'Report submitted successfully',
      report: {
        id: reportId,
        userId: userId,
        content: content,
        createdAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Submit report error:', error);
    res.status(500).json({ message: 'Failed to submit report', error: error.message });
  }
};

// Get all reports (admin only)
exports.getAllReports = async (req, res) => {
  try {
    const result = await sql.query`
      SELECT r.Id, r.UserId, r.Content, r.CreatedAt, u.Username, u.Email
      FROM Reports r
      JOIN Users u ON r.UserId = u.Id
      ORDER BY r.CreatedAt DESC
    `;

    const reports = result.recordset.map(report => ({
      id: report.Id,
      userId: report.UserId,
      content: report.Content,
      createdAt: report.CreatedAt,
      username: report.Username,
      email: report.Email
    }));

    res.json(reports);
  } catch (error) {
    console.error('Get all reports error:', error);
    res.status(500).json({ message: 'Failed to get reports', error: error.message });
  }
}; 