const { sql } = require('../db');

const coachController = {
    // Test method to check database connectivity
    testDatabaseConnection: async (req, res) => {
        try {
            console.log('[testDatabaseConnection] Testing database connection...');
            
            // Test basic connection
            const testQuery = await sql.query`SELECT 1 as test`;
            console.log('[testDatabaseConnection] Basic connection test:', testQuery.recordset);
            
            // Test table existence
            const tables = await sql.query`
                SELECT TABLE_NAME 
                FROM INFORMATION_SCHEMA.TABLES 
                WHERE TABLE_TYPE = 'BASE TABLE' 
                AND TABLE_NAME IN ('Users', 'SmokingProfiles', 'SmokingDailyLog', 'QuitPlans')
                ORDER BY TABLE_NAME
            `;
            console.log('[testDatabaseConnection] Available tables:', tables.recordset);
            
            // Test Users table
            const usersCount = await sql.query`SELECT COUNT(*) as count FROM Users`;
            console.log('[testDatabaseConnection] Users count:', usersCount.recordset);
            
            res.json({
                success: true,
                message: 'Database connection test successful',
                tables: tables.recordset,
                usersCount: usersCount.recordset[0].count
            });
            
        } catch (error) {
            console.error('[testDatabaseConnection] Error:', error);
            res.status(500).json({
                success: false,
                message: 'Database connection test failed',
                error: error.message,
                stack: error.stack
            });
        }
    },

    getCoachesList: async (req, res) => {
        try {
            const coaches = await sql.query`
                SELECT Id, Username, Email, PhoneNumber FROM Users WHERE Role = 'coach'
            `;
            res.json({ coaches: coaches.recordset });
        } catch (error) {
            console.error('Get coaches error:', error);
            res.status(500).json({ message: 'Failed to get coaches list', error: error.message });
        }
    },

    getAssignedMembers: async (req, res) => {
        try {
            const coachId = req.user.id;
            console.log(`[getAssignedMembers] Fetching assigned members for coach ID: ${coachId}`);
            // First get all VIP members assigned to this coach
            const membersResult = await sql.query`
                SELECT Id, Username, Email, PhoneNumber, CreatedAt, IsMemberVip
                FROM Users 
                WHERE CoachId = ${coachId} AND IsMemberVip = 1
            `;

            // Then get the latest booking for each member
            const members = await Promise.all(
                membersResult.recordset.map(async (member) => {
                    const bookingResult = await sql.query`
                        SELECT TOP 1 Id, SlotDate, Slot, Status, CreatedAt
                        FROM Booking
                        WHERE MemberId = ${member.Id} AND CoachId = ${coachId}
                        ORDER BY CreatedAt DESC
                    `;
                    
                    const latestBooking = bookingResult.recordset[0] || null;
                    
                    return {
                        Id: member.Id,
                        Username: member.Username,
                        Email: member.Email,
                        PhoneNumber: member.PhoneNumber,
                        CreatedAt: member.CreatedAt,
                        IsMemberVip: member.IsMemberVip,
                        appointmentId: latestBooking?.Id || null,
                        appointmentSlotDate: latestBooking?.SlotDate || null,
                        appointmentSlot: latestBooking?.Slot || null,
                        appointmentStatus: latestBooking?.Status || null
                    };
                })
            );

            // Convert to recordset format for compatibility
            const mockSqlResult = { recordset: members };

            // Format the output to match the MemberWithAppointment schema  
            const formattedMembers = mockSqlResult.recordset.map(member => ({
                Id: member.Id,
                Username: member.Username,
                Email: member.Email,
                PhoneNumber: member.PhoneNumber,
                CreatedAt: member.CreatedAt,
                IsMemberVip: member.IsMemberVip,
                appointment: member.appointmentId ? {
                    id: member.appointmentId,
                    memberId: member.Id,
                    coachId: coachId,
                    slotDate: member.appointmentSlotDate,
                    slot: member.appointmentSlot,
                    status: member.appointmentStatus ? member.appointmentStatus.toLowerCase() : null,
                } : null,
            }));

            console.log('[getAssignedMembers] Raw SQL recordset:', JSON.stringify(mockSqlResult.recordset, null, 2));
            console.log('[getAssignedMembers] Formatted members before sending:', JSON.stringify(formattedMembers, null, 2));
            
            // Debug: Check if appointments are being returned correctly
            mockSqlResult.recordset.forEach(member => {
                if (member.appointmentId) {
                    console.log(`[getAssignedMembers] Member ${member.Username} has appointment ${member.appointmentId} with status: ${member.appointmentStatus}`);
                } else {
                    console.log(`[getAssignedMembers] Member ${member.Username} has no appointment`);
                }
            });
            res.json({ members: formattedMembers });
        } catch (error) {
            console.error('Error getting assigned members:', error);
            res.status(500).json({ message: 'Failed to get assigned members', error: error.message });
        }
    },

    // New function: Award badge to VIP member
    awardBadgeToMember: async (req, res) => {
        try {
            const coachId = req.user.id;
            const { memberId, badgeId, reason } = req.body;

            console.log(`[awardBadgeToMember] ========== BADGE AWARDING START ==========`);
            console.log(`[awardBadgeToMember] Coach ${coachId} awarding badge ${badgeId} to member ${memberId}`);
            console.log(`[awardBadgeToMember] Reason: "${reason}"`);
            console.log(`[awardBadgeToMember] Request body:`, req.body);

            // Verify that the member is assigned to this coach and is VIP
            console.log(`[awardBadgeToMember] Checking member assignment and VIP status...`);
            const memberCheck = await sql.query`
                SELECT Id, Username, IsMemberVip, CoachId 
                FROM Users 
                WHERE Id = ${memberId} AND CoachId = ${coachId} AND IsMemberVip = 1
            `;
            console.log(`[awardBadgeToMember] Member check result:`, memberCheck.recordset);

            if (memberCheck.recordset.length === 0) {
                console.log(`[awardBadgeToMember] ❌ Member not found or not VIP`);
                return res.status(400).json({ 
                    message: 'Thành viên không được phân công hoặc không phải VIP' 
                });
            }

            // Check if member already has this badge
            console.log(`[awardBadgeToMember] Checking if member already has badge...`);
            const existingBadge = await sql.query`
                SELECT Id FROM UserBadges 
                WHERE UserId = ${memberId} AND BadgeId = ${badgeId}
            `;
            console.log(`[awardBadgeToMember] Existing badge check:`, existingBadge.recordset);

            if (existingBadge.recordset.length > 0) {
                console.log(`[awardBadgeToMember] ❌ Member already has this badge`);
                return res.status(400).json({ 
                    message: 'Thành viên đã có huy hiệu này rồi' 
                });
            }

            // Verify badge exists
            console.log(`[awardBadgeToMember] Verifying badge exists...`);
            const badgeCheck = await sql.query`
                SELECT Id, Name FROM Badges WHERE Id = ${badgeId}
            `;
            console.log(`[awardBadgeToMember] Badge check result:`, badgeCheck.recordset);

            if (badgeCheck.recordset.length === 0) {
                console.log(`[awardBadgeToMember] ❌ Badge not found`);
                return res.status(400).json({ 
                    message: 'Huy hiệu không tồn tại' 
                });
            }

            // Award the badge
            console.log(`[awardBadgeToMember] Awarding badge to member...`);
            const awardResult = await sql.query`
                INSERT INTO UserBadges (UserId, BadgeId, AwardedAt)
                VALUES (${memberId}, ${badgeId}, GETDATE())
            `;
            console.log(`[awardBadgeToMember] Badge award result:`, awardResult);

            // Create notification for the member
            const badge = badgeCheck.recordset[0];
            const member = memberCheck.recordset[0];
            const notificationMessage = reason 
                ? `🎖️ Chúc mừng! Bạn đã nhận được huy hiệu "${badge.Name}" từ huấn luyện viên vì: ${reason}`
                : `🎖️ Chúc mừng! Bạn đã nhận được huy hiệu "${badge.Name}" từ huấn luyện viên!`;

            console.log(`[awardBadgeToMember] Creating notification...`);
            const notificationResult = await sql.query`
                INSERT INTO Notifications (UserId, Message, Type, CreatedAt)
                VALUES (${memberId}, ${notificationMessage}, 'badge_from_coach', GETDATE())
            `;
            console.log(`[awardBadgeToMember] Notification result:`, notificationResult);

            console.log(`[awardBadgeToMember] ✅ Successfully awarded badge "${badge.Name}" to member "${member.Username}"`);
            console.log(`[awardBadgeToMember] ========== BADGE AWARDING END ==========`);

            res.json({ 
                message: `Đã trao huy hiệu "${badge.Name}" cho thành viên ${member.Username} thành công!`,
                badge: badge,
                member: member
            });

        } catch (error) {
            console.error('[awardBadgeToMember] ❌ Error awarding badge:', error);
            console.error('[awardBadgeToMember] Error stack:', error.stack);
            res.status(500).json({ 
                message: 'Lỗi khi trao huy hiệu', 
                error: error.message 
            });
        }
    },

    getMemberProgress: async (req, res) => {
        try {
            const memberId = parseInt(req.params.memberId); // Convert to integer
            const coachId = req.user.id;

            // Validate memberId
            if (isNaN(memberId) || memberId <= 0) {
                return res.status(400).json({ message: 'Invalid member ID' });
            }

            // First check if the coach is assigned to this member
            const memberCheck = await sql.query`
                SELECT u.Id, u.Username, u.CoachId 
                FROM Users u 
                WHERE u.Id = ${memberId} AND u.CoachId = ${coachId}
            `;
            if (memberCheck.recordset.length === 0) {
                return res.status(403).json({ message: 'You do not have access to this member\'s progress' });
            }

            // Get smoking profile
            const smokingProfileResult = await sql.query`
                SELECT CigarettesPerDay, CostPerPack, SmokingFrequency, HealthStatus, QuitReason, CigaretteType
                FROM SmokingProfiles 
                WHERE UserId = ${memberId}
            `;
            let smokingProfile = null;
            if (smokingProfileResult.recordset.length > 0) {
                const profile = smokingProfileResult.recordset[0];
                smokingProfile = {
                    cigarettesPerDay: profile.CigarettesPerDay,
                    costPerPack: profile.CostPerPack,
                    smokingFrequency: profile.SmokingFrequency,
                    healthStatus: profile.HealthStatus,
                    quitReason: profile.QuitReason,
                    cigaretteType: profile.CigaretteType
                };
            }

            // Get ALL progress history from SmokingDailyLog
            const allRecordsResult = await sql.query`
                SELECT Id, UserId, LogDate, Cigarettes, Feeling 
                FROM SmokingDailyLog 
                WHERE UserId = ${memberId}
                ORDER BY LogDate DESC
            `;
            const history = allRecordsResult.recordset.map(log => ({
                id: log.Id,
                date: log.LogDate,
                cigarettes: log.Cigarettes,
                feeling: log.Feeling
            }));

            // Get coach's custom quit plan (coachQuitPlan)
            let coachQuitPlan = null;
            const customQuitPlanResult = await sql.query`
                SELECT TOP 1 Id, StartDate, TargetDate, PlanDetail, InitialCigarettes, DailyReduction, UserId, CoachId, CreatedAt
                FROM QuitPlans 
                WHERE UserId = ${memberId} AND CoachId = ${coachId}
                ORDER BY CreatedAt DESC
            `;
            if (customQuitPlanResult.recordset.length > 0) {
                const plan = customQuitPlanResult.recordset[0];
                coachQuitPlan = {
                    id: plan.Id,
                    startDate: plan.StartDate ? plan.StartDate.toISOString().slice(0, 10) : null,
                    targetDate: plan.TargetDate ? plan.TargetDate.toISOString().slice(0, 10) : null,
                    initialCigarettes: plan.InitialCigarettes || 0,
                    dailyReduction: plan.DailyReduction || 0,
                    planDetail: plan.PlanDetail || '',
                    createdAt: plan.CreatedAt || null,
                    planSource: 'coach'
                };
            }

            // Get system suggested quit plan (systemQuitPlan)
            let systemQuitPlan = null;
            const suggestedQuitPlanResult = await sql.query`
                SELECT TOP 1 usp.StartDate, usp.TargetDate, usp.Status, usp.SuggestedPlanId, usp.UserId, usp.CreatedAt
                FROM UserSuggestedQuitPlans usp
                WHERE usp.UserId = ${memberId}
                ORDER BY usp.CreatedAt DESC
            `;
            let suggestedPlanDetails = null;
            if (suggestedQuitPlanResult.recordset.length > 0) {
                const userPlan = suggestedQuitPlanResult.recordset[0];
                try {
                    const planDetailsResult = await sql.query`
                        SELECT PlanDetail, InitialCigarettes, DailyReduction
                        FROM SuggestedQuitPlans 
                        WHERE Id = ${userPlan.SuggestedPlanId}
                    `;
                    suggestedPlanDetails = planDetailsResult.recordset[0] || {};
                } catch (planDetailsError) {
                    suggestedPlanDetails = {};
                }
                systemQuitPlan = {
                    startDate: userPlan.StartDate ? userPlan.StartDate.toISOString().slice(0, 10) : null,
                    targetDate: userPlan.TargetDate ? userPlan.TargetDate.toISOString().slice(0, 10) : null,
                    planType: 'suggested',
                    initialCigarettes: suggestedPlanDetails.InitialCigarettes || 0,
                    dailyReduction: suggestedPlanDetails.DailyReduction || 0,
                    milestones: [],
                    status: userPlan.Status || 'active',
                    planDetail: suggestedPlanDetails.PlanDetail || 'Kế hoạch được gợi ý từ hệ thống',
                    planSource: 'system',
                    createdAt: userPlan.CreatedAt || null
                };
            }

            const responseData = {
                smokingProfile: smokingProfile,
                history: history,
                coachQuitPlan: coachQuitPlan,
                systemQuitPlan: systemQuitPlan
            };
            res.json(responseData);

        } catch (error) {
            res.status(500).json({ message: 'Failed to get member progress', error: error.message });
        }
    },

    getMemberSmokingHistory: async (req, res) => {
        try {
            const memberId = parseInt(req.params.memberId);
            const coachId = req.user.id;

            console.log(`[getMemberSmokingHistory] Fetching smoking history for member ${memberId} by coach ${coachId}`);
            
            // Validate memberId
            if (isNaN(memberId) || memberId <= 0) {
                console.log(`[getMemberSmokingHistory] Invalid memberId: ${req.params.memberId}`);
                return res.status(400).json({ message: 'Invalid member ID' });
            }

            // Check if the coach is assigned to this member
            const memberCheck = await sql.query`
                SELECT Id, Username, CoachId 
                FROM Users 
                WHERE Id = ${memberId} AND CoachId = ${coachId}
            `;
            
            if (memberCheck.recordset.length === 0) {
                console.log(`[getMemberSmokingHistory] Member ${memberId} not assigned to coach ${coachId}`);
                return res.status(403).json({ message: 'You do not have access to this member\'s data' });
            }

            // Get smoking history
            const historyResult = await sql.query`
                SELECT LogDate as Date, Cigarettes, Feeling
                FROM SmokingDailyLog 
                WHERE UserId = ${memberId}
                ORDER BY LogDate DESC
            `;

            console.log(`[getMemberSmokingHistory] Found ${historyResult.recordset.length} history records for member ${memberId}`);
            
            res.json({ 
                history: historyResult.recordset || []
            });

        } catch (error) {
            console.error('[getMemberSmokingHistory] Error getting member smoking history:', error);
            console.error('[getMemberSmokingHistory] Error stack:', error.stack);
            res.status(500).json({ message: 'Failed to get member smoking history', error: error.message });
        }
    },

    // API: Lấy danh sách kế hoạch mẫu của coach hoặc mẫu chung
    getMyQuitPlanTemplates: async (req, res) => {
      try {
        const coachId = req.user.id;
        const templates = await sql.query`
          SELECT * FROM CoachSuggestedQuitPlans
          WHERE (CoachId = ${coachId} OR CoachId IS NULL) AND UserId IS NULL
        `;
        res.json({ templates: templates.recordset });
      } catch (error) {
        res.status(500).json({ message: 'Lỗi khi lấy mẫu kế hoạch', error: error.message });
      }
    },

    // API: Gán kế hoạch mẫu cho user (copy từ template sang user thực tế)
    assignQuitPlanToUser: async (req, res) => {
      try {
        const coachId = req.user.id;
        const { userId, templateId, startDate, targetDate } = req.body;
        if (!userId || !templateId || !startDate || !targetDate) {
          return res.status(400).json({ message: 'Thiếu thông tin.' });
        }
        // Lấy template
        const result = await sql.query`
          SELECT * FROM CoachSuggestedQuitPlans WHERE Id = ${templateId}
        `;
        if (result.recordset.length === 0) {
          return res.status(404).json({ message: 'Không tìm thấy mẫu.' });
        }
        const template = result.recordset[0];

        // Kiểm tra đã từng gửi kế hoạch cho member này chưa (theo coachId, userId)
        const existingPlan = await sql.query`
          SELECT TOP 1 * FROM CoachSuggestedQuitPlans WHERE CoachId = ${coachId} AND UserId = ${userId} ORDER BY CreatedAt DESC
        `;
        if (existingPlan.recordset.length > 0) {
          // Đã từng gửi, kiểm tra xem member có booking mới với note khác không
          const lastPlanCreatedAt = existingPlan.recordset[0].CreatedAt;
          // Lấy booking mới nhất của member với coach này, có note khác
          const latestBooking = await sql.query`
            SELECT TOP 1 * FROM Booking WHERE MemberId = ${userId} AND CoachId = ${coachId} AND CreatedAt > ${lastPlanCreatedAt} AND Note IS NOT NULL AND LEN(Note) > 0 ORDER BY CreatedAt DESC
          `;
          if (latestBooking.recordset.length === 0) {
            return res.status(400).json({ message: 'Bạn đã gửi kế hoạch cho thành viên này rồi. Nếu muốn gửi kế hoạch mới, thành viên cần đặt lịch mới và ghi chú lý do.' });
          }
          // Cho phép gửi lại nếu có booking mới với note
        }
        // Gán kế hoạch cho user
        await sql.query`
          INSERT INTO CoachSuggestedQuitPlans (CoachId, UserId, Title, Description, PlanDetail, StartDate, TargetDate)
          VALUES (${coachId}, ${userId}, ${template.Title}, ${template.Description}, ${template.PlanDetail}, ${startDate}, ${targetDate})
        `;
        res.status(201).json({ message: 'Đã gán kế hoạch cho thành viên!' });
      } catch (error) {
        res.status(500).json({ message: 'Lỗi khi gán kế hoạch.', error: error.message });
      }
    }
};

module.exports = coachController;
