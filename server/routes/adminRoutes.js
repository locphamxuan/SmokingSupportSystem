const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, isAdmin } = require('../middlewares/auth');

// Lấy danh sách user (chỉ admin)
router.get('/users', verifyToken, isAdmin, adminController.getUsers);
// Cập nhật user
router.put('/user/:id', verifyToken, isAdmin, adminController.updateUser);
// Xóa user
router.delete('/user/:id', verifyToken, isAdmin, adminController.deleteUser);

module.exports = router;