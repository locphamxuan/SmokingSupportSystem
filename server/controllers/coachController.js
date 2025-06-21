const { sql } = require('../db');

const coachController = {
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
            const members = await sql.query`
                WITH RankedBookings AS (
                    SELECT
                        Id, MemberId, CoachId, SlotDate, Slot, Status,
                        ROW_NUMBER() OVER (PARTITION BY MemberId ORDER BY CreatedAt DESC) as rn
                    FROM Booking
                    WHERE Status IN (N'đang chờ xác nhận', N'đã xác nhận', N'đã hủy') AND CoachId = ${coachId}
                )
                SELECT 
                    u.Id, 
                    u.Username, 
                    u.Email, 
                    u.PhoneNumber, 
                    u.CreatedAt,
                    rb.Id AS appointmentId, 
                    rb.SlotDate AS appointmentSlotDate, 
                    rb.Slot AS appointmentSlot,
                    rb.Status AS appointmentStatus
                FROM Users u
                LEFT JOIN RankedBookings rb ON u.Id = rb.MemberId AND rb.rn = 1
                WHERE u.CoachId = ${coachId}
            `;

            // Format the output to match the MemberWithAppointment schema
            const formattedMembers = members.recordset.map(member => ({
                Id: member.Id,
                Username: member.Username,
                Email: member.Email,
                PhoneNumber: member.PhoneNumber,
                CreatedAt: member.CreatedAt,
                appointment: member.appointmentId ? {
                    id: member.appointmentId,
                    memberId: member.Id,
                    coachId: coachId,
                    slotDate: member.appointmentSlotDate,
                    slot: member.appointmentSlot,
                    status: member.appointmentStatus ? member.appointmentStatus.toLowerCase() : null,
                } : null,
            }));

            console.log('[getAssignedMembers] Raw SQL recordset:', JSON.stringify(members.recordset, null, 2));
            console.log('[getAssignedMembers] Formatted members before sending:', JSON.stringify(formattedMembers, null, 2));
            res.json({ members: formattedMembers });
        } catch (error) {
            console.error('Error getting assigned members:', error);
            res.status(500).json({ message: 'Failed to get assigned members', error: error.message });
        }
    },

    getMemberProgress: async (req, res) => {
        try {
            const { memberId } = req.params;
            const coachId = req.user.id;
            console.log(`Fetching progress for member ID: ${memberId} by coach ID: ${coachId}`);

            // Verify if the member is assigned to this coach
            const assignmentCheck = await sql.query`
                SELECT Id FROM Users WHERE Id = ${memberId} AND CoachId = ${coachId}
            `;
            if (assignmentCheck.recordset.length === 0) {
                return res.status(403).json({ message: 'Bạn không có quyền xem tiến trình của thành viên này.' });
            }

            // Get smoking profile
            const smokingProfileResult = await sql.query`
                SELECT cigarettesPerDay, costPerPack, smokingFrequency, healthStatus, QuitReason, cigaretteType
                FROM SmokingProfiles WHERE UserId = ${memberId}
            `;
            const smokingProfile = smokingProfileResult.recordset[0] || null;

            // Get latest progress log
            const latestProgressResult = await sql.query`
                SELECT TOP 1 Id, LogDate as Date, Cigarettes, Feeling as Note
                FROM SmokingDailyLog
                WHERE UserId = ${memberId}
                ORDER BY LogDate DESC
            `;
            const latestProgress = latestProgressResult.recordset[0] || null;

            // Get quit plan
            const quitPlanResult = await sql.query`
                SELECT StartDate, TargetDate, PlanType, InitialCigarettes, DailyReduction, Milestones, CurrentProgress, PlanDetail
                FROM QuitPlans WHERE UserId = ${memberId}
            `;
            const quitPlan = quitPlanResult.recordset[0] ? {
                startDate: quitPlanResult.recordset[0].StartDate ? quitPlanResult.recordset[0].StartDate.toISOString().slice(0, 10) : null,
                targetDate: quitPlanResult.recordset[0].TargetDate ? quitPlanResult.recordset[0].TargetDate.toISOString().slice(0, 10) : null,
                planType: quitPlanResult.recordset[0].PlanType,
                initialCigarettes: quitPlanResult.recordset[0].InitialCigarettes,
                dailyReduction: quitPlanResult.recordset[0].DailyReduction,
                milestones: (() => {
                    try {
                        return JSON.parse(quitPlanResult.recordset[0].Milestones || '[]');
                    } catch (e) {
                        console.error("Error parsing milestones JSON:", e);
                        return []; // Default to empty array if parsing fails
                    }
                })(),
                currentProgress: quitPlanResult.recordset[0].CurrentProgress,
                planDetail: quitPlanResult.recordset[0].PlanDetail,
            } : null;

            res.json({
                smokingProfile: smokingProfile,
                latestProgress: latestProgress,
                quitPlan: quitPlan
            });

        } catch (error) {
            console.error('Error getting member progress:', error);
            res.status(500).json({ message: 'Failed to get member progress', error: error.message });
        }
    }
};

module.exports = coachController;
