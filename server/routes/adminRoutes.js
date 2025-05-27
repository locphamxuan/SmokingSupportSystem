const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, isAdmin } = require('../middlewares/auth');

// Lấy thông tin chi tiết một user (đặt trước các route khác để tránh conflict)
router.get('/user/:id', verifyToken, isAdmin, adminController.getUserDetail);

// Test endpoint
router.get('/test/:id', verifyToken, isAdmin, (req, res) => {
  res.json({ success: true, message: 'Test endpoint working', id: req.params.id });
});

// Fix user roles endpoint (temporary)
router.post('/fix-roles', verifyToken, isAdmin, async (req, res) => {
  try {
    const { sql } = require('../db');
    
    // Cập nhật role cho các user có IsMember = 1 nhưng role vẫn là guest
    const result = await sql.query`
      UPDATE Users 
      SET Role = 'member' 
      WHERE IsMember = 1 AND Role = 'guest'
    `;
    
    // Lấy danh sách user đã được cập nhật
    const updatedUsers = await sql.query`
      SELECT Id, Username, Email, Role, IsMember FROM Users WHERE IsMember = 1
    `;
    
    res.json({
      success: true,
      message: 'Đã cập nhật role cho các user có IsMember = 1',
      rowsAffected: result.rowsAffected[0],
      updatedUsers: updatedUsers.recordset
    });
  } catch (error) {
    console.error('Fix roles error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi khi cập nhật roles', 
      error: error.message 
    });
  }
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