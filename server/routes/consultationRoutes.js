const express = require('express');
const router = express.Router();
const consultationController = require('../controllers/consultationController');
const { verifyToken } = require('../middlewares/auth');

// Đặt lịch tư vấn (member)
router.post('/', verifyToken, consultationController.createConsultation);
// Xem lịch tư vấn (coach, member, admin)
router.get('/', verifyToken, consultationController.getConsultations);
// Cập nhật trạng thái lịch tư vấn (coach)
router.put('/:id', verifyToken, consultationController.updateConsultationStatus);

module.exports = router;
