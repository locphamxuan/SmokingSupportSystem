const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { authenticateToken } = require('../middlewares/auth');

// Test endpoint để debug
router.get('/test', (req, res) => {
    res.json({ message: 'Booking routes working!', timestamp: new Date().toISOString() });
});

// Test endpoint để debug authentication
router.get('/test-auth', authenticateToken, (req, res) => {
    res.json({ 
        message: 'Authentication working!',
        user: req.user,
        timestamp: new Date().toISOString() 
    });
});

// Các tuyến đường được bảo vệ (yêu cầu xác thực)
router.post('/book-coach', authenticateToken, bookingController.bookCoach);
router.post('/book-appointment', authenticateToken, bookingController.bookAppointment);
router.post('/:bookingId/confirm', authenticateToken, bookingController.confirmBooking);
router.post('/:bookingId/cancel', authenticateToken, bookingController.cancelBooking);
router.post('/:bookingId/cancel-by-member', authenticateToken, bookingController.cancelBookingByMember);
router.get('/history', authenticateToken, bookingController.getUserBookingHistory);

module.exports = router; 