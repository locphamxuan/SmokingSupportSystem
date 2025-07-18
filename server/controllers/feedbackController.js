const { sql } = require('../db');

const feedbackController = {
  addFeedback: async (req, res) => {
    try {
      const userId = req.user.id;
      const { coachId, message, rating } = req.body;
      if (!coachId || !message || !rating) {
        return res.status(400).json({ message: 'Thiếu thông tin huấn luyện viên, nội dung đánh giá hoặc số sao.' });
      }
      await sql.query`
        INSERT INTO Feedback (UserId, CoachId, Messages, SentAt, Rating)
        VALUES (${userId}, ${coachId}, ${message}, GETDATE(), ${rating})
      `;
      res.status(200).json({ message: 'Gửi đánh giá thành công!' });
    } catch (err) {
      console.error('Lỗi khi gửi feedback:', err);
      res.status(500).json({ message: 'Không thể gửi đánh giá.', error: err.message });
    }
  },
  getFeedbackForCoach: async (req, res) => {
    try {
      const coachId = req.user.id;
      const result = await sql.query`
        SELECT f.FeedbackId, u.Username as CustomerName, f.Messages, f.SentAt, f.Rating
        FROM Feedback f
        JOIN Users u ON f.UserId = u.Id
        WHERE f.CoachId = ${coachId}
        ORDER BY f.SentAt DESC
      `;
      res.status(200).json({ feedbacks: result.recordset });
    } catch (err) {
      console.error('Lỗi khi lấy feedback cho coach:', err);
      res.status(500).json({ message: 'Không thể lấy feedback.', error: err.message });
    }
  }
};

module.exports = feedbackController; 