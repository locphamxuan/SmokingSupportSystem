const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken } = require('../middlewares/auth');

// Yêu cầu hỗ trợ từ coach
router.post('/request-coach', authenticateToken, userController.requestCoach);

// Hủy yêu cầu coach
router.post('/cancel-coach-request', authenticateToken, userController.cancelCoachRequest);

module.exports = router; 