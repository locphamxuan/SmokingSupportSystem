const jwt = require('jsonwebtoken');
const { sql } = require('../db');

// Middleware xác thực JWT
exports.verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'Không có token' });
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded; // phải là user, không phải guest
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token không hợp lệ' });
  }
};

// Kiểm tra quyền premium
exports.isPremium = (req, res, next) => {
  if (req.user && req.user.IsPremium) {
    next();
  } else {
    res.status(403).json({ message: 'Tính năng này chỉ dành cho tài khoản Premium' });
  }
};

const isAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.IsAdmin)) {
    next();
  } else {
    res.status(403).json({ message: 'Bạn không có quyền truy cập tính năng này' });
  }
};
exports.isAdmin = isAdmin;