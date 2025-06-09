const { sql } = require('../db');

const messageController = {
    sendMessage: async (req, res) => {
        try {
            const userId = req.user.id;
            const { receiverId, content, progressId } = req.body;

            if (!content || !content.trim()) {
                return res.status(400).json({ message: 'Nội dung tin nhắn không được để trống' });
            }

            // Kiểm tra quyền gửi tin nhắn
            const userCheck = await sql.query`
                SELECT IsMember, CoachId, Role FROM Users WHERE Id = ${userId}
            `;
            const user = userCheck.recordset[0];
            console.log(`SendMessage Debug: UserId: ${userId}, ReceiverId: ${receiverId}, UserRole: ${user.Role}, IsMember: ${user.IsMember}, UserCoachId: ${user.CoachId}`);

            // Người dùng có thể gửi tin nhắn cho coach nếu là thành viên premium
            // Coach có thể gửi tin nhắn cho member được gán cho họ
            if (user.Role === 'user' || user.Role === 'member') {
                if (!user || !user.IsMember) {
                    return res.status(403).json({ message: 'Bạn cần là thành viên Premium để sử dụng tính năng này' });
                }
                if (user.CoachId !== parseInt(receiverId)) {
                    return res.status(403).json({ message: 'Bạn chỉ có thể gửi tin nhắn cho huấn luyện viên của mình' });
                }
            } else if (user.Role === 'coach') {
                // Coach gửi tin nhắn cho member
                const memberCheck = await sql.query`
                    SELECT CoachId FROM Users WHERE Id = ${receiverId}
                `;
                const member = memberCheck.recordset[0];
                if (!member || member.CoachId !== userId) {
                    return res.status(403).json({ message: 'Bạn không có quyền gửi tin nhắn cho thành viên này.' });
                }
            } else {
                console.log(`SendMessage Debug: User role not allowed for sending messages: ${user.Role}`);
                return res.status(403).json({ message: 'Tài khoản của bạn không được phép gửi tin nhắn.' });
            }

            // Kiểm tra progressId nếu có
            if (progressId) {
                const progressCheck = await sql.query`
                    SELECT Id FROM Progress WHERE Id = ${progressId} AND UserId = ${userId}
                `;
                if (progressCheck.recordset.length === 0) {
                    return res.status(400).json({ message: 'Progress ID không hợp lệ' });
                }
            }

            // Thêm tin nhắn mới
            const result = await sql.query`
                INSERT INTO Messages (SenderId, ReceiverId, ProgressId, Content, SentAt, IsRead)
                VALUES (${userId}, ${receiverId}, ${progressId || null}, ${content.trim()}, GETDATE(), 0);
                SELECT SCOPE_IDENTITY() AS Id;
            `;

            const messageId = result.recordset[0].Id;

            // Lấy tin nhắn vừa gửi với thông tin người gửi và người nhận
            const newMessage = await sql.query`
                SELECT 
                    m.Id,
                    m.SenderId,
                    m.ReceiverId,
                    m.ProgressId,
                    m.Content,
                    m.SentAt,
                    m.IsRead,
                    u.Username as SenderName,
                    r.Username as ReceiverName
                FROM Messages m
                LEFT JOIN Users u ON m.SenderId = u.Id
                LEFT JOIN Users r ON m.ReceiverId = r.Id
                WHERE m.Id = ${messageId}
            `;

            res.status(201).json({ message: newMessage.recordset[0] });
        } catch (error) {
            console.error('Send message error:', error);
            res.status(500).json({ message: 'Failed to send message', error: error.message });
        }
    },

    getMessages: async (req, res) => {
        try {
            const userId = req.user.id;
            const { coachId } = req.params;

            // Kiểm tra quyền truy cập
            const userCheck = await sql.query`
                SELECT IsMember, CoachId, Role FROM Users WHERE Id = ${userId}
            `;
            const user = userCheck.recordset[0];

            // For regular users, ensure they are members and assigned to the correct coach
            if (!user || (user.Role !== 'user' && user.Role !== 'member') || !user.IsMember) {
                return res.status(403).json({ message: 'Bạn cần là thành viên Premium để sử dụng tính năng này' });
            }

            if (user.CoachId !== parseInt(coachId)) {
                console.log('User CoachId:', user.CoachId);
                console.log('Requested CoachId:', parseInt(coachId));
                return res.status(403).json({ message: 'Bạn không có quyền chat với huấn luyện viên này' });
            }

            // Lấy tin nhắn
            const messages = await sql.query`
                SELECT 
                    m.Id,
                    m.SenderId,
                    m.ReceiverId,
                    m.ProgressId,
                    m.Content,
                    m.SentAt,
                    m.IsRead,
                    u.Username as SenderName,
                    r.Username as ReceiverName
                FROM Messages m
                LEFT JOIN Users u ON m.SenderId = u.Id
                LEFT JOIN Users r ON m.ReceiverId = r.Id
                WHERE (m.SenderId = ${userId} AND m.ReceiverId = ${coachId})
                   OR (m.SenderId = ${coachId} AND m.ReceiverId = ${userId})
                ORDER BY m.SentAt ASC
            `;

            // Đánh dấu tin nhắn chưa đọc là đã đọc
            await sql.query`
                UPDATE Messages
                SET IsRead = 1
                WHERE ReceiverId = ${userId} AND SenderId = ${coachId} AND IsRead = 0
            `;

            res.json({ messages: messages.recordset });
        } catch (error) {
            console.error('Get messages error:', error);
            res.status(500).json({ message: 'Failed to get messages', error: error.message });
        }
    },

    getCoachMessagesWithMember: async (req, res) => {
        try {
            const coachId = req.user.id; // The logged-in user is the coach
            const { memberId } = req.params;

            // Verify if the logged-in user is actually a coach
            const coachCheck = await sql.query`
                SELECT Role FROM Users WHERE Id = ${coachId}
            `;
            const coachUser = coachCheck.recordset[0];
            if (!coachUser || coachUser.Role !== 'coach') {
                return res.status(403).json({ message: 'Bạn không có quyền truy cập này.' });
            }

            // Verify if the member is assigned to this coach
            const memberCheck = await sql.query`
                SELECT CoachId FROM Users WHERE Id = ${memberId}
            `;
            const member = memberCheck.recordset[0];
            if (!member || member.CoachId !== coachId) {
                return res.status(403).json({ message: 'Thành viên này không được chỉ định cho bạn.' });
            }

            // Get messages between coach and member
            const messages = await sql.query`
                SELECT 
                    m.Id,
                    m.SenderId,
                    m.ReceiverId,
                    m.ProgressId,
                    m.Content,
                    m.SentAt,
                    m.IsRead,
                    u.Username as SenderName,
                    r.Username as ReceiverName
                FROM Messages m
                LEFT JOIN Users u ON m.SenderId = u.Id
                LEFT JOIN Users r ON m.ReceiverId = r.Id
                WHERE (m.SenderId = ${coachId} AND m.ReceiverId = ${memberId})
                   OR (m.SenderId = ${memberId} AND m.ReceiverId = ${coachId})
                ORDER BY m.SentAt ASC
            `;

            // Mark messages sent by the member to this coach as read
            await sql.query`
                UPDATE Messages
                SET IsRead = 1
                WHERE ReceiverId = ${coachId} AND SenderId = ${memberId} AND IsRead = 0
            `;

            res.json({ messages: messages.recordset });
        } catch (error) {
            console.error('Get coach messages with member error:', error);
            res.status(500).json({ message: 'Failed to get coach messages with member', error: error.message });
        }
    }
};

module.exports = messageController;
