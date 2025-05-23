const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware xác thực JWT
exports.verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ 
        message: 'Vui lòng đăng nhập để tiếp tục' 
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ 
        message: 'Token không hợp lệ' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ 
        message: 'Người dùng không tồn tại' 
      });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại' 
      });
    }
    return res.status(401).json({ 
      message: 'Xác thực thất bại' 
    });
  }
};

// Kiểm tra quyền admin
exports.isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ 
      message: 'Bạn không có quyền truy cập tính năng này' 
    });
  }
};

// Kiểm tra quyền premium
exports.isPremium = (req, res, next) => {
  if (req.user && (req.user.role === 'premium' || req.user.role === 'admin')) {
    next();
  } else {
    res.status(403).json({ 
      message: 'Tính năng này chỉ dành cho tài khoản Premium' 
    });
  }
};

// Kiểm tra quyền người dùng thường
exports.isUser = (req, res, next) => {
  if (req.user && req.user.role === 'user') {
    next();
  } else {
    res.status(403).json({ 
      message: 'Bạn không có quyền truy cập tính năng này' 
    });
  }
};

// Kiểm tra quyền truy cập (admin hoặc chính người dùng đó)
exports.isAdminOrSelf = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user._id.toString() === req.params.userId)) {
    next();
  } else {
    res.status(403).json({ 
      message: 'Bạn không có quyền truy cập tính năng này' 
    });
  }
};

