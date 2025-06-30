const { sql } = require('../db');

// Test endpoint to check database connection
exports.testConnection = async (req, res) => {
  try {
    console.log('[testConnection] Testing database connection...');
    const result = await sql.query`SELECT 1 as test`;
    console.log('[testConnection] Database connection successful:', result.recordset);
    res.json({ message: 'Database connection successful', data: result.recordset });
  } catch (error) {
    console.error('[testConnection] Database connection failed:', error);
    res.status(500).json({ message: 'Database connection failed', error: error.message });
  }
};

// Get user's daily smoking log
exports.getDailyLog = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await sql.query`
      SELECT * FROM SmokingDailyLog WHERE UserId = ${userId} ORDER BY LogDate DESC
    `;
    const logs = result.recordset.map(log => ({
      id: log.Id,
      userId: log.UserId,
      progressId: log.ProgressId,
      logDate: log.LogDate,
      cigarettes: log.Cigarettes,
      feeling: log.Feeling
    }));
    res.json(logs);
  } catch (error) {
    console.error('Get daily log error:', error);
    res.status(500).json({ message: 'Failed to get daily log', error: error.message });
  }
};

// Add daily smoking log entry
exports.addDailyLog = async (req, res) => {
  try {
    console.log('[addDailyLog] Received request:', {
      userId: req.user.id,
      body: req.body,
      headers: req.headers.authorization ? 'Token present' : 'No token'
    });

    const userId = req.user.id;
    let { cigarettes, feeling, logDate, planId, suggestedPlanId } = req.body;
    
    console.log('[addDailyLog] Parsed data:', { userId, cigarettes, feeling, logDate, planId, suggestedPlanId });
    
    if (typeof cigarettes !== 'number') {
      console.log('[addDailyLog] Invalid cigarettes type:', typeof cigarettes, cigarettes);
      return res.status(400).json({ message: 'Cigarettes is required and must be a number' });
    }

    // Nếu không có planId hoặc suggestedPlanId, tự động xác định
    if (!planId && !suggestedPlanId) {
      console.log('[addDailyLog] No planId or suggestedPlanId provided, auto-detecting...');
      
      // Kiểm tra user có kế hoạch tự tạo không
      const customPlanResult = await sql.query`
        SELECT TOP 1 Id FROM QuitPlans 
        WHERE UserId = ${userId} 
        ORDER BY CreatedAt DESC
      `;
      
      if (customPlanResult.recordset.length > 0) {
        planId = customPlanResult.recordset[0].Id;
        console.log('[addDailyLog] Found custom plan ID:', planId);
      } else {
        // Nếu không có kế hoạch tự tạo, kiểm tra kế hoạch mẫu
        const suggestedPlanResult = await sql.query`
          SELECT TOP 1 SuggestedPlanId FROM UserSuggestedQuitPlans 
          WHERE UserId = ${userId} 
          ORDER BY CreatedAt DESC
        `;
        
        if (suggestedPlanResult.recordset.length > 0) {
          suggestedPlanId = suggestedPlanResult.recordset[0].SuggestedPlanId;
          console.log('[addDailyLog] Found suggested plan ID:', suggestedPlanId);
        }
      }
    }

    console.log('[addDailyLog] Final plan IDs:', { planId, suggestedPlanId });

    const currentDate = logDate || new Date().toISOString().slice(0, 10);
    
    // Check if log entry already exists for this date
    const existingLog = await sql.query`
      SELECT Id FROM SmokingDailyLog 
      WHERE UserId = ${userId} AND LogDate = ${currentDate}
    `;

    let logId;
    if (existingLog.recordset.length > 0) {
      // Update existing log
      logId = existingLog.recordset[0].Id;
      console.log('[addDailyLog] Updating existing log with ID:', logId);
      await sql.query`
        UPDATE SmokingDailyLog 
        SET Cigarettes = ${cigarettes}, 
            Feeling = ${feeling || ''}, 
            PlanId = ${planId || null}, 
            SuggestedPlanId = ${suggestedPlanId || null}
        WHERE Id = ${logId}
      `;
    } else {
      // Insert new log
      console.log('[addDailyLog] Inserting new log for date:', currentDate);
      const result = await sql.query`
        INSERT INTO SmokingDailyLog (UserId, Cigarettes, Feeling, LogDate, PlanId, SuggestedPlanId)
        VALUES (${userId}, ${cigarettes}, ${feeling || ''}, ${currentDate}, ${planId || null}, ${suggestedPlanId || null});
        SELECT SCOPE_IDENTITY() AS Id;
      `;
      logId = result.recordset[0].Id;
      console.log('[addDailyLog] Inserted new log with ID:', logId);
    }

    // Check for badge achievements based on smoking progress
    const newBadges = [];
    let currentStreak = 0;
    try {
      // Get consecutive days without smoking (streak calculation)
      const recentLogs = await sql.query`
        SELECT Cigarettes, LogDate FROM SmokingDailyLog 
        WHERE UserId = ${userId} 
        ORDER BY LogDate DESC
      `;
      console.log('[DEBUG] recentLogs:', recentLogs.recordset);
      for (const log of recentLogs.recordset) {
        if (Number(log.Cigarettes) === 0) {
          currentStreak++;
        } else {
          break;
        }
      }
      console.log('[DEBUG] currentStreak:', currentStreak);
      // Award badges based on streak
      const streakChecks = [
        { days: 60, badgeId: 7 },
        { days: 30, badgeId: 6 },
        { days: 14, badgeId: 5 },
        { days: 7, badgeId: 4 },
        { days: 5, badgeId: 3 },
        { days: 3, badgeId: 2 },
        { days: 1, badgeId: 1 }
      ];
      for (const check of streakChecks) {
        if (currentStreak >= check.days) {
          // Check if user already has this badge
          const existingBadge = await sql.query`
            SELECT Id FROM UserBadges 
            WHERE UserId = ${userId} AND BadgeId = ${check.badgeId}
          `;
          console.log(`[DEBUG] Checking badgeId ${check.badgeId} for userId ${userId}:`, existingBadge.recordset);
          if (existingBadge.recordset.length === 0) {
            // Get badge info from Badges table
            const badgeInfo = await sql.query`
              SELECT Name, Description FROM Badges WHERE Id = ${check.badgeId}
            `;
            if (badgeInfo.recordset.length > 0) {
              // Award the badge
              await sql.query`
                INSERT INTO UserBadges (UserId, BadgeId, AwardedAt)
                VALUES (${userId}, ${check.badgeId}, GETDATE())
              `;
              console.log(`[DEBUG] Awarded badgeId ${check.badgeId} to userId ${userId}`);
              newBadges.push({
                Name: badgeInfo.recordset[0].Name,
                Description: badgeInfo.recordset[0].Description,
                AwardedAt: new Date()
              });
            }
          }
        }
      }
    } catch (badgeError) {
      console.error('[addDailyLog] Error processing badges:', badgeError);
      // Continue without badges - not critical for daily log functionality
    }

    res.status(201).json({
      message: 'Daily log entry saved successfully',
      success: true,
      logEntry: {
        id: logId,
        userId,
        cigarettes,
        feeling: feeling || '',
        logDate: currentDate
      },
      currentStreak,
      newBadges: newBadges.length > 0 ? newBadges : undefined
    });
  } catch (error) {
    console.error('Add daily log error:', error);
    res.status(500).json({ message: 'Failed to add daily log', error: error.message });
  }
}; 