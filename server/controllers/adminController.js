const { sql } = require('../db');

const adminController = {
    getAllUsers: async (req, res) => {
        try {
            const result = await sql.query`
                SELECT Id, Username, Email, Role, IsMemberVip, PhoneNumber, Address, CreatedAt, IsCoachApproved
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

                    // Lấy nhật ký hút thuốc 7 ngày gần nhất
                    const today = new Date();
                    const sevenDaysAgo = new Date(today);
                    sevenDaysAgo.setDate(today.getDate() - 7);

                    const dailyLogResult = await sql.query`
                        SELECT LogDate, Cigarettes, Feeling
                        FROM SmokingDailyLog 
                        WHERE UserId = ${userId}
                        AND LogDate >= ${sevenDaysAgo.toISOString().split('T')[0]}
                        ORDER BY LogDate DESC
                    `;

                    userDetail.smokingProfile.dailyLogs = dailyLogResult.recordset.map(log => ({
                        date: log.LogDate,
                        cigarettes: log.Cigarettes || 0,
                        feeling: log.Feeling || ''
                    }));

                    // Lấy kế hoạch cai thuốc hiện tại
                    const quitPlanResult = await sql.query`
                        SELECT TOP 1 usp.*, sp.Title, sp.Description, sp.PlanDetail
                        FROM UserSuggestedQuitPlans usp
                        JOIN SuggestedQuitPlans sp ON usp.SuggestedPlanId = sp.Id
                        WHERE usp.UserId = ${userId}
                        ORDER BY usp.StartDate DESC
                    `;

                    if (quitPlanResult.recordset.length > 0) {
                        const plan = quitPlanResult.recordset[0];
                        userDetail.quitPlan = {
                            id: plan.Id,
                            title: plan.Title,
                            description: plan.Description,
                            planDetail: plan.PlanDetail,
                            startDate: plan.StartDate,
                            targetDate: plan.TargetDate,
                            progress: plan.Progress || 0
                        };
                    }

                } else {
                    console.log('No smoking profile found for user:', userId);
                    userDetail.smokingProfile = {
                        cigarettesPerDay: 0,
                        costPerPack: 0,
                        smokingFrequency: '',
                        healthStatus: '',
                        cigaretteType: '',
                        quitReason: '',
                        dailyLogs: []
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
                    quitReason: '',
                    dailyLogs: []
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
                    // Lấy thông tin booking và profile hút thuốc cho từng member
                    const assignedMembers = [];
                    for (const member of assignedMembersResult.recordset) {
                        // Lấy booking gần nhất giữa coach và member này
                        let bookingInfo = null;
                        try {
                            const bookingResult = await sql.query`
                                SELECT TOP 1 * FROM Booking
                                WHERE MemberId = ${member.Id} AND CoachId = ${userId}
                                ORDER BY CreatedAt DESC
                            `;
                            if (bookingResult.recordset.length > 0) {
                                bookingInfo = bookingResult.recordset[0];
                            }
                        } catch (err) {
                            console.log('Error fetching booking for member', member.Id, err.message);
                        }
                        // Lấy profile hút thuốc
                        let smokingProfile = null;
                        try {
                            const profileResult = await sql.query`
                                SELECT * FROM SmokingProfiles WHERE UserId = ${member.Id}
                            `;
                            if (profileResult.recordset.length > 0) {
                                smokingProfile = profileResult.recordset[0];
                            }
                        } catch (err) {
                            console.log('Error fetching smoking profile for member', member.Id, err.message);
                        }
                        assignedMembers.push({
                            id: member.Id,
                            username: member.Username,
                            email: member.Email,
                            phoneNumber: member.PhoneNumber || 'N/A',
                            // Thông tin hút thuốc
                            cigarettesPerDay: smokingProfile ? smokingProfile.CigarettesPerDay : 0,
                            costPerPack: smokingProfile ? smokingProfile.CostPerPack : 0,
                            smokingFrequency: smokingProfile ? smokingProfile.SmokingFrequency : '',
                            healthStatus: smokingProfile ? smokingProfile.HealthStatus : '',
                            cigaretteType: smokingProfile ? smokingProfile.CigaretteType : '',
                            quitReason: smokingProfile ? smokingProfile.QuitReason : 'Chưa cập nhật',
                            // Thông tin booking
                            bookingStatus: bookingInfo ? bookingInfo.Status : 'Chưa có',
                            slot: bookingInfo ? bookingInfo.Slot : null,
                            slotDate: bookingInfo ? bookingInfo.SlotDate : null,
                            scheduledTime: bookingInfo ? bookingInfo.SlotDate : null,
                            bookingNote: bookingInfo ? bookingInfo.Note : null
                        });
                    }
                    userDetail.assignedMembers = assignedMembers;
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
            console.log('Starting delete process for user:', userId);
            
            await transaction.begin();
            console.log('Transaction began');

            // Check if user exists and get their role
            const userCheck = await new sql.Request(transaction)
                .input('userId', sql.Int, userId)
                .query('SELECT Id, Role, CoachId FROM Users WHERE Id = @userId');
            
            console.log('User check result:', userCheck.recordset);
                
            if (userCheck.recordset.length === 0) {
                await transaction.rollback();
                return res.status(404).json({ message: 'User not found' });
            }

            // First, update any users that reference this user as their coach
            const updateCoachResult = await new sql.Request(transaction)
                .input('userId', sql.Int, userId)
                .query('UPDATE Users SET CoachId = NULL WHERE CoachId = @userId');
            
            console.log('Updated users with CoachId reference:', updateCoachResult.rowsAffected);

            // Delete related records in correct order (handling foreign key constraints)
            const deleteQueries = [
                'DELETE FROM SmokingDailyLog WHERE UserId = @userId',
                'DELETE FROM Messages WHERE SenderId = @userId OR ReceiverId = @userId',
                'DELETE FROM UserBadges WHERE UserId = @userId',
                'DELETE FROM Comments WHERE UserId = @userId',
                'DELETE FROM Reports WHERE UserId = @userId',
                'DELETE FROM Rankings WHERE UserId = @userId',
                'DELETE FROM Notifications WHERE UserId = @userId',
                'DELETE FROM SmokingProfiles WHERE UserId = @userId',
                'DELETE FROM QuitPlans WHERE UserId = @userId OR CoachId = @userId',
                'DELETE FROM Booking WHERE MemberId = @userId OR CoachId = @userId',
                'DELETE FROM Posts WHERE UserId = @userId',
                'DELETE FROM UserSuggestedQuitPlans WHERE UserId = @userId',
                'DELETE FROM Users WHERE Id = @userId'
            ];

            // Execute each delete query in sequence
            for (const query of deleteQueries) {
                try {
                    const result = await new sql.Request(transaction)
                        .input('userId', sql.Int, userId)
                        .query(query);
                    console.log(`Executed query: ${query}`, result.rowsAffected);
                } catch (queryError) {
                    console.error(`Error executing query: ${query}`, queryError);
                    throw queryError;
                }
            }

            await transaction.commit();
            console.log('Transaction committed successfully');
            res.json({ message: 'User deleted successfully' });

        } catch (error) {
            console.error('Delete user error:', error);
            console.error('Error details:', {
                message: error.message,
                code: error.code,
                number: error.number,
                state: error.state,
                class: error.class,
                lineNumber: error.lineNumber,
                serverName: error.serverName,
                procName: error.procName
            });
            
            try {
                await transaction.rollback();
                console.log('Transaction rolled back');
            } catch (rollbackError) {
                console.error('Rollback failed:', rollbackError);
            }
            
            res.status(500).json({ 
                message: 'Failed to delete user', 
                error: error.message,
                details: error.code ? `SQL Error Code: ${error.code}` : undefined
            });
        }
    },

    getStatistics: async (req, res) => {
        try {
            // Tổng số người dùng, coach, member, guest (giữ nguyên)
            const totalUsers = await sql.query`SELECT COUNT(*) as count FROM Users`;
            const totalCoaches = await sql.query`SELECT COUNT(*) as count FROM Users WHERE Role = 'coach'`;
            const totalMembers = await sql.query`SELECT COUNT(*) as count FROM Users WHERE IsMemberVip = 1`;
            const totalGuests = await sql.query`SELECT COUNT(*) as count FROM Users WHERE Role = 'guest'`;

            // Tổng số ngày không hút thuốc (Cigarettes = 0)
            const smokeFreeDaysResult = await sql.query`
                SELECT COUNT(*) as count FROM SmokingDailyLog WHERE Cigarettes = 0
            `;
            const totalSmokeFreeDays = smokeFreeDaysResult.recordset[0].count || 0;

            // Tổng số tiền tiết kiệm (SavedMoney)
            const moneySavedResult = await sql.query`
                SELECT SUM(SavedMoney) as total FROM SmokingDailyLog
            `;
            const totalMoneySaved = moneySavedResult.recordset[0].total || 0;

            // Tổng số tiền đã nhận được (tạm thời set0ưa có bảng BookingPayment)
            const totalReceived = 0;

            // Thống kê theo ngày (7 ngày gần nhất)
            const dailyStatsResult = await sql.query`
                SELECT TOP 7 LogDate as date,
                    SUM(CASE WHEN Cigarettes = 0 THEN 1 ELSE 0 END) as smokeFreeDays,
                    SUM(SavedMoney) as moneySaved
                FROM SmokingDailyLog
                GROUP BY LogDate
                ORDER BY LogDate DESC
            `;
            const dailyStats = dailyStatsResult.recordset.map(row => ({
                date: row.date,
                smokeFreeDays: row.smokeFreeDays,
                moneySaved: row.moneySaved || 0
            })).reverse(); // Đảo ngược để ngày cũ lên trước

            // Thống kê theo tháng (6 tháng gần nhất)
            const monthlyStatsResult = await sql.query`
                SELECT FORMAT(LogDate, 'yyyy-MM') as month,
                    SUM(CASE WHEN Cigarettes = 0 THEN 1 ELSE 0 END) as smokeFreeDays,
                    SUM(SavedMoney) as moneySaved
                FROM SmokingDailyLog
                GROUP BY FORMAT(LogDate, 'yyyy-MM')
                ORDER BY month DESC
            `;
            const monthlyStats = monthlyStatsResult.recordset.map(row => ({
                month: row.month,
                smokeFreeDays: row.smokeFreeDays,
                moneySaved: row.moneySaved || 0
            })).reverse();

            res.json({
                totalUsers: totalUsers.recordset[0].count,
                totalCoaches: totalCoaches.recordset[0].count,
                totalMembers: totalMembers.recordset[0].count,
                totalGuests: totalGuests.recordset[0].count,
                totalSmokeFreeDays,
                totalMoneySaved,
                totalReceived,
                dailyStats,
                monthlyStats
            });
        } catch (error) {
            console.error('Statistics error:', error);
            res.status(500).json({ message: 'Error getting statistics', error: error.message });
        }
    },

    // Posts Management Functions
    getAllPosts: async (req, res) => {
        try {
            console.log('Admin fetching all posts...');
            const result = await sql.query`
                SELECT 
                    p.Id, 
                    p.Title, 
                    p.Content, 
                    p.Status,
                    p.CreatedAt,
                    p.BadgeId,
                    u.Username AS Author,
                    u.Id AS UserId,
                    b.Name AS BadgeName,
                    b.Description AS BadgeDescription,
                    b.BadgeType
                FROM Posts p
                JOIN Users u ON p.UserId = u.Id
                LEFT JOIN Badges b ON p.BadgeId = b.Id
                ORDER BY p.CreatedAt DESC
            `;
            
            console.log(`Found ${result.recordset.length} posts`);
            console.log('Sample post with badge data:', JSON.stringify(result.recordset[0], null, 2));
            res.json(result.recordset);
        } catch (error) {
            console.error('Error getting all posts for admin:', error);
            res.status(500).json({ message: 'Error getting posts', error: error.message });
        }
    },

    updatePostStatus: async (req, res) => {
        try {
            const postId = req.params.id;
            const { status } = req.body;
            
            console.log(`Admin updating post ${postId} status to: ${status}`);
            
            // Validate status
            if (!['pending', 'published'].includes(status)) {
                return res.status(400).json({ message: 'Invalid status. Must be "pending" or "published"' });
            }
            
            // Update post status
            await sql.query`
                UPDATE Posts 
                SET Status = ${status}
                WHERE Id = ${postId}
            `;
            
            // Get updated post info
            const updatedPost = await sql.query`
                SELECT 
                    p.Id, 
                    p.Title, 
                    p.Content, 
                    p.Status, 
                    p.CreatedAt,
                    u.Username AS Author,
                    u.Id AS UserId
                FROM Posts p
                JOIN Users u ON p.UserId = u.Id
                WHERE p.Id = ${postId}
            `;
            
            if (updatedPost.recordset.length === 0) {
                return res.status(404).json({ message: 'Post not found' });
            }
            
            console.log(`Post ${postId} status updated successfully`);
            res.json({ 
                message: 'Post status updated successfully', 
                post: updatedPost.recordset[0] 
            });
        } catch (error) {
            console.error('Error updating post status:', error);
            res.status(500).json({ message: 'Error updating post status', error: error.message });
        }
    },

    deletePost: async (req, res) => {
        try {
            const postId = req.params.id;
            console.log(`Admin deleting post ${postId}`);
            
            // First delete all comments for this post
            await sql.query`
                DELETE FROM Comments WHERE PostId = ${postId}
            `;
            
            // Then delete the post
            const result = await sql.query`
                DELETE FROM Posts WHERE Id = ${postId}
            `;
            
            if (result.rowsAffected[0] === 0) {
                return res.status(404).json({ message: 'Post not found' });
            }
            
            console.log(`Post ${postId} and its comments deleted successfully`);
            res.json({ message: 'Post deleted successfully' });
        } catch (error) {
            console.error('Error deleting post:', error);
            res.status(500).json({ message: 'Error deleting post', error: error.message });
        }
    },

    getPostDetail: async (req, res) => {
        try {
            const postId = req.params.id;
            console.log(`Admin getting post detail for ID: ${postId}`);
            
            // Get post with author info and badge info
            const postResult = await sql.query`
                SELECT 
                    p.Id, 
                    p.Title, 
                    p.Content, 
                    p.Status, 
                    p.CreatedAt,
                    p.BadgeId,
                    u.Username AS Author,
                    u.Id AS UserId,
                    u.Email AS AuthorEmail,
                    b.Name AS BadgeName,
                    b.Description AS BadgeDescription,
                    b.BadgeType
                FROM Posts p
                JOIN Users u ON p.UserId = u.Id
                LEFT JOIN Badges b ON p.BadgeId = b.Id
                WHERE p.Id = ${postId}
            `;
            
            if (postResult.recordset.length === 0) {
                return res.status(404).json({ message: 'Post not found' });
            }
            
            const post = postResult.recordset[0];
            
            // Get comments for this post
            const commentsResult = await sql.query`
                SELECT 
                    c.Id, 
                    c.Content, 
                    c.CreatedAt,
                    u.Username AS Author,
                    u.Id AS UserId
                FROM Comments c
                JOIN Users u ON c.UserId = u.Id
                WHERE c.PostId = ${postId}
                ORDER BY c.CreatedAt ASC
            `;
            
            post.Comments = commentsResult.recordset;
            
            console.log(`Post detail retrieved: ${post.Title} with ${post.Comments.length} comments`);
            res.json(post);
        } catch (error) {
            console.error('Error getting post detail:', error);
            res.status(500).json({ message: 'Error getting post detail', error: error.message });
        }
    },

    approveCoach: async (req, res) => {
        const { coachId } = req.params;
        await sql.query`UPDATE Users SET IsCoachApproved = 1 WHERE Id = ${coachId} AND Role = 'coach'`;
        res.json({ message: 'Coach approved successfully' });
    },

    getAllFeedback: async (req, res) => {
      try {
        const result = await sql.query`
          SELECT f.FeedbackId, u.Username as CustomerName, f.CoachId, f.Rating, f.Messages, f.SentAt
          FROM Feedback f
          JOIN Users u ON f.UserId = u.Id
          ORDER BY f.SentAt DESC
        `;
        res.status(200).json({ feedbacks: result.recordset });
      } catch (err) {
        console.error('Lỗi khi lấy feedback cho admin:', err);
        res.status(500).json({ message: 'Không thể lấy feedback.', error: err.message });
      }
    },
};

module.exports = adminController;