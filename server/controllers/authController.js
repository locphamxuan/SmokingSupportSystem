const jwt = require('jsonwebtoken');
const { sql } = require('../db');
const SECRET_KEY = process.env.JWT_SECRET || 'your-super-secret-key';

// Đăng ký
exports.register = async (req, res) => {
  try {
    const { username, email, password, phoneNumber, address } = req.body;
    if (!username || !email || !password || !phoneNumber || !address) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    // Kiểm tra email hoặc username đã tồn tại
    const check = await sql.query`
      SELECT * FROM Users WHERE Email = ${email} OR Username = ${username}
    `;
    if (check.recordset.length > 0) {
      return res.status(400).json({ message: 'Email hoặc username đã tồn tại' });
    }
    // Thêm user mới
    const insert = await sql.query`
      INSERT INTO Users (Username, Email, Password, PhoneNumber, Address, Role, IsMemberVip, CreatedAt, CoachId)
      VALUES (${username}, ${email}, ${password}, ${phoneNumber}, ${address}, 'member', 0, GETDATE(), NULL);
      SELECT SCOPE_IDENTITY() AS Id;
    `;
    const userId = insert.recordset[0].Id;

    // Khởi tạo một bản ghi SmokingProfiles mặc định cho người dùng mới
    await sql.query`
      INSERT INTO SmokingProfiles (UserId, cigarettesPerDay, costPerPack, smokingFrequency, healthStatus, cigaretteType, QuitReason)
      VALUES (${userId}, 0, 0, '', '', '', '')
    `;

    // Lấy thông tin user vừa tạo
    const userResult = await sql.query`SELECT * FROM Users WHERE Id = ${userId}`;
    const user = userResult.recordset[0];
    // Tạo token
    const token = jwt.sign({ userId: user.Id, role: user.Role }, SECRET_KEY, { expiresIn: '24h' });
    res.status(201).json({
      token,
      user: {
        id: user.Id,
        username: user.Username,
        email: user.Email,
        phoneNumber: user.PhoneNumber,
        address: user.Address,
        role: user.Role,
        isMemberVip: user.IsMemberVip,
        createdAt: user.CreatedAt,
        password: user.Password,
        coachId: user.CoachId
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
};

// Đăng nhập
exports.login = async (req, res) => {
  try {
    const { emailOrUsername, password } = req.body;
    if (!emailOrUsername || !password) {
      return res.status(400).json({ message: 'Missing credentials' });
    }
    // Tìm user theo email hoặc username
    const result = await sql.query`
      SELECT * FROM Users WHERE (Email = ${emailOrUsername} OR Username = ${emailOrUsername}) AND Password = ${password}
    `;
    const user = result.recordset[0];
    if (!user) {
      return res.status(401).json({ message: 'Email/tên đăng nhập hoặc mật khẩu không đúng' });
    }
    // Tạo token
    const token = jwt.sign({ userId: user.Id, role: user.Role }, SECRET_KEY, { expiresIn: '24h' });
    res.json({
      token,
      user: {
        id: user.Id,
        username: user.Username,
        email: user.Email,
        phoneNumber: user.PhoneNumber,
        address: user.Address,
        role: user.Role,
        isMemberVip: user.IsMemberVip,
        createdAt: user.CreatedAt,
        password: user.Password,
        coachId: user.CoachId
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
};

// Lấy thông tin người dùng
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`[getProfile] Fetching profile for userId: ${userId}`); // DEBUG

    // Lấy thông tin user
    const userResult = await sql.query`
      SELECT Id, Username, Email, PhoneNumber, Address, Role, IsMemberVip, CreatedAt, CoachId
      FROM Users WHERE Id = ${userId}
    `;
    if (userResult.recordset.length === 0) {
      console.log(`[getProfile] User not found for userId: ${userId}`); // DEBUG
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
    let user = userResult.recordset[0];
    let coach = null;
    let bookingInfo = null;

    if (user.CoachId) {
      const coachResult = await sql.query`SELECT Id, Username, Email FROM Users WHERE Id = ${user.CoachId} AND Role = 'coach'`;
      coach = coachResult.recordset[0] || null;

      // Lấy thông tin đặt lịch sắp tới hoặc đang chờ xác nhận của người dùng với huấn luyện viên này
      const bookingResult = await sql.query`
        SELECT TOP 1 Id, Status, SlotDate, Slot, Note
        FROM Booking
        WHERE MemberId = ${userId} AND CoachId = ${user.CoachId}
          AND Status IN (N'đang chờ xác nhận', N'đã xác nhận')
        ORDER BY SlotDate ASC;
      `;
      if (bookingResult.recordset.length > 0) {
        bookingInfo = bookingResult.recordset[0];
        bookingInfo.bookingStatus = bookingInfo.Status;
        bookingInfo.slotDate = bookingInfo.SlotDate;
        bookingInfo.slot = bookingInfo.Slot;
        bookingInfo.bookingNote = bookingInfo.Note;
      }
    }

    // Lấy thông tin hút thuốc
    const smokingResult = await sql.query`
      SELECT cigarettesPerDay, costPerPack, smokingFrequency, healthStatus, QuitReason, cigaretteType
      FROM SmokingProfiles WHERE UserId = ${userId}
    `;
    const dbSmoking = smokingResult.recordset[0];
    console.log(`[getProfile] SmokingProfiles raw data for userId ${userId}:`, dbSmoking); // DEBUG

    // Thêm hàm lấy SuggestedPlanId hiện tại của user
    async function getCurrentSuggestedPlanId(userId) {
      const result = await sql.query`
        SELECT TOP 1 SuggestedPlanId FROM UserSuggestedQuitPlans WHERE UserId = ${userId} ORDER BY Id DESC
      `;
      return result.recordset.length > 0 ? result.recordset[0].SuggestedPlanId : null;
    }

    let dailyLog = { cigarettes: 0, feeling: '' };
    const today = new Date().toISOString().slice(0, 10);
    const suggestedPlanId = await getCurrentSuggestedPlanId(user.Id);
    if (suggestedPlanId) {
      // Nếu user đang theo kế hoạch mẫu, lấy nhật ký theo SuggestedPlanId
      const progressResult = await sql.query`
        SELECT TOP 1 * FROM SmokingDailyLog WHERE UserId = ${user.Id} AND LogDate = ${today} AND SuggestedPlanId = ${suggestedPlanId}
      `;
      if (progressResult.recordset.length > 0) {
        dailyLog = {
          cigarettes: progressResult.recordset[0].Cigarettes || 0,
          feeling: progressResult.recordset[0].Feeling || ''
        };
      }
    } else {
      // Nếu không, lấy nhật ký theo PlanId (kế hoạch tự tạo)
      const progressResult = await sql.query`
        SELECT TOP 1 * FROM SmokingDailyLog WHERE UserId = ${user.Id} AND LogDate = ${today} AND PlanId IS NOT NULL
      `;
      if (progressResult.recordset.length > 0) {
        dailyLog = {
          cigarettes: progressResult.recordset[0].Cigarettes || 0,
          feeling: progressResult.recordset[0].Feeling || ''
        };
      }
    }
    console.log(`[getProfile] DailyLog data for userId ${userId}:`, dailyLog); // DEBUG


    const smokingStatus = dbSmoking ? {
      cigarettesPerDay: dbSmoking.cigarettesPerDay || 0,
      costPerPack: dbSmoking.costPerPack || 0,
      smokingFrequency: dbSmoking.smokingFrequency || '',
      healthStatus: dbSmoking.healthStatus || '',
      quitReason: dbSmoking.QuitReason || '',
      cigaretteType: dbSmoking.cigaretteType || '',
      dailyLog // This is fine as it's merged later
    } : {
      cigarettesPerDay: 0,
      costPerPack: 0,
      smokingFrequency: '',
      healthStatus: '',
      quitReason: '',
      cigaretteType: '',
      dailyLog
    };

    // Lấy kế hoạch mẫu đã chọn (nếu có)
    const userSuggestedPlanResult = await sql.query(`
      SELECT usp.Id, usp.StartDate, usp.TargetDate, sp.Title, sp.Description, sp.PlanDetail
      FROM UserSuggestedQuitPlans usp
      JOIN SuggestedQuitPlans sp ON usp.SuggestedPlanId = sp.Id
      WHERE usp.UserId = ${user.Id}
      ORDER BY usp.Id DESC
    `);
    let currentUserSuggestedPlan = null;
    if (userSuggestedPlanResult.recordset.length > 0) {
      const plan = userSuggestedPlanResult.recordset[0];
      currentUserSuggestedPlan = {
        id: plan.Id,
        title: plan.Title,
        description: plan.Description,
        planDetail: plan.PlanDetail,
        startDate: plan.StartDate ? plan.StartDate.toISOString().slice(0, 10) : '',
        targetDate: plan.TargetDate ? plan.TargetDate.toISOString().slice(0, 10) : ''
      };
    }

    res.json({
      id: user.Id,
      username: user.Username,
      email: user.Email,
      phoneNumber: user.PhoneNumber,
      address: user.Address,
      role: user.Role,
      isMemberVip: user.IsMemberVip,
      createdAt: user.CreatedAt,
      smokingStatus,
      coachId: user.CoachId,
      coach,
      currentUserSuggestedPlan
    });
  } catch (error) {
    console.error('[getProfile] Failed to get profile:', error); // DEBUG
    res.status(500).json({ message: 'Failed to get profile', error: error.message });
  }
};

// Nâng cấp thành viên
exports.upgradeMember = async (req, res) => {
  try {
    const userId = req.user.id;
    
    console.log('=== UPGRADE MEMBER REQUEST ===');
    console.log('User ID:', userId);
    
    // Kiểm tra user hiện tại
    const checkUser = await sql.query`
      SELECT Id, Username, Email, Role, IsMemberVip FROM Users WHERE Id = ${userId}
    `;
    
    if (checkUser.recordset.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
    
    const currentUser = checkUser.recordset[0];
    console.log('Current user before upgrade:', currentUser);
    
    // Kiểm tra xem user đã là member chưa
    if (currentUser.IsMemberVip === 1 || currentUser.IsMemberVip === true || currentUser.Role === 'memberVip') {
      return res.status(400).json({ message: 'Bạn đã là thành viên Premium rồi!' });
    }
    
    // Cập nhật cả Role và IsMemberVip
    await sql.query`
      UPDATE Users 
      SET 
        IsMemberVip = 1,
        Role = 'memberVip'
      WHERE Id = ${userId}
    `;
    
    console.log('User upgraded successfully');

    // Lấy thông tin user sau khi cập nhật
    const result = await sql.query`
      SELECT * FROM Users WHERE Id = ${userId}
    `;
    const user = result.recordset[0];
    
    console.log('User after upgrade:', {
      id: user.Id,
      username: user.Username,
      email: user.Email,
      phoneNumber: user.PhoneNumber || "",
      address: user.Address || "",
      role: user.Role,
      isMemberVip: user.IsMemberVip,
      createdAt: user.CreatedAt,
      password: user.Password,
      coachId: user.CoachId
    });

    res.json({
      message: 'Nâng cấp lên Premium thành công! Chào mừng bạn đến với cộng đồng Premium.',
      user: {
        id: user.Id,
        username: user.Username,
        email: user.Email,
        phoneNumber: user.PhoneNumber || "",
        address: user.Address || "",
        role: user.Role,
        isMemberVip: user.IsMemberVip,
        createdAt: user.CreatedAt,
        password: user.Password,
        coachId: user.CoachId
      }
    });
  } catch (error) {
    console.error('=== UPGRADE ERROR ===');
    console.error('Error details:', error);
    res.status(500).json({ 
      message: 'Lỗi khi nâng cấp tài khoản',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Đã xảy ra lỗi, vui lòng thử lại sau'
    });
  }
};

// Gửi yêu cầu huấn luyện viên
exports.requestCoach = async (req, res) => {
  try {
    const userId = req.user.id;

    const userResult = await sql.query`
      SELECT IsMemberVip, CoachId FROM Users WHERE Id = ${userId}
    `;
    const user = userResult.recordset[0];

    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
    if (!user.IsMemberVip) {
      return res.status(403).json({ message: 'Bạn cần là thành viên Premium để yêu cầu huấn luyện viên' });
    }
    if (user.CoachId !== null) {
      return res.status(400).json({ message: 'Bạn đã có huấn luyện viên được phân công' });
    }

    // Cập nhật trạng thái người dùng để đánh dấu đã gửi yêu cầu
    // Trong hệ thống này, chúng ta giả định admin sẽ phân công thủ công.
    // Hoặc có thể thêm một bảng Request để theo dõi.
    // Hiện tại, chỉ cần thông báo thành công và admin sẽ xử lý ngoài hệ thống.
    res.status(200).json({ message: 'Yêu cầu huấn luyện viên đã được gửi thành công. Admin sẽ liên hệ bạn sớm.' });
  } catch (error) {
    console.error('Request coach error:', error);
    res.status(500).json({ message: 'Gửi yêu cầu huấn luyện viên thất bại', error: error.message });
  }
};

// Cập nhật tình trạng hút thuốc
exports.updateSmokingStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    // Destructure and ensure strings are not null/undefined from req.body directly
    const {
      cigarettesPerDay = 0, // Default for numbers
      costPerPack = 0,      // Default for numbers
      smokingFrequency = '',
      healthStatus = '',
      cigaretteType = '',
      quitReason = ''
    } = req.body;

    console.log(`[updateSmokingStatus] Received data for userId ${userId}:`, {
      cigarettesPerDay, costPerPack, smokingFrequency, healthStatus, cigaretteType, quitReason
    }); // DEBUG: Log the final processed values

    // Kiểm tra xem đã có bản ghi SmokingProfiles cho người dùng này chưa
    const existingProfile = await sql.query`
      SELECT * FROM SmokingProfiles WHERE UserId = ${userId}
    `;
    console.log(`[updateSmokingStatus] Existing profile found:`, existingProfile.recordset.length > 0); // DEBUG

    if (existingProfile.recordset.length > 0) {
      // Cập nhật bản ghi hiện có
      await sql.query`
        UPDATE SmokingProfiles
        SET
          cigarettesPerDay = ${cigarettesPerDay},
          costPerPack = ${costPerPack},
          smokingFrequency = ${smokingFrequency},
          healthStatus = ${healthStatus},
          cigaretteType = ${cigaretteType},
          QuitReason = ${quitReason}
        WHERE UserId = ${userId}
      `;
      console.log(`[updateSmokingStatus] Executed UPDATE for userId ${userId}.`); // DEBUG
    } else {
      // Tạo bản ghi mới nếu chưa tồn tại
      await sql.query`
        INSERT INTO SmokingProfiles (UserId, cigarettesPerDay, costPerPack, smokingFrequency, healthStatus, cigaretteType, QuitReason)
        VALUES (
          ${userId},
          ${cigarettesPerDay},
          ${costPerPack},
          ${smokingFrequency},
          ${healthStatus},
          ${cigaretteType},
          ${quitReason}
        )
      `;
      console.log(`[updateSmokingStatus] Executed INSERT for userId ${userId}.`); // DEBUG
    }

    res.status(200).json({ message: 'Tình trạng hút thuốc đã được cập nhật thành công' });
  } catch (error) {
    console.error('[updateSmokingStatus] Update smoking status error:', error); // DEBUG
    res.status(500).json({ message: 'Failed to update smoking status', error: error.message });
  }
};

// Cập nhật thông tin người dùng
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { username, email, phoneNumber, address } = req.body;
    if (!username || !email) {
      return res.status(400).json({ message: 'Username và Email không được để trống' });
    }

    // Kiểm tra trùng lặp username/email
    const checkDuplicate = await sql.query`
      SELECT Id FROM Users WHERE (Username = ${username} OR Email = ${email}) AND Id != ${userId}
    `;
    if (checkDuplicate.recordset.length > 0) {
      return res.status(400).json({ message: 'Username hoặc Email đã tồn tại' });
    }

    await sql.query`
      UPDATE Users
      SET Username = ${username}, Email = ${email}, PhoneNumber = ${phoneNumber}, Address = ${address}
      WHERE Id = ${userId}
    `;
    res.status(200).json({ message: 'Thông tin hồ sơ đã được cập nhật thành công' });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Failed to update profile', error: error.message });
  }
};

// Thêm hoặc cập nhật kế hoạch cai thuốc
exports.createOrUpdateQuitPlan = async (req, res) => {
  try {
    const userId = req.user.id;
    let { startDate, targetDate, planType, initialCigarettes, dailyReduction, milestones, planDetail } = req.body;

    // Ensure required fields are present and set default values for optional/nullable fields
    if (!startDate || !targetDate || !planType) {
      return res.status(400).json({ message: 'Missing required quit plan fields (startDate, targetDate, planType)' });
    }

    // Set default values for optional fields
    initialCigarettes = initialCigarettes === undefined || initialCigarettes === null ? 0 : Number(initialCigarettes);
    milestones = Array.isArray(milestones) ? milestones : [];
    dailyReduction = dailyReduction === undefined || dailyReduction === null ? 0 : Number(dailyReduction);

    console.log(`[createOrUpdateQuitPlan] Received data for userId ${userId}:`, { 
      startDate, targetDate, planType, initialCigarettes, dailyReduction, milestones, planDetail 
    }); // DEBUG

    // Convert dates to ISO string for database
    const startIso = new Date(startDate).toISOString();
    const targetIso = new Date(targetDate).toISOString();

    const existingPlan = await sql.query`
      SELECT Id FROM QuitPlans WHERE UserId = ${userId}
    `;

    if (existingPlan.recordset.length > 0) {
      // Update existing plan
      await sql.query`
        UPDATE QuitPlans
        SET 
          StartDate = ${startIso}, 
          TargetDate = ${targetIso}, 
          PlanType = ${planType}, 
          InitialCigarettes = ${initialCigarettes}, 
          DailyReduction = ${dailyReduction},
          Milestones = ${JSON.stringify(milestones)},
          PlanDetail = ${planDetail || null}
        WHERE UserId = ${userId}
      `;
      console.log(`[createOrUpdateQuitPlan] Updated existing quit plan for userId ${userId}.`); // DEBUG
      res.status(200).json({ message: 'Kế hoạch cai thuốc đã được cập nhật thành công!' });
    } else {
      // Create new plan
      await sql.query`
        INSERT INTO QuitPlans (UserId, StartDate, TargetDate, PlanType, InitialCigarettes, DailyReduction, Milestones, CurrentProgress, PlanDetail)
        VALUES (${userId}, ${startIso}, ${targetIso}, ${planType}, ${initialCigarettes}, ${dailyReduction}, ${JSON.stringify(milestones)}, 0, ${planDetail || null})
      `;
      console.log(`[createOrUpdateQuitPlan] Created new quit plan for userId ${userId}.`); // DEBUG
      res.status(201).json({ message: 'Kế hoạch cai thuốc đã được tạo thành công!' });
    }
  } catch (error) {
    console.error('[createOrUpdateQuitPlan] Error creating or updating quit plan:', error); // DEBUG
    res.status(500).json({ message: 'Failed to save quit plan', error: error.message });
  }
};

// Lấy kế hoạch cai thuốc
exports.getQuitPlan = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await sql.query`
      SELECT * FROM QuitPlans WHERE UserId = ${userId}
    `;
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy kế hoạch cai thuốc' });
    }
    const plan = result.recordset[0];

    // Tính toán tiến độ dựa trên ngày
    const startDate = new Date(plan.StartDate);
    const targetDate = new Date(plan.TargetDate);
    const today = new Date();

    const totalDurationMs = targetDate.getTime() - startDate.getTime();
    const elapsedDurationMs = today.getTime() - startDate.getTime();

    let progressPercentage = 0;
    if (totalDurationMs > 0) {
      progressPercentage = (elapsedDurationMs / totalDurationMs) * 100;
      if (progressPercentage > 100) progressPercentage = 100; // Cap at 100%
      if (progressPercentage < 0) progressPercentage = 0; // Ensure not negative
    }

    // Tùy chỉnh tiến độ dựa trên số điếu thuốc giảm nếu có
    if (plan.InitialCigarettes && plan.DailyReduction && plan.DailyReduction > 0) {
        const daysPassed = Math.floor(elapsedDurationMs / (1000 * 60 * 60 * 24));
        const expectedCigarettesToday = Math.max(0, plan.InitialCigarettes - (plan.DailyReduction * daysPassed));

        // Lấy số điếu thuốc thực tế hút hôm nay
        const latestProgressResult = await sql.query`
            SELECT TOP 1 Cigarettes FROM SmokingDailyLog WHERE UserId = ${userId} ORDER BY LogDate DESC
        `;
        const actualCigarettesToday = latestProgressResult.recordset.length > 0 
            ? latestProgressResult.recordset[0].Cigarettes 
            : plan.InitialCigarettes; // Nếu chưa có nhật ký, coi như vẫn hút số ban đầu
        
        // Tính toán độ lệch so với mục tiêu và điều chỉnh phần trăm tiến độ
        // Ví dụ đơn giản: nếu hút ít hơn mục tiêu, tiến độ tăng thêm; nếu hút nhiều hơn, tiến độ giảm
        if (expectedCigarettesToday > 0) {
            const reductionRatio = (expectedCigarettesToday - actualCigarettesToday) / expectedCigarettesToday;
            progressPercentage += (reductionRatio * 20); // Điều chỉnh 20% tùy theo mức độ quan trọng bạn muốn
            progressPercentage = Math.max(0, Math.min(100, progressPercentage)); // Giữ trong khoảng 0-100%
        }
    }

    res.json({
      quitPlan: {
        id: plan.Id,
        startDate: plan.StartDate.toISOString().slice(0, 10), // Format to YYYY-MM-DD
        targetDate: plan.TargetDate.toISOString().slice(0, 10), // Format to YYYY-MM-DD
        planType: plan.PlanType,
        initialCigarettes: plan.InitialCigarettes || 0,
        dailyReduction: plan.DailyReduction || 0,
        milestones: JSON.parse(plan.Milestones || '[]'), // Ensure milestones is an array
        currentProgress: progressPercentage, // Gửi về dưới dạng số nguyên thủy
        planDetail: plan.PlanDetail || '',
        status: plan.Status || 'active', // Ensure status is returned
        createdAt: plan.CreatedAt || null, // Ensure createdAt is returned
      }
    });
  } catch (error) {
    console.error('Error getting quit plan:', error); // DEBUG
    res.status(500).json({ message: 'Failed to get quit plan', error: error.message });
  }
};

// Kiểm tra và trao huy hiệu dựa trên tiến độ
const checkAndAwardBadges = async (userId) => {
  try {
    // Lấy thông tin hồ sơ hút thuốc của người dùng
    const smokingProfileResult = await sql.query`
      SELECT cigarettesPerDay, costPerPack FROM SmokingProfiles WHERE UserId = ${userId}
    `;
    const { cigarettesPerDay: initialCigarettesPerDay, costPerPack } = smokingProfileResult.recordset[0] || { cigarettesPerDay: 0, costPerPack: 0 };

    // Lấy thông tin tiến độ của người dùng
    const progressResult = await sql.query`
      SELECT 
        COUNT(CASE WHEN Cigarettes = 0 THEN 1 END) as daysWithoutSmoking,
        SUM(CASE WHEN Cigarettes < ${initialCigarettesPerDay} THEN (${initialCigarettesPerDay} - Cigarettes) ELSE 0 END) as reducedCigarettes
      FROM SmokingDailyLog 
      WHERE UserId = ${userId}
    `;
    
    const { daysWithoutSmoking, reducedCigarettes } = progressResult.recordset[0];
    const moneySaved = reducedCigarettes * (costPerPack / 20.0);

    console.log(`[checkAndAwardBadges] User ${userId}: daysWithoutSmoking = ${daysWithoutSmoking}, moneySaved = ${moneySaved.toFixed(2)} VND`);
    
    // Lấy danh sách huy hiệu chưa được trao
    const badgesResult = await sql.query`
      SELECT b.* 
      FROM Badges b
      WHERE NOT EXISTS (
        SELECT 1 FROM UserBadges ub 
        WHERE ub.UserId = ${userId} AND ub.BadgeId = b.Id
      )
    `;
    
    const newBadges = [];
    
    // Kiểm tra từng huy hiệu
    for (const badge of badgesResult.recordset) {
      console.log(`[checkAndAwardBadges] Processing badge:`, badge); // Thêm log này
      let shouldAward = false;
      const requirementValue = parseInt(badge.Requirement);

      if (isNaN(requirementValue)) {
        console.warn(`[checkAndAwardBadges] Invalid Requirement for badge ${badge.Name}: ${badge.Requirement}`);
        continue; // Skip this badge if requirement is not a valid number
      }
      
      if (badge.Type === 'days' && daysWithoutSmoking >= requirementValue) {
        shouldAward = true;
        console.log(`[checkAndAwardBadges] Badge '${badge.Name}' (days) met: ${daysWithoutSmoking} >= ${requirementValue}`);
      } else if (badge.Type === 'money' && moneySaved >= requirementValue) {
        shouldAward = true;
        console.log(`[checkAndAwardBadges] Badge '${badge.Name}' (money) met: ${moneySaved.toFixed(2)} >= ${requirementValue}`);
      } else {
        console.log(`[checkAndAwardBadges] Badge '${badge.Name}' not met. Type: ${badge.Type}, Required: ${requirementValue}, Current: ${badge.Type === 'days' ? daysWithoutSmoking : moneySaved.toFixed(2)}`);
      }
      
      if (shouldAward) {
        // Trao huy hiệu
        await sql.query`
          INSERT INTO UserBadges (UserId, BadgeId, AwardedAt)
          VALUES (${userId}, ${badge.Id}, GETDATE())
        `;
        
        // Thêm thông báo
        await sql.query`
          INSERT INTO Notifications (UserId, Message, Type, CreatedAt)
          VALUES (${userId}, ${`Chúc mừng! Bạn đã nhận được huy hiệu "${badge.Name}"!`}, 'badge', GETDATE())
        `;
        
        newBadges.push(badge);
        console.log(`[checkAndAwardBadges] Awarded badge: ${badge.Name}`);
      }
    }
    
    return newBadges;
  } catch (error) {
    console.error('Error checking badges:', error);
    throw error;
  }
};

// Cập nhật hàm addProgress để kiểm tra huy hiệu
exports.addProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { cigarettes, note, planId } = req.body;

    console.log('[addProgress] Received Request Body:', { cigarettes, note, planId });
    console.log('[addProgress] User ID:', userId);

    // Check if there's an existing progress entry for today for this user and plan
    const today = new Date().toISOString().slice(0, 10); // Format YYYY-MM-DD
    const existingProgress = await sql.query`
      SELECT Id FROM SmokingDailyLog WHERE UserId = ${userId} AND LogDate = ${today} AND PlanId = ${planId || null}
    `;
    console.log('[addProgress] Existing progress for today:', existingProgress.recordset);

    let progressId;
    if (existingProgress.recordset.length > 0) {
      // Update existing entry
      progressId = existingProgress.recordset[0].Id;
      await sql.query`
        UPDATE SmokingDailyLog
        SET Cigarettes = ${cigarettes},
            Feeling = ${note || null}
        WHERE Id = ${progressId}
      `;
      console.log('[addProgress] Updated existing progress entry.');
    } else {
      // Insert new entry
      const insertResult = await sql.query`
        INSERT INTO SmokingDailyLog (UserId, PlanId, LogDate, Cigarettes, Feeling)
        VALUES (${userId}, ${planId || null}, ${today}, ${cigarettes}, ${note || null});
        SELECT SCOPE_IDENTITY() AS Id;
      `;
      progressId = insertResult.recordset[0].Id;
      console.log('[addProgress] Inserted new progress entry.');
    }

    // Kiểm tra và trao huy hiệu
    const newBadges = await checkAndAwardBadges(userId);

    res.status(201).json({ 
      message: 'Nhật ký đã được thêm thành công!',
      newBadges: newBadges.length > 0 ? newBadges : undefined
    });

  } catch (error) {
    console.error('[addProgress] Error adding/updating progress:', error);
    res.status(500).json({ message: 'Lỗi khi cập nhật nhật ký.', error: error.message });
  }
};

// Thêm API endpoint để lấy danh sách huy hiệu của người dùng
exports.getUserBadges = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const badgesResult = await sql.query`
      SELECT b.*, ub.AwardedAt
      FROM UserBadges ub
      JOIN Badges b ON ub.BadgeId = b.Id
      WHERE ub.UserId = ${userId}
      ORDER BY ub.AwardedAt DESC
    `;
    
    res.json({ badges: badgesResult.recordset });
  } catch (error) {
    console.error('Error getting user badges:', error);
    res.status(500).json({ message: 'Failed to get user badges', error: error.message });
  }
};

// Lấy danh sách tất cả huấn luyện viên
exports.getAllCoaches = async (req, res) => {
  try {
    const coaches = await sql.query`
      SELECT Id, Username FROM Users WHERE Role = 'coach'
    `;
    res.status(200).json({ coaches: coaches.recordset });
  } catch (error) {
    console.error('Error fetching coaches:', error);
    res.status(500).json({ message: 'Failed to retrieve coaches', error: error.message });
  }
};

// Lấy lịch sử tiến trình hút thuốc
exports.getSmokingProgressHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await sql.query`
      SELECT LogDate as Date, Cigarettes
      FROM SmokingDailyLog
      WHERE UserId = ${userId}
      ORDER BY LogDate ASC
    `;
    res.json({ history: result.recordset });
  } catch (error) {
    console.error('Error getting smoking progress history:', error);
    res.status(500).json({ message: 'Failed to get smoking progress history', error: error.message });
  }
};

// === Blog and Comment Functions ===

// Lấy tất cả các bài đăng Blog
exports.getAllPosts = async (req, res) => {
  try {
    const posts = await sql.query`
      SELECT b.Id, b.Title, b.Content, b.CreatedAt, b.Status, u.Username AS Author
      FROM Posts b
      JOIN Users u ON b.UserId = u.Id
      WHERE b.Status = 'published'
      ORDER BY b.CreatedAt DESC
    `;
    res.status(200).json(posts.recordset);
  } catch (error) {
    console.error('Error getting all posts:', error);
    res.status(500).json({ message: 'Failed to retrieve posts', error: error.message });
  }
};

// Tạo bài đăng Blog mới
exports.createPost = async (req, res) => {
  try {
    const userId = req.user.id; // Lấy userId từ token đã xác thực
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }

    const result = await sql.query`
      INSERT INTO Posts (UserId, Title, Content, Status, CreatedAt)
      VALUES (${userId}, ${title}, ${content}, 'published', GETDATE());
      SELECT SCOPE_IDENTITY() AS Id;
    `;

    const newPostId = result.recordset[0].Id;
    const newPost = await sql.query`
      SELECT b.Id, b.Title, b.Content, b.CreatedAt, b.Status, u.Username AS Author
      FROM Posts b
      JOIN Users u ON b.UserId = u.Id
      WHERE b.Id = ${newPostId}
    `;

    res.status(201).json({ message: 'Bài đăng đã được tạo thành công!', post: newPost.recordset[0] });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ message: 'Failed to create post', error: error.message });
  }
};

// Lấy tất cả bình luận cho một bài đăng cụ thể
exports.getCommentsForPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const comments = await sql.query`
      SELECT c.Id, c.Content, c.CreatedAt, u.Username AS Author
      FROM Comments c
      JOIN Users u ON c.UserId = u.Id
      WHERE c.PostId = ${postId}
      ORDER BY c.CreatedAt ASC
    `;
    res.status(200).json(comments.recordset);
  } catch (error) {
    console.error('Error getting comments for post:', error);
    res.status(500).json({ message: 'Failed to retrieve comments', error: error.message });
  }
};

// Thêm bình luận mới vào bài đăng
exports.addComment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { postId } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ message: 'Content is required' });
    }

    const result = await sql.query`
      INSERT INTO Comments (PostId, UserId, Content, CreatedAt)
      VALUES (${postId}, ${userId}, ${content}, GETDATE());
      SELECT SCOPE_IDENTITY() AS Id;
    `;

    const newCommentId = result.recordset[0].Id;
    const newComment = await sql.query`
      SELECT c.Id, c.Content, c.CreatedAt, u.Username AS Author
      FROM Comments c
      JOIN Users u ON c.UserId = u.Id
      WHERE c.Id = ${newCommentId}
    `;

    res.status(201).json({ message: 'Bình luận đã được thêm thành công!', comment: newComment.recordset[0] });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ message: 'Failed to add comment', error: error.message });
  }
};

// Lấy danh sách kế hoạch mẫu hệ thống (chỉ cho memberVip)
exports.getSuggestedQuitPlans = async (req, res) => {
  try {
    // Bỏ kiểm tra memberVip để ai cũng xem được
    const suggestedPlans = await sql.query`
      SELECT Id, Title, Description, PlanDetail
      FROM SuggestedQuitPlans
      ORDER BY Id ASC
    `;
    res.json(suggestedPlans.recordset);
  } catch (error) {
    console.error('Error getting suggested quit plans:', error);
    res.status(500).json({ message: 'Failed to get suggested quit plans', error: error.message });
  }
};

<<<<<<< HEAD
// Lấy tất cả huy hiệu có trong hệ thống
exports.getAllBadges = async (req, res) => {
  try {
    const badgesResult = await sql.query`
      SELECT Id, Name, Description, BadgeType, Requirement
      FROM Badges
      ORDER BY Id ASC
    `;
    
    res.json({ badges: badgesResult.recordset });
  } catch (error) {
    console.error('Error getting all badges:', error);
    res.status(500).json({ message: 'Failed to get all badges', error: error.message });
=======
// Thêm hoặc cập nhật kế hoạch mẫu đã chọn của user
exports.createUserSuggestedQuitPlan = async (req, res) => {
  try {
    const userId = req.user.id;
    const { suggestedPlanId, startDate, targetDate } = req.body;
    await sql.query`
      INSERT INTO UserSuggestedQuitPlans (UserId, SuggestedPlanId, StartDate, TargetDate)
      VALUES (${userId}, ${suggestedPlanId}, ${startDate}, ${targetDate})
    `;
    res.json({ message: 'Lưu kế hoạch mẫu thành công!' });
  } catch (error) {
    res.status(500).json({ message: 'Lưu kế hoạch mẫu thất bại.', error: error.message });
  }
};

// Trong exports.addDailyLog hoặc addProgress:
exports.addDailyLog = async (req, res) => {
  try {
    const userId = req.user.id;
    const { cigarettes, feeling, logDate, suggestedPlanId, planId } = req.body;
    let useSuggestedPlanId = suggestedPlanId || null;
    let usePlanId = planId || null;
    // Nếu không truyền từ FE thì fallback như cũ
    if (!useSuggestedPlanId && !usePlanId) {
      // Lấy kế hoạch mẫu hiện tại
      const suggestedPlanIdResult = await sql.query`
        SELECT TOP 1 SuggestedPlanId FROM UserSuggestedQuitPlans WHERE UserId = ${userId} ORDER BY Id DESC
      `;
      useSuggestedPlanId = suggestedPlanIdResult.recordset.length > 0 ? suggestedPlanIdResult.recordset[0].SuggestedPlanId : null;
      if (!useSuggestedPlanId) {
        // Nếu không có kế hoạch mẫu, lấy PlanId từ QuitPlans
        const planResult = await sql.query`
          SELECT TOP 1 Id FROM QuitPlans WHERE UserId = ${userId} ORDER BY Id DESC
        `;
        usePlanId = planResult.recordset.length > 0 ? planResult.recordset[0].Id : null;
      }
    }
    // Kiểm tra đã có nhật ký cho ngày này chưa
    const today = logDate || new Date().toISOString().slice(0, 10);
    const existing = await sql.query`
      SELECT Id FROM SmokingDailyLog WHERE UserId = ${userId} AND LogDate = ${today} AND 
        ((SuggestedPlanId IS NOT NULL AND SuggestedPlanId = ${useSuggestedPlanId}) OR (PlanId IS NOT NULL AND PlanId = ${usePlanId}))
    `;
    if (existing.recordset.length > 0) {
      // Update
      await sql.query`
        UPDATE SmokingDailyLog SET Cigarettes = ${cigarettes}, Feeling = ${feeling || ''}
        WHERE Id = ${existing.recordset[0].Id}
      `;
    } else {
      // Insert
      await sql.query`
        INSERT INTO SmokingDailyLog (UserId, LogDate, Cigarettes, Feeling, PlanId, SuggestedPlanId)
        VALUES (${userId}, ${today}, ${cigarettes}, ${feeling || ''}, ${usePlanId}, ${useSuggestedPlanId})
      `;
    }
    res.status(201).json({ message: 'Nhật ký đã được thêm thành công!' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi cập nhật nhật ký.', error: error.message });
>>>>>>> origin/main
  }
};