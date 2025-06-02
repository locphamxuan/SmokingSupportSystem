const { sql } = require('../db');

// Đặt lịch tư vấn
exports.createConsultation = async (req, res) => {
  try {
    const { memberId, coachId, scheduledTime, note } = req.body;
    console.log('Đặt lịch tư vấn:', { memberId, coachId, scheduledTime, note });
    if (!memberId || !coachId || !scheduledTime) {
      return res.status(400).json({ message: 'Thiếu thông tin bắt buộc!' });
    }
    // Kiểm tra memberId và coachId có tồn tại không
    const memberCheck = await sql.query`SELECT Id FROM Users WHERE Id = ${memberId}`;
    const coachCheck = await sql.query`SELECT Id FROM Users WHERE Id = ${coachId} AND Role = 'coach'`;
    if (memberCheck.recordset.length === 0) {
      return res.status(400).json({ message: 'Member không tồn tại!' });
    }
    if (coachCheck.recordset.length === 0) {
      return res.status(400).json({ message: 'Coach không tồn tại!' });
    }
    // Kiểm tra format ngày giờ
    if (isNaN(Date.parse(scheduledTime))) {
      return res.status(400).json({ message: 'Thời gian tư vấn không hợp lệ!' });
    }
    await sql.query`
      INSERT INTO ConsultationSchedules (MemberId, CoachId, ScheduledTime, Note)
      VALUES (${memberId}, ${coachId}, ${scheduledTime}, ${note})
    `;
    res.json({ success: true, message: 'Đặt lịch thành công' });
  } catch (error) {
    console.error('Lỗi khi đặt lịch:', error);
    res.status(500).json({ message: 'Lỗi khi đặt lịch', error: error.message });
  }
};

// Xem lịch tư vấn (kèm thông tin member)
exports.getConsultations = async (req, res) => {
  try {
    const { coachId, memberId, status } = req.query;
    let query = `SELECT cs.*, u.Username as MemberUsername, u.Email as MemberEmail, u.PhoneNumber as MemberPhone, u.Address as MemberAddress
                 FROM ConsultationSchedules cs
                 LEFT JOIN Users u ON cs.MemberId = u.Id
                 WHERE 1=1`;
    if (coachId) query += ` AND cs.CoachId = ${coachId}`;
    if (memberId) query += ` AND cs.MemberId = ${memberId}`;
    if (status) query += ` AND cs.Status = N'${status}'`;
    const result = await sql.query(query);
    res.json(result.recordset);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy lịch', error: error.message });
  }
};

// Cập nhật trạng thái lịch tư vấn
exports.updateConsultationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;
    await sql.query`
      UPDATE ConsultationSchedules
      SET Status = ${status}, Note = ${note}
      WHERE Id = ${id}
    `;
    res.json({ success: true, message: 'Cập nhật trạng thái thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi cập nhật trạng thái', error: error.message });
  }
};
