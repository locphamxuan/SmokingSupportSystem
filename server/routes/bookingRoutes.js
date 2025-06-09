const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { authenticateToken } = require('../middlewares/auth');

// Các tuyến đường được bảo vệ (yêu cầu xác thực)
router.post('/book-coach', authenticateToken, bookingController.bookCoach);
router.post('/book-appointment', authenticateToken, bookingController.bookAppointment);
router.post('/:bookingId/confirm', authenticateToken, bookingController.confirmBooking);
router.post('/:bookingId/cancel', authenticateToken, bookingController.cancelBooking);

module.exports = router; 