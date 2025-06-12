const { sql } = require('../db');

const adminController = {
    getAllUsers: async (req, res) => {
        try {
            const result = await sql.query`
                SELECT Id, Username, Email, Role, IsMember, PhoneNumber, Address, CreatedAt
                FROM Users
                ORDER BY CreatedAt DESC
            `;
            res.json(result.recordset);
        } catch (error) {
            console.error('Error getting users:', error);
            res.status(500).json({ message: 'Error getting users' });
        }
    },

    getAllCoaches: async (req, res) => {
        try {
            const result = await sql.query`
                SELECT Id, Username, Email, Role, IsMember, PhoneNumber, Address, CreatedAt
                FROM Users 
                WHERE Role = 'coach'
                ORDER BY CreatedAt DESC
            `;
            res.json(result.recordset);
        } catch (error) {
            console.error('Error getting coaches:', error);
            res.status(500).json({ message: 'Error getting coaches' });
        }
    },

    getUserDetail: async (req, res) => {
        try {
            const userId = req.params.id;
            const userResult = await sql.query`
                SELECT Id, Username, Email, Role, IsMember, PhoneNumber, Address
                FROM Users WHERE Id = ${userId}
            `;
            
            if (userResult.recordset.length === 0) {
                return res.status(404).json({ message: 'User not found' });
            }
            
            const user = userResult.recordset[0];
            const profileResult = await sql.query`
                SELECT * FROM SmokingProfiles WHERE UserId = ${userId}
            `;
            
            const profile = profileResult.recordset[0];
            const userDetail = {
                id: user.Id,
                username: user.Username,
                email: user.Email,
                phoneNumber: user.PhoneNumber || "",
                address: user.Address || "",
                role: user.Role || 'guest',
                isMember: user.IsMember,
                smokingStatus: profile ? {
                    cigarettesPerDay: profile.cigarettesPerDay || 0,
                    costPerPack: profile.costPerPack || 0,
                    smokingFrequency: profile.smokingFrequency || '',
                    healthStatus: profile.healthStatus || '',
                    cigaretteType: profile.cigaretteType || '',
                    quitReason: profile.QuitReason || ''
                } : {}
            };
            res.json(userDetail);
        } catch (error) {
            console.error('Error getting user detail:', error);
            res.status(500).json({ message: 'Error getting user detail' });
        }
    },

    updateUser: async (req, res) => {
        try {
            const { username, email, role, isMember, phoneNumber, address } = req.body;
            const userId = parseInt(req.params.id);

            if (!username || !email) {
                return res.status(400).json({ 
                    success: false,
                    message: 'Username and email are required' 
                });
            }

            if (isNaN(userId)) {
                return res.status(400).json({ 
                    success: false,
                    message: 'Invalid user ID' 
                });
            }

            const checkUser = await sql.query`SELECT Id FROM Users WHERE Id = ${userId}`;
            if (checkUser.recordset.length === 0) {
                return res.status(404).json({ 
                    success: false,
                    message: 'User not found' 
                });
            }

            await sql.query`
                UPDATE Users
                SET
                    Username = ${username},
                    Email = ${email},
                    Role = ${role || 'guest'},
                    IsMember = ${isMember ? 1 : 0},
                    PhoneNumber = ${phoneNumber || null},
                    Address = ${address || null}
                WHERE Id = ${userId}
            `;

            const result = await sql.query`
                SELECT Id, Username, Email, Role, IsMember, PhoneNumber, Address, CreatedAt
                FROM Users WHERE Id = ${userId}
            `;
            
            const user = result.recordset[0];
            const updatedUser = {
                id: user.Id,
                username: user.Username,
                email: user.Email,
                phoneNumber: user.PhoneNumber || "",
                address: user.Address || "",
                role: user.Role || 'guest',
                isMember: user.IsMember,
                createdAt: user.CreatedAt
            };

            res.status(200).json({
                success: true,
                message: 'User updated successfully',
                data: updatedUser
            });
        } catch (error) {
            console.error('Update user error:', error);
            res.status(500).json({ 
                success: false,
                message: 'Update failed', 
                error: error.message
            });
        }
    },

    deleteUser: async (req, res) => {
        try {
            const userId = req.params.id;
            
            const checkUser = await sql.query`SELECT Id FROM Users WHERE Id = ${userId}`;
            if (checkUser.recordset.length === 0) {
                return res.status(404).json({ message: 'User not found' });
            }
            
            // Delete related records
            await sql.query`DELETE FROM UserBadges WHERE UserId = ${userId}`;
            await sql.query`DELETE FROM Comments WHERE UserId = ${userId}`;
            await sql.query`DELETE FROM Blogs WHERE UserId = ${userId}`;
            await sql.query`DELETE FROM Feedbacks WHERE UserId = ${userId}`;
            await sql.query`DELETE FROM QuitPlans WHERE UserId = ${userId}`;
            await sql.query`DELETE FROM Progress WHERE UserId = ${userId}`;
            await sql.query`DELETE FROM Notifications WHERE UserId = ${userId}`;
            await sql.query`DELETE FROM UserStatistics WHERE UserId = ${userId}`;
            await sql.query`DELETE FROM Rankings WHERE UserId = ${userId}`;
            await sql.query`DELETE FROM SmokingDailyLog WHERE UserId = ${userId}`;
            await sql.query`DELETE FROM SmokingProfiles WHERE UserId = ${userId}`;
            
            // Delete user
            await sql.query`DELETE FROM Users WHERE Id = ${userId}`;
            
            res.json({ message: 'User deleted successfully' });
        } catch (error) {
            console.error('Delete user error:', error);
            res.status(500).json({ message: 'Delete failed', error: error.message });
        }
    },

    getStatistics: async (req, res) => {
        try {
            const totalUsers = await sql.query`SELECT COUNT(*) as count FROM Users`;
            const totalCoaches = await sql.query`SELECT COUNT(*) as count FROM Users WHERE Role = 'coach'`;
            const totalMembers = await sql.query`SELECT COUNT(*) as count FROM Users WHERE IsMember = 1`;
            const totalGuests = await sql.query`SELECT COUNT(*) as count FROM Users WHERE Role = 'guest'`;

            res.json({
                totalUsers: totalUsers.recordset[0].count,
                totalCoaches: totalCoaches.recordset[0].count,
                totalMembers: totalMembers.recordset[0].count,
                totalGuests: totalGuests.recordset[0].count
            });
        } catch (error) {
            console.error('Statistics error:', error);
            res.status(500).json({ message: 'Error getting statistics', error: error.message });
        }
    }
};

module.exports = adminController;