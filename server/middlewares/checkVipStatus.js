const { sql } = require('../db');

const checkVipStatus = async (req, res, next) => {
    try {
        if (!req.user || !req.user.id) {
            return next();
        }

        await sql.query`EXEC sp_CheckVipStatus`;
        next();
        
    } catch (error) {
        console.error('Check VIP status error:', error);
        next();
    }
};

module.exports = checkVipStatus;