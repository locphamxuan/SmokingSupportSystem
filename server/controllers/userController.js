const { sql } = require('../db');

const userController = {
    // Yêu cầu hỗ trợ từ coach
    requestCoach: async (req, res) => {
        try {
            const userId = req.user.id;
            
            // Kiểm tra user có phải thành viên premium không
            const userResult = await sql.query`
                SELECT IsMember, CoachId FROM Users WHERE Id = ${userId}
            `;
            
            const user = userResult.recordset[0];
            if (!user.IsMember) {
                return res.status(403).json({ message: 'Bạn cần là thành viên Premium để sử dụng tính năng này.' });
            }
            
            if (user.CoachId) {
                return res.status(400).json({ message: 'Bạn đã có huấn luyện viên được chỉ định.' });
            }
            
            // Tìm coach có ít thành viên nhất để phân công
            const coachResult = await sql.query`
                SELECT TOP 1 c.Id, COUNT(u.Id) as MemberCount
                FROM Users c
                LEFT JOIN Users u ON c.Id = u.CoachId
                WHERE c.Role = 'coach'
                GROUP BY c.Id
                ORDER BY COUNT(u.Id) ASC
            `;
            
            if (coachResult.recordset.length === 0) {
                return res.status(404).json({ message: 'Hiện tại không có huấn luyện viên nào khả dụng.' });
            }
            
            const assignedCoachId = coachResult.recordset[0].Id;
            
            // Cập nhật CoachId cho user
            await sql.query`
                UPDATE Users 
                SET CoachId = ${assignedCoachId}
                WHERE Id = ${userId}
            `;
            
            res.json({ 
                message: 'Yêu cầu hỗ trợ đã được gửi thành công. Huấn luyện viên sẽ liên hệ với bạn sớm.',
                coachId: assignedCoachId
            });
            
        } catch (error) {
            console.error('Request coach error:', error);
            res.status(500).json({ message: 'Lỗi khi gửi yêu cầu hỗ trợ', error: error.message });
        }
    },

    // Hủy yêu cầu coach
    cancelCoachRequest: async (req, res) => {
        try {
            const userId = req.user.id;
            
            // Kiểm tra user có coach không
            const userResult = await sql.query`
                SELECT CoachId FROM Users WHERE Id = ${userId}
            `;
            
            const user = userResult.recordset[0];
            if (!user.CoachId) {
                return res.status(400).json({ message: 'Bạn chưa có huấn luyện viên nào được chỉ định.' });
            }
            
            // Xóa CoachId
            await sql.query`
                UPDATE Users 
                SET CoachId = NULL
                WHERE Id = ${userId}
            `;
            
            res.json({ message: 'Đã hủy yêu cầu hỗ trợ từ huấn luyện viên thành công.' });
            
        } catch (error) {
            console.error('Cancel coach request error:', error);
            res.status(500).json({ message: 'Lỗi khi hủy yêu cầu hỗ trợ', error: error.message });
        }
    }
};

module.exports = userController; 