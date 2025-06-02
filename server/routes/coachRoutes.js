const express = require('express');
const router = express.Router();
const coachController = require('../controllers/coachController');
const { verifyToken } = require('../middlewares/auth');

// Lấy danh sách coach
router.get('/', verifyToken, coachController.getCoaches);

// Coach lấy kế hoạch cai thuốc của member
router.get('/member/:memberId/quit-plan', verifyToken, coachController.getMemberQuitPlan);
// Coach lấy tiến trình của member
router.get('/member/:memberId/progress', verifyToken, coachController.getMemberProgress);
// Coach gửi đề xuất điều chỉnh kế hoạch
router.post('/member/:memberId/suggestion', verifyToken, coachController.suggestQuitPlan);
// Coach lấy lịch sử đề xuất
router.get('/member/:memberId/suggestions', verifyToken, coachController.getMemberSuggestions);
// Coach ghi chú cho tiến trình
router.post('/member/:memberId/progress/:progressId/note', verifyToken, coachController.addProgressNote);

module.exports = router;
