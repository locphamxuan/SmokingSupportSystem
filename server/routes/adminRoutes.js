const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, isAdmin } = require('../middlewares/auth');
const membershipController = require('../controllers/membershipController');

// Các tuyến đường quản trị được bảo vệ (yêu cầu xác thực và quyền admin)
router.get('/users', authenticateToken, isAdmin, adminController.getAllUsers);
router.get('/coaches', authenticateToken, isAdmin, adminController.getAllCoaches);
router.get('/user/:id', authenticateToken, isAdmin, adminController.getUserDetail);
router.put('/user/:id', authenticateToken, isAdmin, adminController.updateUser);
router.delete('/user/:id', authenticateToken, isAdmin, adminController.deleteUser);
router.get('/statistics', authenticateToken, isAdmin, adminController.getStatistics);

// Membership package management (admin only)
router.get('/packages', authenticateToken, isAdmin, membershipController.getMembershipPackages);
router.post('/packages', authenticateToken, isAdmin, membershipController.createMembershipPackage);
router.put('/packages/:id', authenticateToken, isAdmin, membershipController.updateMembershipPackage);
router.delete('/packages/:id', authenticateToken, isAdmin, membershipController.deleteMembershipPackage);

module.exports = router;