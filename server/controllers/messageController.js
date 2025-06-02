const { sql } = require('../db');

// Gửi tin nhắn
exports.sendMessage = async (req, res) => {
  try {
    const { senderId, receiverId, content } = req.body;
    await sql.query`
      INSERT INTO Messages (SenderId, ReceiverId, Content)
      VALUES (${senderId}, ${receiverId}, ${content})
    `;
    res.json({ success: true, message: 'Gửi tin nhắn thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi gửi tin nhắn', error: error.message });
  }
};

// Lấy lịch sử trò chuyện
exports.getMessages = async (req, res) => {
  try {
    const { user1, user2 } = req.query;
    const result = await sql.query`
      SELECT * FROM Messages
      WHERE (SenderId = ${user1} AND ReceiverId = ${user2})
         OR (SenderId = ${user2} AND ReceiverId = ${user1})
      ORDER BY SentAt ASC
    `;
    res.json(result.recordset);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy tin nhắn', error: error.message });
  }
};

exports.getChatMembersForCoach = async (req, res) => {
  const coachId = req.user.userId || req.query.coachId;
  const result = await sql.query`
    SELECT DISTINCT u.Id, u.Username, u.Email
    FROM Messages m
    JOIN Users u ON u.Id = m.SenderId
    WHERE m.ReceiverId = ${coachId} AND u.Role != 'coach'
  `;
  res.json(result.recordset);
};
