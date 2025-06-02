const { sql } = require('../db');
exports.getCoaches = async (req, res) => {
  try {
    const result = await sql.query`SELECT Id, Username, Email, PhoneNumber FROM Users WHERE Role = 'coach'`;
    res.json(result.recordset);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy danh sách coach', error: error.message });
  }
};
