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
            const userResult = await sql.query`
                SELECT IsMemberVip, CoachId, Role FROM Users WHERE Id = ${userId}
            `;
            const user = userResult.recordset[0];

            if (!user) {
                return res.status(404).json({ message: 'Không tìm thấy người dùng' });
            }

            // Fix: Accept 1, true, '1', 'true' as Membervip
            const isPremium = user.IsMemberVip === 1 || user.IsMemberVip === true || user.IsMemberVip === '1' || user.IsMemberVip === 'true';
            if (!isPremium) {
                return res.status(403).json({ message: 'Bạn cần là thành viên Premium để gửi tin nhắn' });
            }

            // Kiểm tra quyền gửi tin nhắn
            if (user.Role === 'user' || user.Role === 'member') {
                if (user.CoachId !== parseInt(receiverId)) {
                    return res.status(403).json({ message: 'Bạn chỉ có thể gửi tin nhắn cho huấn luyện viên của mình' });
                }
            } else if (user.Role === 'coach') {
                const memberCheck = await sql.query`
                    SELECT CoachId FROM Users WHERE Id = ${receiverId}
                `;
                const member = memberCheck.recordset[0];
                if (!member || member.CoachId !== userId) {
                    return res.status(403).json({ message: 'Bạn không có quyền gửi tin nhắn cho thành viên này.' });
                }
            } else {
                return res.status(403).json({ message: 'Tài khoản của bạn không được phép gửi tin nhắn.' });
            }

            // Kiểm tra progressId nếu có
            if (progressId) {
                const progressCheck = await sql.query`
                    SELECT Id FROM SmokingDailyLog WHERE Id = ${progressId} AND UserId = ${userId}
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
            const userResult = await sql.query`
                SELECT IsMemberVip, CoachId, Role FROM Users WHERE Id = ${userId}
            `;
            const user = userResult.recordset[0];

            if (!user) {
                console.error(`Error: User with ID ${userId} not found in DB when checking coachId.`);
                return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
            }

            console.log(`Debug: getMessages - User ID from token: ${userId}`);
            console.log(`Debug: getMessages - Coach ID from URL params: ${coachId} (type: ${typeof coachId})`);
            console.log(`Debug: getMessages - User.CoachId from DB: ${user.CoachId} (type: ${typeof user.CoachId})`);
            console.log(`Debug: getMessages - Parsed coach ID from URL params: ${parseInt(coachId)}`);
            console.log(`Debug: getMessages - Parsed User.CoachId from DB: ${parseInt(user.CoachId)}`);
            console.log(`Debug: getMessages - Result of comparison: ${parseInt(user.CoachId) !== parseInt(coachId)}`);

            if (parseInt(user.CoachId) !== parseInt(coachId)) {
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
            const coachId = req.user.id;
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
    },

    // Hàm cho socket: lấy lịch sử tin nhắn
    getMessagesSocket: async (userId, otherId) => {
        try {
            // Lấy thông tin user
            const userResult = await sql.query`
                SELECT Id, IsMemberVip, CoachId, Role FROM Users WHERE Id = ${userId}
            `;
            const user = userResult.recordset[0];
            if (!user) return [];

            // Fix: Accept 1, true, '1', 'true' as Premium
            const isPremium = user.IsMemberVip === 1 || user.IsMemberVip === true || user.IsMemberVip === '1' || user.IsMemberVip === 'true';
            if ((user.Role === 'member' || user.Role === 'memberVip') && (!isPremium || parseInt(user.CoachId) !== parseInt(otherId))) {
                return [];
            }
            if (user.Role === 'coach') {
                // Coach chỉ chat với member đã gán cho mình
                const memberResult = await sql.query`
                    SELECT CoachId FROM Users WHERE Id = ${otherId}
                `;
                const member = memberResult.recordset[0];
                if (!member || parseInt(member.CoachId) !== parseInt(userId)) {
                    return [];
                }
            } else if (user.Role !== 'member' && user.Role !== 'memberVip') {
                // Không cho phép role khác
                return [];
            }

            // Lấy tin nhắn
            const messages = await sql.query`
                SELECT 
                    m.Id,
                    m.SenderId,
                    m.ReceiverId,
                    m.Content,
                    m.SentAt,
                    m.IsRead,
                    u.Username as SenderName,
                    r.Username as ReceiverName
                FROM Messages m
                LEFT JOIN Users u ON m.SenderId = u.Id
                LEFT JOIN Users r ON m.ReceiverId = r.Id
                WHERE (m.SenderId = ${userId} AND m.ReceiverId = ${otherId})
                   OR (m.SenderId = ${otherId} AND m.ReceiverId = ${userId})
                ORDER BY m.SentAt ASC
            `;
            return messages.recordset;
        } catch (error) {
            return [];
        }
    },

    // Hàm cho socket: gửi tin nhắn
    sendMessageSocket: async (senderId, receiverId, content) => {
        try {
            if (!content || !content.trim()) {
                return { error: 'Nội dung tin nhắn không được để trống' };
            }
            // Kiểm tra quyền gửi tin nhắn
            const userResult = await sql.query`
                SELECT IsMemberVip, CoachId, Role FROM Users WHERE Id = ${senderId}
            `;
            const user = userResult.recordset[0];
            if (!user) {
                return { error: 'Không tìm thấy người dùng' };
            }
            // Fix: Accept 1, true, '1', 'true' as Premium
            const isPremium = user.IsMemberVip === 1 || user.IsMemberVip === true || user.IsMemberVip === '1' || user.IsMemberVip === 'true';
            if ((user.Role === 'member' || user.Role === 'memberVip') && !isPremium) {
                return { error: 'Bạn cần là thành viên Premium để gửi tin nhắn' };
            }
            if (user.Role === 'coach') {
                const memberCheck = await sql.query`
                    SELECT CoachId FROM Users WHERE Id = ${receiverId}
                `;
                const member = memberCheck.recordset[0];
                if (!member || member.CoachId !== senderId) {
                    return { error: 'Bạn không có quyền gửi tin nhắn cho thành viên này.' };
                }
            }
            // Thêm tin nhắn mới
            const result = await sql.query`
                INSERT INTO Messages (SenderId, ReceiverId, Content, SentAt, IsRead)
                VALUES (${senderId}, ${receiverId}, ${content.trim()}, GETDATE(), 0);
                SELECT SCOPE_IDENTITY() AS Id;
            `;
            const messageId = result.recordset[0].Id;
            const newMessage = await sql.query`
                SELECT 
                    m.Id,
                    m.SenderId,
                    m.ReceiverId,
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
            return { message: newMessage.recordset[0] };
        } catch (error) {
            return { error: 'Lỗi gửi tin nhắn' };
        }
    },

    // Lấy danh sách hội thoại của coach (các thành viên đã nhắn tin với coach)
    getCoachConversations: async (req, res) => {
        try {
            const coachId = req.user.id;
            // Lấy member đã nhận lịch với coach này
            const result = await sql.query`
                SELECT DISTINCT u.Id as memberId, u.Username as memberName
                FROM Booking_Coach bc
                JOIN Booking b ON bc.BookingId = b.Id
                JOIN Users u ON b.MemberId = u.Id
                WHERE bc.CoachId = ${coachId} AND bc.Status = N'đã nhận'
            `;
            res.json({ conversations: result.recordset });
        } catch (err) {
            console.error('Get coach conversations error:', err);
            res.status(500).json({ error: 'Internal server error', detail: err.message });
        }
    }
};

module.exports = messageController;
