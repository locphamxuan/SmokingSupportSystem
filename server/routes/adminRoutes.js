const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, isAdmin } = require('../middlewares/auth'); // middleware xác thực và kiểm tra quyền admin

// Route lấy danh sách user
router.get('/users', verifyToken, isAdmin, adminController.getUsers);
// Route cập nhật user
router.put('/user/:id', verifyToken, isAdmin, adminController.updateUser);
// Route xóa user
router.delete('/user/:id', verifyToken, isAdmin, adminController.deleteUser);

module.exports = router;