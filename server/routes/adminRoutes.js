// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { isAdmin } = require('../middlewares/auth'); // middleware kiểm tra quyền admin

router.get('/pending-coaches', isAdmin, adminController.getPendingCoaches);
router.post('/approve-coach/:id', isAdmin, adminController.approveCoach);
router.post('/reject-coach/:id', isAdmin, adminController.rejectCoach);

router.get('/user/:id', isAdmin, adminController.getUser);
router.put('/user/:id', isAdmin, adminController.updateUser);
router.delete('/user/:id', isAdmin, adminController.deleteUser);

module.exports = router;