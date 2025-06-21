const { sql } = require('../db');

const adminController = {
    getAllUsers: async (req, res) => {
        try {
            const result = await sql.query`
                SELECT Id, Username, Email, Role, IsMemberVip, PhoneNumber, Address, CreatedAt
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
                SELECT Id, Username, Email, Role, IsMemberVip, PhoneNumber, Address, CreatedAt
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
            console.log('Getting user detail for ID:', userId);
            
            // Lấy thông tin user cơ bản
            const userResult = await sql.query`
                SELECT Id, Username, Email, Role, IsMemberVip, PhoneNumber, Address, CreatedAt, CoachId
                FROM Users WHERE Id = ${userId}
            `;
            
            if (userResult.recordset.length === 0) {
                return res.status(404).json({ message: 'User not found' });
            }
            
            const user = userResult.recordset[0];
            const userRole = user.Role || (user.IsMemberVip ? 'member' : 'guest');
            
            console.log('User found:', { id: user.Id, username: user.Username, role: userRole });
            
            // Lấy thông tin cơ bản
            const userDetail = {
                id: user.Id,
                username: user.Username,
                email: user.Email,
                phoneNumber: user.PhoneNumber || "",
                address: user.Address || "",
                role: userRole,
                isMember: user.IsMemberVip,
                createdAt: user.CreatedAt
            };

            // Lấy thông tin profile hút thuốc (với try-catch riêng)
            try {
                console.log('Fetching smoking profile for user:', userId);
                const profileResult = await sql.query`
                    SELECT * FROM SmokingProfiles WHERE UserId = ${userId}
                `;
                
                if (profileResult.recordset.length > 0) {
                    const profile = profileResult.recordset[0];
                    userDetail.smokingProfile = {
                        cigarettesPerDay: profile.CigarettesPerDay || 0,
                        costPerPack: profile.CostPerPack || 0,
                        smokingFrequency: profile.SmokingFrequency || '',
                        healthStatus: profile.HealthStatus || '',
                        cigaretteType: profile.CigaretteType || '',
                        quitReason: profile.QuitReason || ''
                    };
                    console.log('Smoking profile found:', userDetail.smokingProfile);
                } else {
                    console.log('No smoking profile found for user:', userId);
                    userDetail.smokingProfile = {
                        cigarettesPerDay: 0,
                        costPerPack: 0,
                        smokingFrequency: '',
                        healthStatus: '',
                        cigaretteType: '',
                        quitReason: ''
                    };
                }
            } catch (profileError) {
                console.log('SmokingProfiles table error:', profileError.message);
                userDetail.smokingProfile = {
                    cigarettesPerDay: 0,
                    costPerPack: 0,
                    smokingFrequency: '',
                    healthStatus: '',
                    cigaretteType: '',
                    quitReason: ''
                };
            }

            // Lấy thông tin chi tiết theo role (với try-catch riêng)
            if (userRole === 'coach') {
                try {
                    console.log('Fetching assigned members for coach:', userId);
                    // Lấy members được assign cho coach này
                    const assignedMembersResult = await sql.query`
                        SELECT DISTINCT u.Id, u.Username, u.Email, u.PhoneNumber
                        FROM Users u
                        WHERE u.CoachId = ${userId}
                    `;
                    
                    userDetail.assignedMembers = assignedMembersResult.recordset.map(member => ({
                        id: member.Id,
                        username: member.Username,
                        email: member.Email,
                        phoneNumber: member.PhoneNumber || 'N/A',
                        cigarettesPerDay: 0,
                        quitReason: 'Chưa cập nhật',
                        bookingStatus: 'Chưa có',
                        scheduledTime: null
                    }));
                    console.log('Assigned members found:', userDetail.assignedMembers.length);
                } catch (coachError) {
                    console.log('Error getting coach data:', coachError.message);
                    userDetail.assignedMembers = [];
                }
                
                userDetail.recentProgress = [];
                
            } else if (userRole === 'member' || userRole === 'guest') {
                try {
                    console.log('Fetching coach info for user:', userId, 'CoachId:', user.CoachId);
                    // Lấy thông tin coach từ CoachId trong Users table
                    if (user.CoachId) {
                        const coachResult = await sql.query`
                            SELECT Id, Username, Email, PhoneNumber
                            FROM Users 
                            WHERE Id = ${user.CoachId}
                        `;
                        
                        if (coachResult.recordset.length > 0) {
                            const coach = coachResult.recordset[0];
                            userDetail.assignedCoach = {
                                id: coach.Id,
                                username: coach.Username,
                                email: coach.Email,
                                phoneNumber: coach.PhoneNumber || 'N/A',
                                bookingStatus: 'Đã phân công',
                                scheduledTime: null,
                                bookingNote: 'Được phân công bởi hệ thống'
                            };
                            console.log('Coach found:', userDetail.assignedCoach);
                        } else {
                            console.log('Coach not found for CoachId:', user.CoachId);
                            userDetail.assignedCoach = null;
                        }
                    } else {
                        console.log('No coach assigned to user:', userId);
                        userDetail.assignedCoach = null;
                    }
                } catch (memberError) {
                    console.log('Error getting member data:', memberError.message);
                    userDetail.assignedCoach = null;
                }

                // Khởi tạo các field mặc định
                userDetail.progress = [];
                userDetail.quitPlan = null;
            }

            console.log('Returning user detail:', JSON.stringify(userDetail, null, 2));
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
                    IsMemberVip = ${isMember ? 1 : 0},
                    PhoneNumber = ${phoneNumber || null},
                    Address = ${address || null}
                WHERE Id = ${userId}
            `;

            const result = await sql.query`
                SELECT Id, Username, Email, Role, IsMemberVip, PhoneNumber, Address, CreatedAt
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
                isMember: user.IsMemberVip,
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
        const transaction = new sql.Transaction();
        
        try {
            const userId = req.params.id;
            await transaction.begin();

            // Check if user exists
            const userCheck = await new sql.Request(transaction)
                .input('userId', sql.Int, userId)
                .query('SELECT Id, Role FROM Users WHERE Id = @userId');
                
            if (userCheck.recordset.length === 0) {
                await transaction.rollback();
                return res.status(404).json({ message: 'User not found' });
            }

            // Update any users that reference this user as their coach
            await new sql.Request(transaction)
                .input('userId', sql.Int, userId)
                .query('UPDATE Users SET CoachId = NULL WHERE CoachId = @userId');

            // Delete related records in correct order (handling foreign key constraints)
            const deleteQueries = [
                'DELETE FROM SmokingDailyLog WHERE UserId = @userId',
                'DELETE FROM Messages WHERE SenderId = @userId OR ReceiverId = @userId',
                'DELETE FROM UserBadges WHERE UserId = @userId',
                'DELETE FROM Comments WHERE UserId = @userId',
                'DELETE FROM Reports WHERE UserId = @userId',
                'DELETE FROM Rankings WHERE UserId = @userId',
                'DELETE FROM UserStatistics WHERE UserId = @userId',
                'DELETE FROM Notifications WHERE UserId = @userId',
                'DELETE FROM SmokingProfiles WHERE UserId = @userId',
                'DELETE FROM QuitPlans WHERE UserId = @userId OR CoachId = @userId',
                'DELETE FROM Booking WHERE MemberId = @userId OR CoachId = @userId',
                'DELETE FROM Posts WHERE UserId = @userId',
                'DELETE FROM Users WHERE Id = @userId'
            ];

            for (const query of deleteQueries) {
                await new sql.Request(transaction)
                    .input('userId', sql.Int, userId)
                    .query(query);
            }

            await transaction.commit();
            res.json({ message: 'User deleted successfully' });

        } catch (error) {
            console.error('Delete user error:', error);
            await transaction.rollback();
            res.status(500).json({ 
                message: 'Failed to delete user', 
                error: error.message 
            });
        }
    },

    getStatistics: async (req, res) => {
        try {
            const totalUsers = await sql.query`SELECT COUNT(*) as count FROM Users`;
            const totalCoaches = await sql.query`SELECT COUNT(*) as count FROM Users WHERE Role = 'coach'`;
            const totalMembers = await sql.query`SELECT COUNT(*) as count FROM Users WHERE IsMemberVip = 1`;
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