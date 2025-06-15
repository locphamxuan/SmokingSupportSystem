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
                SELECT Id, Username, Email, Role, IsMember, PhoneNumber, Address, CreatedAt
                FROM Users WHERE Id = ${userId}
            `;
            
            if (userResult.recordset.length === 0) {
                return res.status(404).json({ message: 'User not found' });
            }
            
            const user = userResult.recordset[0];
            const userRole = user.Role || (user.IsMember ? 'member' : 'guest');
            
            // Lấy thông tin cơ bản
            const userDetail = {
                id: user.Id,
                username: user.Username,
                email: user.Email,
                phoneNumber: user.PhoneNumber || "",
                address: user.Address || "",
                role: userRole,
                isMember: user.IsMember,
                createdAt: user.CreatedAt
            };

            // Lấy thông tin profile hút thuốc
            const profileResult = await sql.query`
                SELECT * FROM SmokingProfiles WHERE UserId = ${userId}
            `;
            
            if (profileResult.recordset.length > 0) {
                const profile = profileResult.recordset[0];
                userDetail.smokingProfile = {
                    cigarettesPerDay: profile.cigarettesPerDay || 0,
                    costPerPack: profile.costPerPack || 0,
                    smokingFrequency: profile.smokingFrequency || '',
                    healthStatus: profile.healthStatus || '',
                    cigaretteType: profile.cigaretteType || '',
                    quitReason: profile.QuitReason || ''
                };
            }

            // Lấy thông tin chi tiết theo role
            if (userRole === 'coach') {
                // Lấy thông tin các member được assign cho coach từ bảng Booking
                const assignedMembersResult = await sql.query`
                    SELECT DISTINCT u.Id, u.Username, u.Email, u.PhoneNumber, 
                           sp.cigarettesPerDay, sp.QuitReason, b.Status, b.ScheduledTime
                    FROM Users u
                    INNER JOIN Booking b ON u.Id = b.MemberId
                    LEFT JOIN SmokingProfiles sp ON u.Id = sp.UserId
                    WHERE b.CoachId = ${userId}
                `;
                
                userDetail.assignedMembers = assignedMembersResult.recordset.map(member => ({
                    id: member.Id,
                    username: member.Username,
                    email: member.Email,
                    phoneNumber: member.PhoneNumber,
                    cigarettesPerDay: member.cigarettesPerDay || 0,
                    quitReason: member.QuitReason || 'Chưa cập nhật',
                    bookingStatus: member.Status,
                    scheduledTime: member.ScheduledTime
                }));

                // Lấy thông tin tiến độ của các member từ bảng Booking
                const progressResult = await sql.query`
                    SELECT p.UserId, p.Date, p.CigarettesSmoked, p.Notes, u.Username
                    FROM Progress p
                    INNER JOIN Users u ON p.UserId = u.Id
                    INNER JOIN Booking b ON u.Id = b.MemberId
                    WHERE b.CoachId = ${userId}
                    AND p.Date >= DATEADD(day, -7, GETDATE())
                    ORDER BY p.Date DESC
                `;
                
                userDetail.recentProgress = progressResult.recordset.map(progress => ({
                    userId: progress.UserId,
                    username: progress.Username,
                    date: progress.Date,
                    cigarettesSmoked: progress.CigarettesSmoked,
                    notes: progress.Notes
                }));
                
            } else if (userRole === 'member' || userRole === 'guest') {
                // Lấy thông tin coach được assign từ bảng Booking
                const coachResult = await sql.query`
                    SELECT DISTINCT u.Id, u.Username, u.Email, u.PhoneNumber, 
                           b.Status, b.ScheduledTime, b.Note, b.CreatedAt
                    FROM Users u
                    INNER JOIN Booking b ON u.Id = b.CoachId
                    WHERE b.MemberId = ${userId}
                    ORDER BY b.CreatedAt DESC
                `;
                
                if (coachResult.recordset.length > 0) {
                    const coach = coachResult.recordset[0];
                    userDetail.assignedCoach = {
                        id: coach.Id,
                        username: coach.Username,
                        email: coach.Email,
                        phoneNumber: coach.PhoneNumber,
                        bookingStatus: coach.Status,
                        scheduledTime: coach.ScheduledTime,
                        bookingNote: coach.Note
                    };
                }

                // Lấy tiến độ cá nhân
                const progressResult = await sql.query`
                    SELECT Date, CigarettesSmoked, Notes
                    FROM Progress
                    WHERE UserId = ${userId}
                    ORDER BY Date DESC
                `;
                
                userDetail.progress = progressResult.recordset.map(progress => ({
                    date: progress.Date,
                    cigarettesSmoked: progress.CigarettesSmoked,
                    notes: progress.Notes
                }));

                // Lấy thông tin quit plan
                const quitPlanResult = await sql.query`
                    SELECT StartDate, EndDate, GoalType, GoalValue, Description
                    FROM QuitPlans
                    WHERE UserId = ${userId}
                    ORDER BY StartDate DESC
                `;
                
                if (quitPlanResult.recordset.length > 0) {
                    const plan = quitPlanResult.recordset[0];
                    userDetail.quitPlan = {
                        startDate: plan.StartDate,
                        endDate: plan.EndDate,
                        goalType: plan.GoalType,
                        goalValue: plan.GoalValue,
                        description: plan.Description
                    };
                }
            }

            res.json(userDetail);
        } catch (error) {
            console.error('Error getting user detail:', error);
            console.error('Error details:', {
                message: error.message,
                stack: error.stack,
                code: error.code,
                number: error.number
            });
            res.status(500).json({ message: 'Error getting user detail', error: error.message });
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