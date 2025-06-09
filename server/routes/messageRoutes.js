const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { authenticateToken, isCoach } = require('../middlewares/auth');

// Các tuyến đường được bảo vệ để người dùng trò chuyện với huấn luyện viên được chỉ định của họ
router.get('/:coachId', authenticateToken, messageController.getMessages);
router.post('/', authenticateToken, messageController.sendMessage);

// Protected route for coaches to get messages with a specific member
router.get('/member/:memberId', authenticateToken, isCoach, messageController.getCoachMessagesWithMember);

module.exports = router;
