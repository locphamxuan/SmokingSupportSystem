const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middlewares/auth');

// Các tuyến đường công khai (không yêu cầu xác thực)
router.post('/login', authController.login);
router.post('/register', authController.register);

// Các tuyến đường được bảo vệ cho hồ sơ người dùng và trạng thái hút thuốc
router.get('/profile', authenticateToken, authController.getProfile);
router.put('/profile', authenticateToken, authController.updateProfile);
router.put('/smoking-status', authenticateToken, authController.updateSmokingStatus);
router.put('/upgrade-member', authenticateToken, authController.upgradeMember);

// Các tuyến đường được bảo vệ cho nhật ký hàng ngày và kế hoạch cai thuốc (giả sử đây là các tính năng cốt lõi của người dùng)
router.post('/quit-plan', authenticateToken, authController.createOrUpdateQuitPlan);
router.get('/quit-plan', authenticateToken, authController.getQuitPlan);
router.post('/progress', authenticateToken, authController.addProgress);
router.get('/progress/latest', authenticateToken, authController.getLatestProgress);

router.post('/request-coach', authenticateToken, authController.requestCoach);

module.exports = router;