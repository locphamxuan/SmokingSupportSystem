const { sql } = require('../db');

const bookingController = {
    bookCoach: async (req, res) => {
        try {
            const userId = req.user.id;
            const { coachId } = req.body;
            console.log(`Server: Received bookCoach request - UserId: ${userId}, CoachId: ${coachId}`);

            // Kiểm tra người dùng có phải là thành viên premium chưa
            const userResult = await sql.query`
                SELECT IsMemberVip, CoachId FROM Users WHERE Id = ${userId}
            `;
            const user = userResult.recordset[0];

            if (!user || !user.IsMemberVip) {
                return res.status(403).json({ message: 'Bạn cần là thành viên Premium để đặt lịch với huấn luyện viên' });
            }

            // Kiểm tra người dùng đã có huấn luyện viên chưa
            if (user.CoachId !== null) {
                return res.status(400).json({ message: 'Bạn đã có một huấn luyện viên rồi' });
            }

            // Kiểm tra huấn luyện viên có tồn tại không
            const coachCheck = await sql.query`
                SELECT Id, Role FROM Users WHERE Id = ${coachId} AND Role = 'coach'
            `;
            if (coachCheck.recordset.length === 0) {
                console.log(`Server: Coach with ID ${coachId} not found or not a coach.`);
                return res.status(404).json({ message: 'Không tìm thấy huấn luyện viên' });
            }

            // Cập nhật CoachId cho người dùng
            await sql.query`
                UPDATE Users SET CoachId = ${coachId} WHERE Id = ${userId}
            `;

            res.status(200).json({ message: 'Đặt lịch với huấn luyện viên thành công!' });
        } catch (error) {
            console.error('Book coach error:', error);
            res.status(500).json({ message: 'Failed to book coach', error: error.message });
        }
    },

    bookAppointment: async (req, res) => {
        try {
            const { coachId, slotDate, slot, note } = req.body;
            const memberId = req.user.id;

            if (!coachId || !slotDate || !slot) {
                return res.status(400).json({ message: 'Huấn luyện viên, ngày và khung giờ là bắt buộc.' });
            }

            await sql.query`
                INSERT INTO Booking (MemberId, CoachId, Slot, SlotDate, Note, Status, CreatedAt)
                VALUES (${memberId}, ${coachId}, ${slot}, ${slotDate}, ${note || null}, N'đang chờ xác nhận', GETDATE())
            `;

            res.status(201).json({ message: 'Yêu cầu đặt lịch đã được tạo thành công.' });
        } catch (error) {
            console.error('Error booking appointment:', error);
            res.status(500).json({ message: 'Lỗi khi tạo yêu cầu đặt lịch.', error: error.message });
        }
    },

    confirmBooking: async (req, res) => {
        try {
            const { bookingId } = req.params;
            const coachId = req.user.id;

            // Kiểm tra xem lịch hẹn có tồn tại và thuộc về huấn luyện viên này không
            const bookingCheck = await sql.query`
                SELECT b.*, u.Role 
                FROM Booking b
                JOIN Users u ON b.CoachId = u.Id
                WHERE b.Id = ${bookingId} AND b.CoachId = ${coachId}
            `;

            if (bookingCheck.recordset.length === 0) {
                return res.status(404).json({ message: 'Không tìm thấy lịch hẹn hoặc bạn không có quyền xác nhận lịch hẹn này' });
            }

            const booking = bookingCheck.recordset[0];
            console.log('Booking status retrieved from DB:', booking.Status);

            // Kiểm tra xem lịch hẹn đã ở trạng thái 'đang chờ xác nhận' chưa
            if (booking.Status !== 'đang chờ xác nhận') {
                return res.status(400).json({ message: 'Chỉ có thể xác nhận lịch hẹn đang ở trạng thái chờ xác nhận' });
            }

            // Cập nhật trạng thái lịch hẹn thành 'đã xác nhận'
            await sql.query`
                UPDATE Booking 
                SET Status = N'đã xác nhận'
                WHERE Id = ${bookingId}
            `;

            res.status(200).json({ 
                message: 'Xác nhận lịch hẹn thành công',
                booking: {
                    ...booking,
                    Status: 'đã xác nhận'
                }
            });
        } catch (error) {
            console.error('Confirm booking error:', error);
            res.status(500).json({ message: 'Không thể xác nhận lịch hẹn', error: error.message });
        }
    },

    cancelBooking: async (req, res) => {
        try {
            const { bookingId } = req.params;
            const coachId = req.user.id;

            // Kiểm tra xem lịch hẹn có tồn tại và thuộc về huấn luyện viên này không
            const bookingCheck = await sql.query`
                SELECT b.*, u.Role 
                FROM Booking b
                JOIN Users u ON b.CoachId = u.Id
                WHERE b.Id = ${bookingId} AND b.CoachId = ${coachId}
            `;

            if (bookingCheck.recordset.length === 0) {
                return res.status(404).json({ message: 'Không tìm thấy lịch hẹn hoặc bạn không có quyền hủy lịch hẹn này' });
            }

            const booking = bookingCheck.recordset[0];

            // Kiểm tra xem lịch hẹn đã ở trạng thái hợp lệ để hủy chưa
            if (booking.Status !== 'đang chờ xác nhận' && booking.Status !== 'đã xác nhận') {
                return res.status(400).json({ message: 'Không thể hủy lịch hẹn ở trạng thái này' });
            }

            // Cập nhật trạng thái lịch hẹn thành 'đã hủy'
            await sql.query`
                UPDATE Booking 
                SET Status = N'đã hủy'
                WHERE Id = ${bookingId}
            `;

            res.status(200).json({ 
                message: 'Hủy lịch hẹn thành công',
                booking: {
                    ...booking,
                    Status: 'đã hủy'
                }
            });
        } catch (error) {
            console.error('Cancel booking error:', error);
            res.status(500).json({ message: 'Không thể hủy lịch hẹn', error: error.message });
        }
    }
};

module.exports = bookingController; 