const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, isAdmin } = require('../middlewares/auth');

// Test endpoint
router.get('/test/:id', verifyToken, isAdmin, (req, res) => {
  res.json({ success: true, message: 'Test endpoint working', id: req.params.id });
});

// Lấy thống kê tổng quan
router.get('/statistics', verifyToken, isAdmin, adminController.getStatistics);
// Lấy danh sách user (chỉ admin)
router.get('/users', verifyToken, isAdmin, adminController.getUsers);
// Cập nhật user
router.put('/user/:id', verifyToken, isAdmin, adminController.updateUser);
// Xóa user
router.delete('/user/:id', verifyToken, isAdmin, adminController.deleteUser);

module.exports = router;