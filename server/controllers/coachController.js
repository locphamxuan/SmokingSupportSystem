const { sql } = require('../db');

exports.getCoaches = async (req, res) => {
  try {
    const result = await sql.query`SELECT Id, Username, Email, PhoneNumber FROM Users WHERE Role = 'coach'`;
    res.json(result.recordset);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy danh sách coach', error: error.message });
  }
};

// Lấy kế hoạch cai thuốc của member
exports.getMemberQuitPlan = async (req, res) => {
  try {
    const { memberId } = req.params;
    const planResult = await sql.query`
      SELECT * FROM QuitPlans WHERE UserId = ${memberId}
    `;
    if (planResult.recordset.length === 0) {
      return res.json({ quitPlan: null });
    }
    const plan = planResult.recordset[0];
    res.json({
      quitPlan: {
        startDate: plan.StartDate,
        targetDate: plan.TargetDate,
        planType: plan.PlanType,
        initialCigarettes: plan.InitialCigarettes,
        dailyReduction: plan.DailyReduction,
        milestones: plan.Milestones ? JSON.parse(plan.Milestones) : [],
        currentProgress: plan.CurrentProgress,
        planDetail: plan.PlanDetail || ''
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy kế hoạch cai thuốc', error: error.message });
  }
};

// Lấy tiến trình của member
exports.getMemberProgress = async (req, res) => {
  try {
    const { memberId } = req.params;
    const progressResult = await sql.query`
      SELECT * FROM Progress WHERE UserId = ${memberId} ORDER BY Date DESC
    `;
    res.json({ progress: progressResult.recordset });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy tiến trình', error: error.message });
  }
};

// Gửi đề xuất điều chỉnh kế hoạch cho member
exports.suggestQuitPlan = async (req, res) => {
  try {
    const coachId = req.user.id || req.user.userId;
    const { memberId } = req.params;
    const { suggestion } = req.body;
    if (!suggestion) return res.status(400).json({ message: 'Nội dung đề xuất không được để trống!' });
    await sql.query`
      INSERT INTO PlanSuggestions (CoachId, MemberId, Suggestion, CreatedAt, Status)
      VALUES (${coachId}, ${memberId}, ${suggestion}, GETDATE(), 'pending')
    `;
    res.json({ success: true, message: 'Đã gửi đề xuất điều chỉnh kế hoạch!' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi gửi đề xuất', error: error.message });
  }
};

// Lấy lịch sử đề xuất
exports.getMemberSuggestions = async (req, res) => {
  try {
    const { memberId } = req.params;
    const coachId = req.user.id || req.user.userId;
    const result = await sql.query`
      SELECT * FROM PlanSuggestions WHERE MemberId = ${memberId} AND CoachId = ${coachId} ORDER BY CreatedAt DESC
    `;
    res.json({ suggestions: result.recordset });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy đề xuất', error: error.message });
  }
};

// Ghi chú cho từng tiến trình
exports.addProgressNote = async (req, res) => {
  try {
    const { memberId, progressId } = req.params;
    const { note } = req.body;
    if (!note) return res.status(400).json({ message: 'Ghi chú không được để trống!' });
    await sql.query`
      UPDATE Progress SET CoachNote = ${note} WHERE Id = ${progressId} AND UserId = ${memberId}
    `;
    res.json({ success: true, message: 'Đã lưu ghi chú cho tiến trình!' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lưu ghi chú', error: error.message });
  }
};
