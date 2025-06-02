const express = require('express');
const router = express.Router();
const coachController = require('../controllers/coachController');
const { verifyToken } = require('../middlewares/auth');

router.get('/', verifyToken, coachController.getCoaches);

module.exports = router;
