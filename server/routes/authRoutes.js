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
router.post('/quit-plan', auth.verifyToken, authController.createQuitPlan);
router.put('/quit-plan/progress', auth.verifyToken, authController.updateQuitPlanProgress);
router.put('/upgrade-premium', auth.verifyToken, authController.upgradePremium);
router.put('/upgrade-admin', auth.verifyToken, authController.upgradeToAdmin);

module.exports = router;