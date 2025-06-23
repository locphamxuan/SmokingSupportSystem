const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middlewares/auth');
const statisticsController = require('../controllers/statisticsController');
const notificationController = require('../controllers/notificationController');
const reportController = require('../controllers/reportController');
const rankingController = require('../controllers/rankingController');
const dailyLogController = require('../controllers/dailyLogController');
const membershipController = require('../controllers/membershipController');

// Các tuyến đường công khai (không yêu cầu xác thực)
router.post('/login', authController.login);
router.post('/register', authController.register);

// Các tuyến đường được bảo vệ cho hồ sơ người dùng và trạng thái hút thuốc
router.get('/profile', authenticateToken, authController.getProfile);
router.put('/profile', authenticateToken, authController.updateProfile);
router.put('/smoking-status', authenticateToken, authController.updateSmokingStatus);
router.put('/upgrade-member', authenticateToken, authController.upgradeMember);
router.post('/request-coach', authenticateToken, authController.requestCoach);

// Các tuyến đường được bảo vệ cho nhật ký hàng ngày và kế hoạch cai thuốc
router.post('/quit-plan', authenticateToken, authController.createOrUpdateQuitPlan);
router.get('/quit-plan', authenticateToken, authController.getQuitPlan);
router.put('/daily-log', authenticateToken, authController.addProgress);
router.post('/progress', authenticateToken, authController.addProgress);
router.get('/coaches', authenticateToken, authController.getAllCoaches);
router.get('/badges', authenticateToken, authController.getUserBadges);
router.get('/all-badges', authenticateToken, authController.getAllBadges);
router.get('/progress/history', authenticateToken, authController.getSmokingProgressHistory);

// Blog Posts routes
router.get('/posts', authController.getAllPosts); // Publicly accessible to view posts
router.post('/posts', authenticateToken, authController.createPost); // Requires authentication to create a post

// Comment routes
router.get('/posts/:postId/comments', authController.getCommentsForPost); // Publicly accessible to view comments
router.post('/posts/:postId/comments', authenticateToken, authController.addComment); // Requires authentication to add a comment

// Statistics
router.get('/statistics', authenticateToken, statisticsController.getUserStatistics);
// Notifications
router.get('/notifications', authenticateToken, notificationController.getUserNotifications);
router.put('/notifications/:notificationId/read', authenticateToken, notificationController.markNotificationAsRead);
// Reports
router.post('/reports', authenticateToken, reportController.submitReport);
// Rankings
router.get('/rankings', rankingController.getRankings);
// Daily Log
router.get('/daily-log', authenticateToken, dailyLogController.getDailyLog);
router.post('/daily-log', authenticateToken, dailyLogController.addDailyLog);
// Membership Packages
router.get('/membership-packages', membershipController.getMembershipPackages);

// Suggested Quit Plans (chỉ cho memberVip)
router.get('/quit-plan/suggested', authenticateToken, authController.getSuggestedQuitPlans);

// New route for user suggested quit plan
router.post('/user-suggested-quit-plan', authenticateToken, authController.createUserSuggestedQuitPlan);

// Badge routes
router.get('/user-badges/:userId', authenticateToken, authController.getUserBadgesByUserId);

module.exports = router;