const express = require('express');
const router = express.Router();
const coachController = require('../controllers/coachController');
const { authenticateToken, isCoach } = require('../middlewares/auth');

// Test route for database connection
router.get('/test-db', coachController.testDatabaseConnection);

// Test route for member progress without authentication (for debugging)
router.get('/test-member/:memberId/progress', coachController.getMemberProgress);

// Tuyến đường công khai để lấy danh sách tất cả các huấn luyện viên
router.get('/', coachController.getCoachesList);

// Các tuyến đường được bảo vệ cho huấn luyện viên
router.get('/members', authenticateToken, isCoach, coachController.getAssignedMembers);
// Award badge to VIP member
router.post('/award-badge', authenticateToken, isCoach, coachController.awardBadgeToMember);
// Member progress with authentication
router.get('/member/:memberId/progress', authenticateToken, isCoach, coachController.getMemberProgress);
// Member smoking history
router.get('/member/:memberId/smoking-history', authenticateToken, isCoach, coachController.getMemberSmokingHistory);

module.exports = router;
