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
    const memberCheck = await sql.query`
      SELECT Id, IsMember, Role 
      FROM Users 
      WHERE Id = ${memberId}
    `;
    const coachCheck = await sql.query`
      SELECT Id, Role 
      FROM Users 
      WHERE Id = ${coachId} AND Role = 'coach'
    `;

    if (memberCheck.recordset.length === 0) {
      return res.status(400).json({ message: 'Member không tồn tại!' });
    }
    if (coachCheck.recordset.length === 0) {
      return res.status(400).json({ message: 'Coach không tồn tại!' });
    }

    // Kiểm tra member có gói premium không
    const member = memberCheck.recordset[0];
    if (!member.IsMember || member.Role !== 'member') {
      return res.status(403).json({ 
        message: 'Bạn cần nâng cấp lên gói Premium để sử dụng tính năng này!',
        code: 'PREMIUM_REQUIRED'
      });
    }

    // Kiểm tra format ngày giờ
    if (isNaN(Date.parse(scheduledTime))) {
      return res.status(400).json({ message: 'Thời gian tư vấn không hợp lệ!' });
    }

    // Kiểm tra thời gian đặt lịch phải trong tương lai
    const scheduledDate = new Date(scheduledTime);
    const now = new Date();
    if (scheduledDate <= now) {
      return res.status(400).json({ message: 'Thời gian tư vấn phải trong tương lai!' });
    }

    await sql.query`
      INSERT INTO ConsultationSchedules (MemberId, CoachId, ScheduledTime, Note, Status)
      VALUES (${memberId}, ${coachId}, ${scheduledTime}, ${note}, 'chua tu van')
    `;
    res.json({ success: true, message: 'Đặt lịch thành công' });
  } catch (error) {
    console.error('Lỗi khi đặt lịch:', error);
    res.status(500).json({ message: 'Lỗi khi đặt lịch', error: error.message });
  }
};

// Xem lịch tư vấn
exports.getConsultations = async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;
    const userRole = req.user.role;
    console.log('Lấy lịch tư vấn cho:', userId, userRole);

    let query;
    if (userRole === 'admin') {
      // Admin xem tất cả lịch
      query = await sql.query`
        SELECT cs.*, 
          m.Username as MemberName, m.Email as MemberEmail,
          c.Username as CoachName, c.Email as CoachEmail
        FROM ConsultationSchedules cs
        JOIN Users m ON cs.MemberId = m.Id
        JOIN Users c ON cs.CoachId = c.Id
        ORDER BY cs.ScheduledTime DESC
      `;
    } else if (userRole === 'coach') {
      // Coach chỉ xem lịch của mình
      query = await sql.query`
        SELECT cs.*, 
          m.Username as MemberName, m.Email as MemberEmail
        FROM ConsultationSchedules cs
        JOIN Users m ON cs.MemberId = m.Id
        WHERE cs.CoachId = ${userId}
        ORDER BY cs.ScheduledTime DESC
      `;
      console.log('Kết quả truy vấn:', query.recordset);
    } else if (userRole === 'member') {
      // Member chỉ xem lịch của mình
      query = await sql.query`
        SELECT cs.*, 
          c.Username as CoachName, c.Email as CoachEmail
        FROM ConsultationSchedules cs
        JOIN Users c ON cs.CoachId = c.Id
        WHERE cs.MemberId = ${userId}
        ORDER BY cs.ScheduledTime DESC
      `;
    } else {
      return res.status(403).json({ message: 'Không có quyền truy cập!' });
    }

    res.json(query.recordset);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách lịch tư vấn:', error);
    res.status(500).json({ message: 'Lỗi khi lấy danh sách lịch tư vấn', error: error.message });
  }
};

// Cập nhật trạng thái lịch tư vấn
exports.updateConsultationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.id || req.user.userId;
    const userRole = req.user.role;
    console.log('Cập nhật trạng thái:', { id, status, userId, userRole });

    // Kiểm tra quyền
    if (userRole !== 'coach' && userRole !== 'admin') {
      return res.status(403).json({ message: 'Không có quyền cập nhật trạng thái!' });
    }

    // Kiểm tra lịch tư vấn tồn tại
    const consultation = await sql.query`
      SELECT * FROM ConsultationSchedules WHERE Id = ${id}
    `;

    if (consultation.recordset.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy lịch tư vấn!' });
    }
    console.log('Lịch tư vấn:', consultation.recordset[0]);

    // Kiểm tra nếu là coach thì chỉ được cập nhật lịch của mình
    if (userRole === 'coach' && consultation.recordset[0].CoachId != userId) {
      return res.status(403).json({ message: 'Không có quyền cập nhật lịch tư vấn này!' });
    }

    // Cập nhật trạng thái
    await sql.query`
      UPDATE ConsultationSchedules 
      SET Status = ${status}
      WHERE Id = ${id}
    `;

    res.json({ success: true, message: 'Cập nhật trạng thái thành công' });
  } catch (error) {
    console.error('Lỗi khi cập nhật trạng thái:', error);
    res.status(500).json({ message: 'Lỗi khi cập nhật trạng thái', error: error.message });
  }
}; 