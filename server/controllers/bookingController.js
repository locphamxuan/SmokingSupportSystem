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

            if (!user || !(user.IsMemberVip === 1 || user.IsMemberVip === true || user.IsMemberVip === '1' || user.IsMemberVip === 'true' || user.Role === 'memberVip')) {
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

            // Cập nhật CoachId cho kế hoạch cai thuốc của người dùng
            await sql.query`
                UPDATE QuitPlans SET CoachId = ${coachId} WHERE UserId = ${userId} AND CoachId IS NULL
            `;

            res.status(200).json({ message: 'Đặt lịch với huấn luyện viên thành công!' });
        } catch (error) {
            console.error('Book coach error:', error);
            res.status(500).json({ message: 'Failed to book coach', error: error.message });
        }
    },

    bookAppointment: async (req, res) => {
        try {
            const { slotDate, slot, note } = req.body;
            const memberId = req.user.id;

            // Lấy thông tin user để kiểm tra quyền
            const userResult = await sql.query`
                SELECT Role, IsMemberVip FROM Users WHERE Id = ${memberId}
            `;
            const user = userResult.recordset[0];
            if (
                !user ||
                (
                    user.Role?.toLowerCase() !== 'membervip' &&
                    user.IsMemberVip !== 1 &&
                    user.IsMemberVip !== true &&
                    user.IsMemberVip !== '1' &&
                    user.IsMemberVip !== 'true'
                )
            ) {
                return res.status(403).json({ message: 'Chỉ thành viên VIP đã mua gói mới có thể đặt lịch tư vấn.' });
            }

            // Chỉ kiểm tra ngày và khung giờ
            if (!slotDate || !slot) {
                return res.status(400).json({ message: 'Ngày và khung giờ là bắt buộc.' });
            }
            await sql.query`
                INSERT INTO Booking (MemberId, SlotDate, Slot, Status, Note, CreatedAt)
                VALUES (${memberId}, ${slotDate}, ${slot}, N'chưa thanh toán', ${note || ''}, GETDATE())
            `;
            // Lấy bookingId vừa tạo (nếu cần trả về)
            const result = await sql.query`SELECT TOP 1 Id FROM Booking WHERE MemberId = ${memberId} ORDER BY Id DESC`;
            const bookingId = result.recordset[0]?.Id;
            res.json({ message: 'Đặt lịch thành công, vui lòng thanh toán để hoàn tất!', bookingId });
        } catch (error) {
            console.error('Book appointment error:', error);
            res.status(500).json({ message: 'Không thể đặt lịch hẹn', error: error.message });
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

            // Cập nhật trạng thái lịch hẹn thành 'coach đã hủy'
            await sql.query`
                UPDATE Booking 
                SET Status = N'coach đã hủy'
                WHERE Id = ${bookingId}
            `;

            res.status(200).json({ 
                message: 'Hủy lịch hẹn thành công',
                booking: {
                    ...booking,
                    Status: 'coach đã hủy'
                }
            });
        } catch (error) {
            console.error('Cancel booking error:', error);
            res.status(500).json({ message: 'Không thể hủy lịch hẹn', error: error.message });
        }
    },

    getUserBookingHistory: async (req, res) => {
        try {
            const memberId = req.user.id;
            console.log(`[getUserBookingHistory] Fetching booking history for memberId: ${memberId}`);

            // Lấy lịch sử đặt lịch của member
            const bookingHistory = await sql.query`
                SELECT 
                    b.Id,
                    b.Slot,
                    b.SlotDate,
                    b.Status,
                    b.Note,
                    b.CreatedAt,
                    u.Username AS CoachName
                FROM Booking b
                LEFT JOIN Users u ON b.CoachId = u.Id
                WHERE b.MemberId = ${memberId}
                ORDER BY b.SlotDate DESC, b.CreatedAt DESC
            `;

            console.log(`[getUserBookingHistory] Found ${bookingHistory.recordset.length} bookings for memberId: ${memberId}`);
            console.log(`[getUserBookingHistory] Booking data:`, JSON.stringify(bookingHistory.recordset, null, 2));

            res.status(200).json({ 
                message: 'Lấy lịch sử đặt lịch thành công',
                bookings: bookingHistory.recordset
            });
        } catch (error) {
            console.error('Get booking history error:', error);
            res.status(500).json({ message: 'Không thể lấy lịch sử đặt lịch', error: error.message });
        }
    },

    cancelBookingByMember: async (req, res) => {
        try {
            const { bookingId } = req.params;
            const memberId = req.user.id;

            // Kiểm tra xem lịch hẹn có tồn tại và thuộc về member này không
            const bookingCheck = await sql.query`
                SELECT b.*, u.Username AS CoachName 
                FROM Booking b
                LEFT JOIN Users u ON b.CoachId = u.Id
                WHERE b.Id = ${bookingId} AND b.MemberId = ${memberId}
            `;

            if (bookingCheck.recordset.length === 0) {
                return res.status(404).json({ message: 'Không tìm thấy lịch hẹn hoặc bạn không có quyền hủy lịch hẹn này' });
            }

            const booking = bookingCheck.recordset[0];

            // Kiểm tra xem lịch hẹn đã ở trạng thái hợp lệ để hủy chưa
            if (booking.Status !== 'đang chờ xác nhận' && booking.Status !== 'đã xác nhận') {
                return res.status(400).json({ message: 'Không thể hủy lịch hẹn ở trạng thái này' });
            }

            // Cập nhật trạng thái lịch hẹn thành 'khách hàng đã hủy'
            await sql.query`
                UPDATE Booking 
                SET Status = N'khách hàng đã hủy'
                WHERE Id = ${bookingId}
            `;

            res.status(200).json({ 
                message: 'Hủy lịch hẹn thành công',
                booking: {
                    ...booking,
                    Status: 'khách hàng đã hủy'
                }
            });
        } catch (error) {
            console.error('Member cancel booking error:', error);
            res.status(500).json({ message: 'Không thể hủy lịch hẹn', error: error.message });
        }
    },

    payBooking: async (req, res) => {
        try {
            const bookingId = req.params.bookingId;
            const memberId = req.user.id;
            const { paymentMethod, amount, transactionId, note } = req.body; // nhận thêm từ frontend

            const result = await sql.query`
                SELECT * FROM Booking WHERE Id = ${bookingId} AND MemberId = ${memberId} AND Status = N'chưa thanh toán'
            `;
            if (result.recordset.length === 0) return res.status(400).json({ message: 'Không tìm thấy booking hợp lệ' });

            await sql.query`
                UPDATE Booking SET Status = N'đã thanh toán' WHERE Id = ${bookingId}
            `;

            // Lưu thông tin thanh toán
            await sql.query`
                INSERT INTO BookingPayment (BookingId, PaymentMethod, Amount, TransactionId, Status, Note)
                VALUES (
                    ${bookingId},
                    ${paymentMethod || 'unknown'},
                    ${amount || 199000},
                    ${transactionId || ''},
                    N'thành công',
                    ${note || ''}
                )
            `;

            res.json({ message: 'Thanh toán thành công!' });
        } catch (error) {
            console.error('Pay booking error:', error);
            res.status(500).json({ message: 'Không thể thanh toán lịch hẹn', error: error.message });
        }
    },

    getAvailableBookings: async (req, res) => {
        try {
            const result = await sql.query`
                SELECT * FROM Booking WHERE Status = N'đã thanh toán'
            `;
            res.json({ bookings: result.recordset });
        } catch (error) {
            console.error('Get available bookings error:', error);
            res.status(500).json({ message: 'Không thể lấy lịch hẹn đã thanh toán', error: error.message });
        }
    },

    acceptBooking: async (req, res) => {
        try {
            const coachId = req.user.id;
            const bookingId = req.params.bookingId;
            const check = await sql.query`
                SELECT * FROM Booking_Coach WHERE BookingId = ${bookingId} AND CoachId = ${coachId}
            `;
            if (check.recordset.length > 0) return res.status(400).json({ message: 'Bạn đã nhận lịch này rồi' });

            // Lấy MemberId từ bảng Booking
            const bookingResult = await sql.query`
                SELECT MemberId FROM Booking WHERE Id = ${bookingId}
            `;
            const memberId = bookingResult.recordset[0]?.MemberId;
            if (!memberId) {
                console.error('Không tìm thấy thành viên cho lịch này, bookingId:', bookingId);
                return res.status(400).json({ message: 'Không tìm thấy thành viên cho lịch này' });
            }

            // Cập nhật CoachId cho user (memberVip)
            console.log('Updating CoachId for member:', memberId, 'to coach:', coachId);
            const updateResult = await sql.query`
                UPDATE Users SET CoachId = ${coachId} WHERE Id = ${memberId}
            `;
            console.log('Update CoachId result:', updateResult);

            // Thêm vào bảng Booking_Coach
            await sql.query`
                INSERT INTO Booking_Coach (BookingId, CoachId, Status, AcceptedAt)
                VALUES (${bookingId}, ${coachId}, N'đã nhận', GETDATE())
            `;
            res.json({ message: 'Nhận lịch thành công!' });
        } catch (error) {
            console.error('Accept booking error:', error);
            res.status(500).json({ message: 'Không thể nhận lịch hẹn', error: error.message });
        }
    },

    getAcceptedBookings: async (req, res) => {
        try {
            const coachId = req.user.id;
            const result = await sql.query`
                SELECT b.*, u.Username AS MemberName, u.Email AS MemberEmail, u.PhoneNumber AS MemberPhoneNumber
                FROM Booking_Coach bc
                JOIN Booking b ON bc.BookingId = b.Id
                JOIN Users u ON b.MemberId = u.Id
                WHERE bc.CoachId = ${coachId}
            `;
            res.json({ bookings: result.recordset });
        } catch (error) {
            console.error('Get accepted bookings error:', error);
            res.status(500).json({ message: 'Không thể lấy lịch hẹn đã nhận', error: error.message });
        }
    }
};

module.exports = bookingController; 