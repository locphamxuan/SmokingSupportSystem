const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, isAdmin } = require('../middlewares/auth');

// Các tuyến đường quản trị được bảo vệ (yêu cầu xác thực và quyền admin)
router.get('/users', authenticateToken, isAdmin, adminController.getAllUsers);
router.get('/coaches', authenticateToken, isAdmin, adminController.getAllCoaches);
router.get('/user/:id', authenticateToken, isAdmin, adminController.getUserDetail);
router.put('/user/:id', authenticateToken, isAdmin, adminController.updateUser);
router.delete('/user/:id', authenticateToken, isAdmin, adminController.deleteUser);
router.get('/statistics', authenticateToken, isAdmin, adminController.getStatistics);

module.exports = router;