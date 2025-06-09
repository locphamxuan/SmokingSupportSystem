const express = require('express');
const router = express.Router();
const coachController = require('../controllers/coachController');
const { authenticateToken, isCoach } = require('../middlewares/auth');

// Tuyến đường công khai để lấy danh sách tất cả các huấn luyện viên
router.get('/', coachController.getCoachesList);

// Các tuyến đường được bảo vệ cho huấn luyện viên
router.get('/members', authenticateToken, isCoach, coachController.getAssignedMembers);
router.get('/member/:memberId/progress', authenticateToken, isCoach, coachController.getMemberProgress);

module.exports = router;
