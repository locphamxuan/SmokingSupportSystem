const jwt = require('jsonwebtoken');
const { sql } = require('../db');
const SECRET_KEY = process.env.JWT_SECRET || 'your-super-secret-key'; // Đặt khóa bí mật JWT của bạn ở đây

// Middleware xác thực JWT cho các yêu cầu
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'Authentication token required' });
        }

        const decoded = jwt.verify(token, SECRET_KEY);
        console.log('[authenticateToken] Decoded token:', decoded);
        
        const userId = decoded.userId || decoded.id;
        console.log('[authenticateToken] Using userId:', userId);

        if (!userId) {
            console.error('[authenticateToken] No userId found in token');
            return res.status(401).json({ message: 'Invalid token: no user ID' });
        }

        // Lấy dữ liệu người dùng từ cơ sở dữ liệu
        const result = await sql.query`
            SELECT Id, Username, Email, Role, IsMemberVip, CoachId 
            FROM Users 
            WHERE Id = ${userId}
        `;

        if (result.recordset.length === 0) {
            return res.status(401).json({ message: 'User not found' });
        }

        // Đính kèm dữ liệu người dùng vào đối tượng yêu cầu (req.user)
        req.user = {
            id: result.recordset[0].Id,
            username: result.recordset[0].Username,
            email: result.recordset[0].Email,
            role: result.recordset[0].Role,
            isMemberVip: result.recordset[0].IsMemberVip,
            coachId: result.recordset[0].CoachId
        };

        next();
    } catch (error) {
        console.error('Auth error:', error);
        return res.status(403).json({ message: 'Invalid or expired token' });
    }
};

// Middleware kiểm tra quyền quản trị viên
const isAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
    }
    next();
};

// Middleware kiểm tra quyền huấn luyện viên
const isCoach = (req, res, next) => {
    if (!req.user || req.user.role !== 'coach') {
        return res.status(403).json({ message: 'Coach access required' });
    }
    next();
};

// Middleware kiểm tra quyền thành viên
const isMember = (req, res, next) => {
    if (!req.user || !req.user.isMemberVip) {
        return res.status(403).json({ message: 'Member access required' });
    }
    next();
};

module.exports = {
    authenticateToken,
    isAdmin,
    isCoach,
    isMember
};