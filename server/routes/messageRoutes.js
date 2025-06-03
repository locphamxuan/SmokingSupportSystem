const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { verifyToken } = require('../middlewares/auth');

router.post('/', verifyToken, messageController.sendMessage);
router.get('/', verifyToken, messageController.getMessages);
router.get('/members', verifyToken, messageController.getChatMembersForCoach);

module.exports = router;
