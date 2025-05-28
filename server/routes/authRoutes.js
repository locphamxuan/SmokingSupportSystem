const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middlewares/auth');

// Auth routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Profile routes
router.get('/profile', auth.verifyToken, authController.getProfile);
router.put('/profile', auth.verifyToken, authController.updateProfile);
router.put('/smoking-status', auth.verifyToken, authController.updateSmokingStatus);
router.put('/upgrade-member', auth.verifyToken, authController.upgradeMember);
router.post('/smoking-daily-log', auth.verifyToken, authController.addSmokingDailyLog);
router.post('/quit-plan', auth.verifyToken, authController.createOrUpdateQuitPlan);
router.get('/quit-plan', auth.verifyToken, authController.getQuitPlan);
router.post('/progress', auth.verifyToken, authController.addProgress);
router.get('/progress/latest', auth.verifyToken, authController.getLatestProgress);

module.exports = router;