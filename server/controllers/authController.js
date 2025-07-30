const jwt = require('jsonwebtoken');
const { sql } = require('../db');
const SECRET_KEY = process.env.JWT_SECRET || 'your-super-secret-key';

// Đăng ký
exports.register = async (req, res) => {
  console.log('Register payload:', req.body);
  try {
    const { username, email, password, phoneNumber, address, role } = req.body;
    if (!username || !email || !password || !phoneNumber || !address) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if email is verified first
    const otpCheck = await sql.query`
      SELECT Id FROM OTPVerification 
      WHERE Email = ${email} AND IsUsed = 1
      ORDER BY CreatedAt DESC
    `;
    
    if (otpCheck.recordset.length === 0) {
      return res.status(400).json({ 
        message: 'Email chưa được xác thực. Vui lòng xác thực email trước khi đăng ký.',
        requireOTP: true 
      });
    }

    // Check if email or username already exists
    const check = await sql.query`
      SELECT * FROM Users WHERE Email = ${email} OR Username = ${username}
    `;
    if (check.recordset.length > 0) {
      return res.status(400).json({ message: 'Email hoặc username đã tồn tại' });
    }
    
    let userId;
    if (role === 'coach') {
      // Register coach: pending approval
      const insert = await sql.query`
        INSERT INTO Users (Username, Email, Password, PhoneNumber, Address, Role, IsMemberVip, CreatedAt, CoachId, IsCoachApproved, IsEmailVerified)
        VALUES (${username}, ${email}, ${password}, ${phoneNumber}, ${address}, 'coach', 0, GETDATE(), NULL, 0, 1);
        SELECT SCOPE_IDENTITY() AS Id;
      `;
      userId = insert.recordset[0].Id;
      // Initialize SmokingProfiles for coach (optional)
      await sql.query`
        INSERT INTO SmokingProfiles (UserId, cigarettesPerDay, costPerPack, smokingFrequency, healthStatus, cigaretteType, QuitReason)
        VALUES (${userId}, 0, 0, '', '', '', '')
      `;
      return res.status(201).json({ message: 'Đăng ký tài khoản huấn luyện viên thành công! Vui lòng chờ admin xác nhận.' });
    } else {
      // Register member as usual
      const insert = await sql.query`
        INSERT INTO Users (Username, Email, Password, PhoneNumber, Address, Role, IsMemberVip, CreatedAt, CoachId, IsEmailVerified)
        VALUES (${username}, ${email}, ${password}, ${phoneNumber}, ${address}, 'member', 0, GETDATE(), NULL, 1);
        SELECT SCOPE_IDENTITY() AS Id;
      `;
      userId = insert.recordset[0].Id;
      await sql.query`
        INSERT INTO SmokingProfiles (UserId, cigarettesPerDay, costPerPack, smokingFrequency, healthStatus, cigaretteType, QuitReason)
        VALUES (${userId}, 0, 0, '', '', '', '')
      `;
      // Get newly created user info
      const userResult = await sql.query`SELECT * FROM Users WHERE Id = ${userId}`;
      const user = userResult.recordset[0];
      // Create token
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
          coachId: user.CoachId,
          isEmailVerified: user.IsEmailVerified
        }
      });
    }
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
};;

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
    // Nếu là coach và chưa được duyệt
    if (user.Role === 'coach' && user.IsCoachApproved === false) {
      return res.status(403).json({ message: 'Tài khoản huấn luyện viên chưa được admin duyệt.' });
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

    // Lấy huy hiệu của người dùng
    const badgesResult = await sql.query`
      SELECT b.Id, b.Name, b.Description, ub.AwardedAt
      FROM UserBadges ub
      JOIN Badges b ON ub.BadgeId = b.Id
      WHERE ub.UserId = ${userId}
      ORDER BY ub.AwardedAt DESC
    `;
    const achievements = badgesResult.recordset;

    // Lấy thông tin hút thuốc
    const smokingResult = await sql.query`
      SELECT cigarettesPerDay, costPerPack, smokingFrequency, healthStatus, QuitReason, cigaretteType, customCigaretteType
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
          feeling: progressResult.recordset[0].Feeling || '',
          savedMoney: progressResult.recordset[0].SavedMoney || 0
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
          feeling: progressResult.recordset[0].Feeling || '',
          savedMoney: progressResult.recordset[0].SavedMoney || 0
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
      customCigaretteType: dbSmoking.customCigaretteType || '',
      dailyLog // This is fine as it's merged later
    } : {
      cigarettesPerDay: 0,
      costPerPack: 0,
      smokingFrequency: '',
      healthStatus: '',
      quitReason: '',
      cigaretteType: '',
      customCigaretteType: '',
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
      currentUserSuggestedPlan,
      achievements
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
      customCigaretteType = '',
      quitReason = ''
    } = req.body;


    // Xác định giá trị lưu vào DB
    let dbCigaretteType = cigaretteType;
    let dbCustomCigaretteType = null;
    if (cigaretteType === 'other' || cigaretteType === 'Khác') {
      dbCigaretteType = 'Khác';
      dbCustomCigaretteType = customCigaretteType;
    } else {
      dbCustomCigaretteType = null;
    }

    console.log(`[updateSmokingStatus] Received data for userId ${userId}:`, {
      cigarettesPerDay, costPerPack, smokingFrequency, healthStatus, cigaretteType, customCigaretteType, quitReason
    }); // DEBUG: Log the final processed values

    // Kiểm tra xem đã có bản ghi SmokingProfiles cho người dùng này chưa
    const existingProfile = await sql.query`
      SELECT * FROM SmokingProfiles WHERE UserId = ${userId}
    `;
    if (existingProfile.recordset.length > 0) {
      // Cập nhật bản ghi hiện có
      await sql.query`
        UPDATE SmokingProfiles
        SET
          cigarettesPerDay = ${cigarettesPerDay},
          costPerPack = ${costPerPack},
          smokingFrequency = ${smokingFrequency},
          healthStatus = ${healthStatus},
          cigaretteType = ${dbCigaretteType},
          CustomCigaretteType = ${dbCustomCigaretteType},
          QuitReason = ${quitReason}
        WHERE UserId = ${userId}
      `;
    } else {
      // Tạo bản ghi mới nếu chưa tồn tại
      await sql.query`
        INSERT INTO SmokingProfiles (UserId, cigarettesPerDay, costPerPack, smokingFrequency, healthStatus, cigaretteType, CustomCigaretteType, QuitReason)
        VALUES (
          ${userId},
          ${cigarettesPerDay},
          ${costPerPack},
          ${smokingFrequency},
          ${healthStatus},
          ${dbCigaretteType},
          ${dbCustomCigaretteType},
          ${quitReason}
        )
      `;
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
    let { startDate, targetDate, planDetail, initialCigarettes, dailyReduction } = req.body;

    if (!startDate || !targetDate) {
      return res.status(400).json({ message: 'Missing required quit plan fields (startDate, targetDate)' });
    }

    initialCigarettes = initialCigarettes === undefined || initialCigarettes === null ? 0 : Number(initialCigarettes);
    dailyReduction = dailyReduction === undefined || dailyReduction === null ? 0 : Number(dailyReduction);

    const startIso = new Date(startDate).toISOString();
    const targetIso = new Date(targetDate).toISOString();

    const existingPlan = await sql.query`
      SELECT Id FROM QuitPlans WHERE UserId = ${userId}
    `;

    if (existingPlan.recordset.length > 0) {
      await sql.query`
        UPDATE QuitPlans
        SET 
          StartDate = ${startIso}, 
          TargetDate = ${targetIso}, 
          InitialCigarettes = ${initialCigarettes}, 
          DailyReduction = ${dailyReduction},
          PlanDetail = ${planDetail || null}
        WHERE UserId = ${userId}
      `;
      res.status(200).json({ message: 'Kế hoạch cai thuốc đã được cập nhật thành công!' });
    } else {
      await sql.query`
        INSERT INTO QuitPlans (UserId, StartDate, TargetDate, PlanDetail, InitialCigarettes, DailyReduction, CreatedAt)
        VALUES (${userId}, ${startIso}, ${targetIso}, ${planDetail || null}, ${initialCigarettes}, ${dailyReduction}, GETDATE())
      `;
      res.status(201).json({ message: 'Kế hoạch cai thuốc đã được tạo thành công!' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Failed to save quit plan', error: error.message });
  }
};

// Lấy kế hoạch cai thuốc
exports.getQuitPlan = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Check for custom quit plan
    const customPlanResult = await sql.query`
      SELECT *, 'custom' as planType, NULL as Title, NULL as Description FROM QuitPlans WHERE UserId = ${userId} ORDER BY CreatedAt DESC
    `;

    // 2. Check for user-selected suggested plan
    const userSuggestedPlanResult = await sql.query`
      SELECT 
        usp.Id, 
        usp.StartDate, 
        usp.TargetDate, 
        sp.Title, 
        sp.Description, 
        sp.PlanDetail, 
        usp.CreatedAt,
        'suggested' as planType,
        NULL as InitialCigarettes,
        NULL as DailyReduction
      FROM UserSuggestedQuitPlans usp
      JOIN SuggestedQuitPlans sp ON usp.SuggestedPlanId = sp.Id
      WHERE usp.UserId = ${userId}
      ORDER BY usp.CreatedAt DESC
    `;

    // 3. Check for coach-assigned plan
    const coachPlanResult = await sql.query`
      SELECT *, 'coach' as planType FROM CoachSuggestedQuitPlans WHERE UserId = ${userId} AND Status = 'accepted' ORDER BY CreatedAt DESC
    `;

    const allPlans = [
      ...customPlanResult.recordset,
      ...userSuggestedPlanResult.recordset,
      ...coachPlanResult.recordset
    ];

    if (allPlans.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy kế hoạch cai thuốc' });
    }

    // Sort all plans by CreatedAt date in descending order and take the latest one
    allPlans.sort((a, b) => new Date(b.CreatedAt) - new Date(a.CreatedAt));
    const latestPlan = allPlans[0];

    const startDate = new Date(latestPlan.StartDate);
    const targetDate = new Date(latestPlan.TargetDate);
    const today = new Date();
    const totalDurationMs = targetDate.getTime() - startDate.getTime();
    const elapsedDurationMs = today.getTime() - startDate.getTime();
    let progressPercentage = 0;

    if (totalDurationMs > 0) {
      progressPercentage = (elapsedDurationMs / totalDurationMs) * 100;
      if (progressPercentage > 100) progressPercentage = 100;
      if (progressPercentage < 0) progressPercentage = 0;
    }

    res.json({
      quitPlan: {
        id: latestPlan.Id,
        startDate: startDate.toISOString().slice(0, 10),
        targetDate: targetDate.toISOString().slice(0, 10),
        initialCigarettes: latestPlan.InitialCigarettes || 0,
        dailyReduction: latestPlan.DailyReduction || 0,
        currentProgress: progressPercentage,
        planDetail: latestPlan.PlanDetail || '',
        createdAt: latestPlan.CreatedAt || null,
        title: latestPlan.Title || 'Custom Plan',
        description: latestPlan.Description || '',
        planType: latestPlan.planType,
      }
    });
  } catch (error) {
    console.error('Error in getQuitPlan:', error);
    res.status(500).json({ message: 'Failed to get quit plan', error: error.message });
  }
};;

// Delete quit plan for the current user (handles both custom and suggested plans)
exports.deleteQuitPlan = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Check if user has a custom quit plan
    const existingCustomPlanResult = await sql.query`
      SELECT Id FROM QuitPlans WHERE UserId = ${userId}
    `;
    
    // Check if user has suggested quit plans
    const existingSuggestedPlansResult = await sql.query`
      SELECT Id, SuggestedPlanId FROM UserSuggestedQuitPlans WHERE UserId = ${userId}
    `;
    
    // Check if user has coach suggested plans
    const existingCoachPlansResult = await sql.query`
      SELECT Id FROM CoachSuggestedQuitPlans WHERE UserId = ${userId}
    `;
    
    const hasCustomPlan = existingCustomPlanResult.recordset.length > 0;
    const hasSuggestedPlans = existingSuggestedPlansResult.recordset.length > 0;
    const hasCoachPlans = existingCoachPlansResult.recordset.length > 0;
    
    if (!hasCustomPlan && !hasSuggestedPlans && !hasCoachPlans) {
      return res.status(404).json({ message: 'Không tìm thấy kế hoạch cai thuốc để xóa' });
    }
    
    // Start transaction to ensure data integrity
    const transaction = new sql.Transaction();
    await transaction.begin();
    
    try {
      let deletedPlansInfo = [];
      
      // Handle custom quit plan deletion
      if (hasCustomPlan) {
        const quitPlanId = existingCustomPlanResult.recordset[0].Id;
        
        // 1. Delete SmokingDailyLog records that reference this specific plan
        await transaction.request()
          .input('planId', sql.Int, quitPlanId)
          .query('DELETE FROM SmokingDailyLog WHERE PlanId = @planId');
        
        // 2. Delete UserStageActivities that are linked through UserQuitPlanStages
        await transaction.request()
          .input('planId', sql.Int, quitPlanId)
          .query(`
            DELETE usa FROM UserStageActivities usa
            INNER JOIN UserQuitPlanStages uqs ON usa.UserQuitPlanStageId = uqs.Id
            WHERE uqs.QuitPlanId = @planId
          `);
        
        // 3. Delete UserQuitPlanStages
        await transaction.request()
          .input('planId', sql.Int, quitPlanId)
          .query('DELETE FROM UserQuitPlanStages WHERE QuitPlanId = @planId');
        
        // 4. Delete the main quit plan
        await transaction.request()
          .input('planId', sql.Int, quitPlanId)
          .query('DELETE FROM QuitPlans WHERE Id = @planId');
        
        deletedPlansInfo.push('kế hoạch tự tạo');
      }
      
      // Handle suggested quit plans deletion
      if (hasSuggestedPlans) {
        // Delete SmokingDailyLog records that reference suggested plans for this user
        await transaction.request()
          .input('userId', sql.Int, userId)
          .query(`
            DELETE sdl FROM SmokingDailyLog sdl
            INNER JOIN UserSuggestedQuitPlans usp ON sdl.SuggestedPlanId = usp.SuggestedPlanId
            WHERE usp.UserId = @userId
          `);
        
        // Delete from UserSuggestedQuitPlans
        await transaction.request()
          .input('userId', sql.Int, userId)
          .query('DELETE FROM UserSuggestedQuitPlans WHERE UserId = @userId');
        
        deletedPlansInfo.push('kế hoạch đề xuất hệ thống');
      }
      
      // Handle coach suggested plans deletion
      if (hasCoachPlans) {
        // Delete SmokingDailyLog records that reference coach plans for this user
        await transaction.request()
          .input('userId', sql.Int, userId)
          .query(`
            DELETE sdl FROM SmokingDailyLog sdl
            INNER JOIN CoachSuggestedQuitPlans csp ON sdl.CoachSuggestedPlanId = csp.Id
            WHERE csp.UserId = @userId
          `);
        
        // Delete from CoachSuggestedQuitPlans
        await transaction.request()
          .input('userId', sql.Int, userId)
          .query('DELETE FROM CoachSuggestedQuitPlans WHERE UserId = @userId');
        
        deletedPlansInfo.push('kế hoạch đề xuất từ huấn luyện viên');
      }
      
      // Delete any remaining SmokingDailyLog records for this user (to be safe)
      await transaction.request()
        .input('userId', sql.Int, userId)
        .query('DELETE FROM SmokingDailyLog WHERE UserId = @userId AND PlanId IS NULL AND SuggestedPlanId IS NULL AND CoachSuggestedPlanId IS NULL');
      
      await transaction.commit();
      
      const deletedPlansText = deletedPlansInfo.join(', ');
      res.json({ 
        message: `Đã xóa thành công: ${deletedPlansText} và tất cả dữ liệu liên quan`,
        deletedPlans: deletedPlansInfo
      });
      
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
    
  } catch (error) {
    console.error('Error deleting quit plan:', error);
    res.status(500).json({ message: 'Lỗi khi xóa kế hoạch cai thuốc', error: error.message });
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
    // Lấy thêm coachSuggestedPlanId từ req.body
    const { cigarettes, note, planId, suggestedPlanId, coachSuggestedPlanId } = req.body;

    console.log('[addProgress] Received Request Body:', { cigarettes, note, planId, suggestedPlanId, coachSuggestedPlanId });
    console.log('[addProgress] User ID:', userId);

    // Xác định điều kiện tìm nhật ký hôm nay
    const today = new Date().toISOString().slice(0, 10); // Format YYYY-MM-DD
    let existingProgress;
    if (coachSuggestedPlanId) {
      existingProgress = await sql.query`
        SELECT Id FROM SmokingDailyLog WHERE UserId = ${userId} AND LogDate = ${today} AND CoachSuggestedPlanId = ${coachSuggestedPlanId}
      `;
    } else if (suggestedPlanId) {
      existingProgress = await sql.query`
        SELECT Id FROM SmokingDailyLog WHERE UserId = ${userId} AND LogDate = ${today} AND SuggestedPlanId = ${suggestedPlanId}
      `;
    } else if (planId) {
      existingProgress = await sql.query`
        SELECT Id FROM SmokingDailyLog WHERE UserId = ${userId} AND LogDate = ${today} AND PlanId = ${planId}
      `;
    } else {
      existingProgress = await sql.query`
        SELECT Id FROM SmokingDailyLog WHERE UserId = ${userId} AND LogDate = ${today}
      `;
    }
    console.log('[addProgress] Existing progress for today:', existingProgress.recordset);

    let progressId;
    if (existingProgress.recordset.length > 0) {
      // Update existing entry
      progressId = existingProgress.recordset[0].Id;
      if (coachSuggestedPlanId) {
        await sql.query`
          UPDATE SmokingDailyLog
          SET Cigarettes = ${cigarettes},
              Feeling = ${note || null},
              CoachSuggestedPlanId = ${coachSuggestedPlanId}
          WHERE Id = ${progressId}
        `;
      } else if (suggestedPlanId) {
        await sql.query`
          UPDATE SmokingDailyLog
          SET Cigarettes = ${cigarettes},
              Feeling = ${note || null},
              SuggestedPlanId = ${suggestedPlanId}
          WHERE Id = ${progressId}
        `;
      } else if (planId) {
        await sql.query`
          UPDATE SmokingDailyLog
          SET Cigarettes = ${cigarettes},
              Feeling = ${note || null},
              PlanId = ${planId}
          WHERE Id = ${progressId}
        `;
      } else {
        await sql.query`
          UPDATE SmokingDailyLog
          SET Cigarettes = ${cigarettes},
              Feeling = ${note || null}
          WHERE Id = ${progressId}
        `;
      }
      console.log('[addProgress] Updated existing progress entry.');
    } else {
      // Insert new entry
      if (coachSuggestedPlanId) {
        const insertResult = await sql.query`
          INSERT INTO SmokingDailyLog (UserId, LogDate, Cigarettes, Feeling, CoachSuggestedPlanId)
          VALUES (${userId}, ${today}, ${cigarettes}, ${note || null}, ${coachSuggestedPlanId});
          SELECT SCOPE_IDENTITY() AS Id;
        `;
        progressId = insertResult.recordset[0].Id;
      } else if (suggestedPlanId) {
        const insertResult = await sql.query`
          INSERT INTO SmokingDailyLog (UserId, LogDate, Cigarettes, Feeling, SuggestedPlanId)
          VALUES (${userId}, ${today}, ${cigarettes}, ${note || null}, ${suggestedPlanId});
          SELECT SCOPE_IDENTITY() AS Id;
        `;
        progressId = insertResult.recordset[0].Id;
      } else if (planId) {
        const insertResult = await sql.query`
          INSERT INTO SmokingDailyLog (UserId, PlanId, LogDate, Cigarettes, Feeling)
          VALUES (${userId}, ${planId}, ${today}, ${cigarettes}, ${note || null});
          SELECT SCOPE_IDENTITY() AS Id;
        `;
        progressId = insertResult.recordset[0].Id;
      } else {
        const insertResult = await sql.query`
          INSERT INTO SmokingDailyLog (UserId, LogDate, Cigarettes, Feeling)
          VALUES (${userId}, ${today}, ${cigarettes}, ${note || null});
          SELECT SCOPE_IDENTITY() AS Id;
        `;
        progressId = insertResult.recordset[0].Id;
      }
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

// API endpoint để lấy huy hiệu của user cụ thể (cho coach)
exports.getUserBadgesByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const coachId = req.user.id;
    
    console.log(`[getUserBadgesByUserId] ========== GET USER BADGES START ==========`);
    console.log(`[getUserBadgesByUserId] Coach ${coachId} requesting badges for user ${userId}`);
    
    // Verify that the coach has access to this user
    console.log(`[getUserBadgesByUserId] Checking coach access to user...`);
    const memberCheck = await sql.query`
      SELECT Id FROM Users 
      WHERE Id = ${userId} AND CoachId = ${coachId}
    `;
    console.log(`[getUserBadgesByUserId] Member check result:`, memberCheck.recordset);
    
    if (memberCheck.recordset.length === 0) {
      console.log(`[getUserBadgesByUserId]  Coach doesn't have access to this user`);
      return res.status(403).json({ message: 'Bạn không có quyền xem huy hiệu của thành viên này' });
    }
    
    console.log(`[getUserBadgesByUserId] Fetching user badges...`);
    const badgesResult = await sql.query`
      SELECT b.*, ub.AwardedAt
      FROM UserBadges ub
      JOIN Badges b ON ub.BadgeId = b.Id
      WHERE ub.UserId = ${userId}
      ORDER BY ub.AwardedAt DESC
    `;
    console.log(`[getUserBadgesByUserId] Badges result:`, badgesResult.recordset);
    console.log(`[getUserBadgesByUserId] Found ${badgesResult.recordset.length} badges for user ${userId}`);
    console.log(`[getUserBadgesByUserId] ========== GET USER BADGES END ==========`);
    
    res.json({ badges: badgesResult.recordset });
  } catch (error) {
    console.error('[getUserBadgesByUserId]  Error getting user badges by userId:', error);
    console.error('[getUserBadgesByUserId] Error stack:', error.stack);
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
      SELECT p.Id, p.Title, p.Content, p.CreatedAt, p.Status, p.BadgeId,
             u.Username AS Author,
             b.Name AS BadgeName, b.Description AS BadgeDescription, b.BadgeType
      FROM Posts p
      JOIN Users u ON p.UserId = u.Id
      LEFT JOIN Badges b ON p.BadgeId = b.Id
      WHERE p.Status = 'published'
      ORDER BY p.CreatedAt DESC
    `;
    res.status(200).json(posts.recordset);
  } catch (error) {
    console.error('Error getting all posts:', error);
    res.status(500).json({ message: 'Failed to retrieve posts', error: error.message });
  }
};

// Lấy bài viết của user hiện tại (bao gồm cả chờ duyệt và đã duyệt)
exports.getUserPosts = async (req, res) => {
  try {
    const userId = req.user.id;
    const posts = await sql.query`
      SELECT p.Id, p.Title, p.Content, p.CreatedAt, p.Status, p.BadgeId,
             u.Username AS Author,
             b.Name AS BadgeName, b.Description AS BadgeDescription, b.BadgeType
      FROM Posts p
      JOIN Users u ON p.UserId = u.Id
      LEFT JOIN Badges b ON p.BadgeId = b.Id
      WHERE p.UserId = ${userId}
      ORDER BY p.CreatedAt DESC
    `;
    res.status(200).json(posts.recordset);
  } catch (error) {
    console.error('Error getting user posts:', error);
    res.status(500).json({ message: 'Failed to retrieve user posts', error: error.message });
  }
};

// Tạo bài đăng Blog mới
exports.createPost = async (req, res) => {
  try {
    const userId = req.user.id; // Lấy userId từ token đã xác thực
    const userRole = req.user.role; // Lấy role từ token
    const { title, content, badgeId } = req.body;

    // Kiểm tra không cho admin tạo bài viết
    if (userRole === 'admin') {
      return res.status(403).json({ message: 'Admin không được phép tạo bài viết.' });
    }

    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }

    // Parse badgeId thành integer nếu có
    let parsedBadgeId = null;
    if (badgeId && badgeId !== '' && badgeId !== 'null' && badgeId !== 'undefined') {
      parsedBadgeId = parseInt(badgeId);
      if (isNaN(parsedBadgeId)) {
        return res.status(400).json({ message: 'BadgeId không hợp lệ.' });
      }
    }

    console.log(`Debug - Raw badgeId: "${badgeId}", Parsed badgeId: ${parsedBadgeId}`);

    // Nếu có badgeId, kiểm tra user có sở hữu huy hiệu đó không
    if (parsedBadgeId) {
      const userBadgeCheck = await sql.query`
        SELECT Id FROM UserBadges 
        WHERE UserId = ${userId} AND BadgeId = ${parsedBadgeId}
      `;
      
      if (userBadgeCheck.recordset.length === 0) {
        return res.status(400).json({ message: 'Bạn không sở hữu huy hiệu này.' });
      }
    }

    console.log(`Creating post with explicit status "pending" for user ${userId}, badgeId: ${parsedBadgeId}`);

    const result = await sql.query`
      INSERT INTO Posts (UserId, Title, Content, BadgeId, Status, CreatedAt)
      VALUES (${userId}, ${title}, ${content}, ${parsedBadgeId}, 'pending', GETDATE());
      SELECT SCOPE_IDENTITY() AS Id;
    `;

    const newPostId = result.recordset[0].Id;
    const newPost = await sql.query`
      SELECT p.Id, p.Title, p.Content, p.CreatedAt, p.Status, p.BadgeId,
             u.Username AS Author,
             b.Name AS BadgeName, b.Description AS BadgeDescription, b.BadgeType
      FROM Posts p
      JOIN Users u ON p.UserId = u.Id
      LEFT JOIN Badges b ON p.BadgeId = b.Id
      WHERE p.Id = ${newPostId}
    `;

    console.log(`Post ${newPostId} created with status: "${newPost.recordset[0].Status}", BadgeId: ${newPost.recordset[0].BadgeId}`);
    console.log('Post data:', JSON.stringify(newPost.recordset[0], null, 2));

    res.status(201).json({ 
      message: 'Bài đăng đã được gửi thành công và đang chờ duyệt!', 
      post: newPost.recordset[0] 
    });
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
    const userRole = req.user.role;
    const { postId } = req.params;
    const { content } = req.body;

    if (userRole === 'admin') {
      return res.status(403).json({ message: 'Admin không được phép bình luận.' });
    }

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
  }
};

// Lấy huy hiệu của user hiện tại
exports.getUserBadges = async (req, res) => {
  try {
    const userId = req.user.id;
    const userBadgesResult = await sql.query`
      SELECT b.Id, b.Name, b.Description, b.BadgeType, b.Requirement, ub.AwardedAt
      FROM UserBadges ub
      JOIN Badges b ON ub.BadgeId = b.Id
      WHERE ub.UserId = ${userId}
      ORDER BY ub.AwardedAt DESC
    `;
    
    res.json({ badges: userBadgesResult.recordset });
  } catch (error) {
    console.error('Error getting user badges:', error);
    res.status(500).json({ message: 'Failed to get user badges', error: error.message });
  }
};

// Thêm hoặc cập nhật kế hoạch mẫu đã chọn của user
exports.createUserSuggestedQuitPlan = async (req, res) => {
  const transaction = new sql.Transaction();
  
  try {
    const userId = req.user.id;
    const { suggestedPlanId, startDate, targetDate } = req.body;
    
    // Begin explicit SQL transaction
    await transaction.begin();

    // 1. Insert into UserSuggestedQuitPlans, capture INSERTED.Id as userSuggestedQuitPlanId
    const userSuggestedPlanResult = await transaction.request()
      .input('UserId', sql.Int, userId)
      .input('SuggestedPlanId', sql.Int, suggestedPlanId)
      .input('StartDate', sql.Date, new Date(startDate))
      .input('TargetDate', sql.Date, new Date(targetDate))
      .query(`
        INSERT INTO UserSuggestedQuitPlans (UserId, SuggestedPlanId, StartDate, TargetDate)
        OUTPUT INSERTED.Id
        VALUES (@UserId, @SuggestedPlanId, @StartDate, @TargetDate)
      `);
    
    const userSuggestedQuitPlanId = userSuggestedPlanResult.recordset[0].Id;

    // 2. Create a QuitPlans record to get quitPlanId for UserQuitPlanStages
    const quitPlanResult = await transaction.request()
      .input('UserId', sql.Int, userId)
      .input('StartDate', sql.Date, new Date(startDate))
      .input('TargetDate', sql.Date, new Date(targetDate))
      .input('Status', sql.NVarChar, 'In Progress')
      .query(`
        INSERT INTO QuitPlans (UserId, StartDate, TargetDate, Status, CreatedAt)
        OUTPUT INSERTED.Id
        VALUES (@UserId, @StartDate, @TargetDate, @Status, GETDATE())
      `);
    
    const quitPlanId = quitPlanResult.recordset[0].Id;

    // 3. Fetch ordered stages via helper (step 3)
    const { getSuggestedQuitPlanStages } = require('../services/quitPlanService');
    const stages = await getSuggestedQuitPlanStages(suggestedPlanId);

    // 4. Loop stages and insert each into UserQuitPlanStages with calculated dates
    const createdStages = [];
    let currentStageStartDate = new Date(startDate);
    
    for (const [index, stage] of stages.entries()) {
      const status = (stage.StageOrder === 1) ? 'In Progress' : 'Not Started';
      
      // Calculate stage end date based on duration (default to 7 days if null)
      const duration = stage.DurationInDays || 7;
      const stageEndDate = new Date(currentStageStartDate);
      stageEndDate.setDate(stageEndDate.getDate() + duration);
      
      const stageResult = await transaction.request()
        .input('QuitPlanId', sql.Int, quitPlanId)
        .input('StageName', sql.NVarChar, stage.StageName)
        .input('Objective', sql.NVarChar, stage.Objective)
        .input('InitialCigarettes', sql.Int, stage.InitialCigarettes)
        .input('TargetCigarettes', sql.Int, stage.TargetCigarettes)
        .input('StartDate', sql.DateTime, currentStageStartDate)
        .input('EndDate', sql.DateTime, stageEndDate)
        .input('Status', sql.NVarChar, status)
        .query(`
          INSERT INTO UserQuitPlanStages (QuitPlanId, StageName, Objective, InitialCigarettes, TargetCigarettes, StartDate, EndDate, Status)
          OUTPUT INSERTED.Id, INSERTED.StageName, INSERTED.Objective, INSERTED.InitialCigarettes, INSERTED.TargetCigarettes, INSERTED.StartDate, INSERTED.EndDate, INSERTED.Status
          VALUES (@QuitPlanId, @StageName, @Objective, @InitialCigarettes, @TargetCigarettes, @StartDate, @EndDate, @Status)
        `);
      
      createdStages.push(stageResult.recordset[0]);
      
      // Set the next stage start date to current stage end date
      currentStageStartDate = new Date(stageEndDate);
    }

    // 5. Commit transaction
    await transaction.commit();
    
    // 6. Respond with success + created stage list
    res.json({ 
      message: 'Lưu kế hoạch mẫu thành công!', 
      userSuggestedQuitPlanId,
      quitPlanId,
      stages: createdStages
    });

  } catch (error) {
    // On error, roll back and return 500
    await transaction.rollback();
    res.status(500).json({ message: 'Lưu kế hoạch mẫu thất bại.', error: error.message });
  }
};;;

// Lấy kế hoạch cai thuốc tự tạo
exports.getCustomQuitPlan = async (req, res) => {
  try {
    const userId = req.user.id;
    const planResult = await sql.query`
      SELECT * FROM QuitPlans WHERE UserId = ${userId} ORDER BY CreatedAt DESC
    `;
    if (planResult.recordset.length === 0) {
      return res.json({ quitPlan: null, message: 'Không có kế hoạch tự tạo' });
    }
    const plan = planResult.recordset[0];
    const quitPlan = {
      id: plan.Id,
      startDate: plan.StartDate ? plan.StartDate.toISOString().slice(0, 10) : null,
      targetDate: plan.TargetDate ? plan.TargetDate.toISOString().slice(0, 10) : null,
      planDetail: plan.PlanDetail,
      initialCigarettes: plan.InitialCigarettes,
      dailyReduction: plan.DailyReduction,
      createdAt: plan.CreatedAt,
      Status: plan.Status,  // Add Status field
      status: plan.Status   // Add both cases for compatibility
    };
    res.json({ quitPlan });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy kế hoạch cai thuốc', error: error.message });
  }
};

// Tạo kế hoạch cai thuốc tự tạo (chỉ cho memberVip)
exports.createQuitPlan = async (req, res) => {
    try {
        const userId = req.user.id;
        const { reason, startDate, endDate, stages, isDraft } = req.body;

        if (!reason || !startDate) {
            return res.status(400).json({ message: 'Vui lòng cung cấp lý do và ngày bắt đầu bỏ thuốc.' });
        }

        const transaction = new sql.Transaction();
        await transaction.begin();

        try {
            // 1. Create a master Quit Plan record
            const quitPlanResult = await transaction.request()
                .input('UserId', sql.Int, userId)
                .input('QuitReason', sql.NVarChar, reason)
                .input('StartDate', sql.Date, new Date(startDate))
                .input('TargetDate', sql.Date, endDate ? new Date(endDate) : null)
                .query(`
                    INSERT INTO QuitPlans (UserId, QuitReason, StartDate, TargetDate, Status)
                    OUTPUT INSERTED.Id
                    VALUES (@UserId, @QuitReason, @StartDate, @TargetDate, N'In Progress');
                `);
            const quitPlanId = quitPlanResult.recordset[0].Id;

            // 2. Create user-specific stages from the request
            for (const [index, stage] of stages.entries()) {
                const status = (index === 0) ? 'In Progress' : 'Not Started';
                await transaction.request()
                    .input('QuitPlanId', sql.Int, quitPlanId)
                    .input('StageName', sql.NVarChar, stage.name)
                    .input('Objective', sql.NVarChar, stage.goal)
                    .input('StartDate', sql.Date, new Date(stage.stageStart))
                    .input('EndDate', sql.Date, new Date(stage.stageEnd))
                    .input('InitialCigarettes', sql.Int, stage.initial)
                    .input('TargetCigarettes', sql.Int, stage.target)
                    .input('Status', sql.NVarChar, status)
                    .query(`
                        INSERT INTO UserQuitPlanStages (QuitPlanId, StageName, Objective, StartDate, EndDate, InitialCigarettes, TargetCigarettes, Status)
                        VALUES (@QuitPlanId, @StageName, @Objective, @StartDate, @EndDate, @InitialCigarettes, @TargetCigarettes, @Status);
                    `);
            }

            await transaction.commit();
            res.status(201).json({ message: `Kế hoạch bỏ thuốc ${stages.length} giai đoạn đã được tạo thành công!`, quitPlanId });

        } catch (error) {
            await transaction.rollback();
            res.status(500).json({ message: 'Lỗi trong quá trình giao dịch', error: error.message });
        }
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi tạo kế hoạch bỏ thuốc', error: error.message });
    }
};

// Enhanced function to handle stage progression based on completion criteria
exports.updateStageProgression = async (req, res) => {
  try {
    const userId = req.user.id;
    const { userQuitPlanStageId, completionCriteria } = req.body;

    // Validate input
    if (!userQuitPlanStageId || !completionCriteria) {
      return res.status(400).json({ message: 'Thiếu thông tin giai đoạn hoặc tiêu chí hoàn thành.' });
    }

    // Get the current stage and quit plan info
    const stageResult = await sql.query`
      SELECT uqs.*, qs.StageOrder, qs.StageName, qp.Id as QuitPlanId
      FROM UserQuitPlanStages uqs
      JOIN QuitPlanStages qs ON uqs.StageId = qs.Id
      JOIN QuitPlans qp ON uqs.QuitPlanId = qp.Id
      WHERE uqs.Id = ${userQuitPlanStageId} AND qp.UserId = ${userId}
    `;

    if (stageResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy giai đoạn này.' });
    }

    const currentStage = stageResult.recordset[0];
    const quitPlanId = currentStage.QuitPlanId;
    const currentOrder = currentStage.StageOrder;

    // Check if stage completion criteria are met
    const isStageComplete = await checkStageCompletionCriteria(currentOrder, completionCriteria);

    if (isStageComplete) {
      const transaction = new sql.Transaction();
      await transaction.begin();

      try {
        // Mark current stage as completed
        await transaction.request()
          .input('UserQuitPlanStageId', sql.Int, userQuitPlanStageId)
          .query('UPDATE UserQuitPlanStages SET Status = N\'Completed\', EndDate = GETDATE() WHERE Id = @UserQuitPlanStageId');

        // If not the last stage, activate the next stage
        if (currentOrder < 6) {
          const nextStageResult = await transaction.request()
            .input('QuitPlanId', sql.Int, quitPlanId)
            .input('NextOrder', sql.Int, currentOrder + 1)
            .query(`
              UPDATE uqs SET Status = N'In Progress', StartDate = GETDATE()
              FROM UserQuitPlanStages uqs
              JOIN QuitPlanStages qs ON uqs.StageId = qs.Id
              WHERE uqs.QuitPlanId = @QuitPlanId AND qs.StageOrder = @NextOrder
            `);
        } else {
          // Mark the entire quit plan as completed
          await transaction.request()
            .input('QuitPlanId', sql.Int, quitPlanId)
            .query('UPDATE QuitPlans SET Status = N\'Completed\', CompletionDate = GETDATE() WHERE Id = @QuitPlanId');
        }

        await transaction.commit();
        res.json({ 
          message: `Giai đoạn ${currentStage.StageName} đã hoàn thành!`, 
          nextStage: currentOrder < 6 ? currentOrder + 1 : null,
          planCompleted: currentOrder === 6
        });

      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    } else {
      res.status(400).json({ message: 'Chưa đạt đủ tiêu chí để hoàn thành giai đoạn này.' });
    }

  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi cập nhật tiến độ giai đoạn', error: error.message });
  }
};

// Helper function to check stage completion criteria
async function checkStageCompletionCriteria(stageOrder, completionCriteria) {
  switch (stageOrder) {
    case 1: // Pre-Contemplation/Assessment
      return completionCriteria.assessmentCompleted && 
             completionCriteria.smokingPatternsRecorded && 
             completionCriteria.triggersIdentified &&
             completionCriteria.readinessScoreThreshold >= 7; // Minimum readiness score
    
    case 2: // Contemplation/Preparation
      return completionCriteria.quitReasonsDocumented &&
             completionCriteria.quitDateSet &&
             completionCriteria.supportPlanCreated &&
             completionCriteria.environmentPrepared;
    
    case 3: // Action/Quit Day
      return completionCriteria.quitDayActivated &&
             completionCriteria.smokeFreeFor24Hours &&
             completionCriteria.copingStrategiesUtilized;
    
    case 4: // Early Maintenance (Days 1-30)
      return completionCriteria.dailyCheckInsCompleted >= 0.8 && // 80% completion
             completionCriteria.cravingsTrendAnalyzed;
    
    case 5: // Extended Maintenance (Days 31-90)
      return completionCriteria.weeklyMilestonesAchieved &&
             completionCriteria.copingSkillsMastered;
    
    case 6: // Long-term Maintenance (Days 91+)
      return completionCriteria.monthlyProgressMaintained &&
             completionCriteria.communityContribution;
    
    default:
      return false;
  }
}

exports.deleteUser = async (req, res) => {
  try {
    const userId = req.user.id;
    await sql.query`
      DELETE FROM Users WHERE Id = ${userId}
    `;
    res.status(200).json({ message: 'Người dùng đã được xóa thành công' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Failed to delete user', error: error.message });
  }
};

exports.getUserBadges = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await sql.query`
      SELECT b.Id, b.Name, b.Description, ub.AwardedAt
      FROM UserBadges ub
      JOIN Badges b ON ub.BadgeId = b.Id
      WHERE ub.UserId = ${userId}
      ORDER BY ub.AwardedAt DESC
    `;
    res.json({ badges: result.recordset });
  } catch (error) {
    console.error('Get user badges error:', error);
    res.status(500).json({ message: 'Failed to get user badges', error: error.message });
  }
};

exports.getCoachSuggestedPlans = async (req, res) => {
  try {
    const userId = req.user.id;
    // Trả về cả pending và accepted
    const result = await sql.query`
      SELECT * FROM CoachSuggestedQuitPlans
      WHERE UserId = ${userId} AND (Status IS NULL OR Status = 'pending' OR Status = 'accepted')
    `;
    res.json({ plans: result.recordset });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy kế hoạch coach đề xuất', error: error.message });
  }
};

exports.acceptCoachPlan = async (req, res) => {
  try {
    const userId = req.user.id;
    const { planId } = req.body;
    // Đánh dấu kế hoạch này là đã xác nhận
    await sql.query`
      UPDATE CoachSuggestedQuitPlans SET Status = 'accepted' WHERE Id = ${planId} AND UserId = ${userId}
    `;
    // (Tuỳ chọn) Copy sang bảng QuitPlans nếu muốn dùng như kế hoạch chính
    res.json({ message: 'Đã xác nhận kế hoạch coach đề xuất!' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi xác nhận kế hoạch', error: error.message });
  }
};

exports.rejectCoachPlan = async (req, res) => {
  try {
    const userId = req.user.id;
    const { planId } = req.body;
    await sql.query`
      UPDATE CoachSuggestedQuitPlans SET Status = 'rejected' WHERE Id = ${planId} AND UserId = ${userId}
    `;
    res.json({ message: 'Đã từ chối kế hoạch coach đề xuất!' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi từ chối kế hoạch', error: error.message });
  }
};

// Simple stage completion for custom stages
exports.completeStage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { userStageId } = req.body;

    if (!userStageId) {
      return res.status(400).json({ message: 'Thiếu thông tin giai đoạn.' });
    }

    // Check if the stage belongs to the user and get stage info
    const stageResult = await sql.query`
      SELECT uqs.*, qp.UserId
      FROM UserQuitPlanStages uqs
      JOIN QuitPlans qp ON uqs.QuitPlanId = qp.Id
      WHERE uqs.Id = ${userStageId} AND qp.UserId = ${userId}
    `;

    if (stageResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy giai đoạn này hoặc bạn không có quyền truy cập.' });
    }

    const currentStage = stageResult.recordset[0];
    
    // Check if stage is already completed
    if (currentStage.Status === 'Completed') {
      return res.status(400).json({ message: 'Giai đoạn này đã được hoàn thành.' });
    }

    // Update stage status to completed
    await sql.query`
      UPDATE UserQuitPlanStages 
      SET Status = 'Completed', EndDate = GETDATE() 
      WHERE Id = ${userStageId}
    `;

    // Find the next stage to activate (if any)
    const nextStageResult = await sql.query`
      SELECT Id FROM UserQuitPlanStages 
      WHERE QuitPlanId = ${currentStage.QuitPlanId} 
        AND Id != ${userStageId} 
        AND Status = 'Not Started'
      ORDER BY Id ASC
    `;

    let nextStageActivated = false;
    if (nextStageResult.recordset.length > 0) {
      const nextStageId = nextStageResult.recordset[0].Id;
      await sql.query`
        UPDATE UserQuitPlanStages 
        SET Status = 'In Progress', StartDate = GETDATE() 
        WHERE Id = ${nextStageId}
      `;
      nextStageActivated = true;
    }

    // Check if all stages are completed
    const remainingStagesResult = await sql.query`
      SELECT COUNT(*) as RemainingCount 
      FROM UserQuitPlanStages 
      WHERE QuitPlanId = ${currentStage.QuitPlanId} 
        AND Status != 'Completed'
    `;

    const allStagesCompleted = remainingStagesResult.recordset[0].RemainingCount === 0;
    
    if (allStagesCompleted) {
      // Mark the entire quit plan as completed
      await sql.query`
        UPDATE QuitPlans 
        SET Status = 'Completed', CompletionDate = GETDATE() 
        WHERE Id = ${currentStage.QuitPlanId}
      `;
    }

    res.json({ 
      message: 'Giai đoạn đã được hoàn thành!',
      stageCompleted: true,
      nextStageActivated,
      planCompleted: allStagesCompleted
    });

  } catch (error) {
    console.error('Complete stage error:', error);
    res.status(500).json({ message: 'Lỗi khi hoàn thành giai đoạn', error: error.message });
  }
};

exports.completeUserQuitPlan = async (req, res) => {
  try {
    const userId = req.user.id;
    const { planId } = req.params;

    // 1. Try to find and complete a custom plan from QuitPlans
    const customPlanResult = await sql.query`
      SELECT * FROM QuitPlans WHERE Id = ${planId} AND UserId = ${userId}
    `;

    if (customPlanResult.recordset.length > 0) {
      const plan = customPlanResult.recordset[0];
      if (plan.Status === 'Completed') {
        return res.status(400).json({ message: 'Kế hoạch này đã được hoàn thành trước đó.' });
      }

      const remainingStagesResult = await sql.query`
        SELECT COUNT(*) as RemainingCount
        FROM UserQuitPlanStages
        WHERE QuitPlanId = ${planId} AND Status != 'Completed'
      `;
      const allStagesCompleted = remainingStagesResult.recordset[0].RemainingCount === 0;

      if (!allStagesCompleted) {
        return res.status(400).json({ message: 'Không phải tất cả các giai đoạn đều đã hoàn thành.' });
      }

      await sql.query`
        UPDATE QuitPlans
        SET Status = 'Completed', CompletionDate = GETDATE()
        WHERE Id = ${planId}
      `;

      return res.json({ message: 'Chúc mừng! Kế hoạch đã được đánh dấu là hoàn thành.', planType: 'custom' });
    }

    // 2. Try to find and complete a user suggested plan
    const userSuggestedPlanResult = await sql.query`
      SELECT * FROM UserSuggestedQuitPlans WHERE Id = ${planId} AND UserId = ${userId}
    `;

    if (userSuggestedPlanResult.recordset.length > 0) {
      await sql.query`
        UPDATE UserSuggestedQuitPlans SET Status = 'Completed' WHERE Id = ${planId}
      `;
      return res.json({ message: 'Chúc mừng! Kế hoạch đã được đánh dấu là hoàn thành.', planType: 'suggested' });
    }

    // 3. Try to find and complete a coach suggested plan
    const coachPlanResult = await sql.query`
      SELECT * FROM CoachSuggestedQuitPlans WHERE Id = ${planId} AND UserId = ${userId}
    `;

    if (coachPlanResult.recordset.length > 0) {
      await sql.query`
        UPDATE CoachSuggestedQuitPlans SET Status = 'Completed' WHERE Id = ${planId}
      `;
      return res.json({ message: 'Chúc mừng! Kế hoạch đã được đánh dấu là hoàn thành.', planType: 'coach' });
    }

    // 4. If no plan was found in any table
    return res.status(404).json({ message: 'Không tìm thấy kế hoạch hoặc bạn không có quyền.' });

  } catch (error) {
    console.error('Complete user quit plan error:', error);
    res.status(500).json({ message: 'Lỗi khi hoàn thành kế hoạch.', error: error.message });
  }
};;

// Xóa kế hoạch cai thuốc (tự tạo, coach gửi, hệ thống đề xuất)
exports.getQuitPlanStages = async (req, res) => {
  try {
    const stages = await sql.query`
      SELECT Id, StageName, StageOrder, Objective, Description
      FROM QuitPlanStages
      ORDER BY StageOrder ASC
    `;
    res.json(stages.recordset);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get quit plan stages', error: error.message });
  }
};

exports.getStageActivities = async (req, res) => {
  try {
    const { stageId } = req.params;
    const activities = await sql.query`
      SELECT Id, ActivityName, ActivityType
      FROM StageActivities
      WHERE StageId = ${stageId}
    `;
    res.json(activities.recordset);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get stage activities', error: error.message });
  }
};

exports.getUserQuitPlan = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('getUserQuitPlan called for userId:', userId);

    // 1. Check for custom quit plan
    const customPlanResult = await sql.query`
      SELECT TOP 1 
        Id, UserId, CoachId, 
        CONVERT(varchar, StartDate, 127) as StartDate, 
        CONVERT(varchar, TargetDate, 127) as TargetDate, 
        PlanDetail, 
        CONVERT(varchar, CreatedAt, 127) as CreatedAt, 
        InitialCigarettes, DailyReduction, CurrentStageId, Status,
        'custom' as planType,
        NULL as Title,
        NULL as Description
      FROM QuitPlans 
      WHERE UserId = ${userId}
      ORDER BY CreatedAt DESC
    `;

    // 2. Check for user-selected suggested plan
    const userSuggestedPlanResult = await sql.query`
      SELECT 
        usp.Id,
        usp.UserId,
        NULL as CoachId,
        CONVERT(varchar, usp.StartDate, 127) as StartDate,
        CONVERT(varchar, usp.TargetDate, 127) as TargetDate,
        sp.PlanDetail,
        CONVERT(varchar, usp.CreatedAt, 127) as CreatedAt,
        NULL as InitialCigarettes,
        NULL as DailyReduction,
        NULL as CurrentStageId,
        'active' as Status,
        'suggested' as planType,
        sp.Title,
        sp.Description
      FROM UserSuggestedQuitPlans usp
      JOIN SuggestedQuitPlans sp ON usp.SuggestedPlanId = sp.Id
      WHERE usp.UserId = ${userId}
      ORDER BY usp.CreatedAt DESC
    `;

    // 3. Check for coach-assigned plan
    const coachPlanResult = await sql.query`
      SELECT TOP 1 
        Id,
        UserId,
        CoachId,
        CONVERT(varchar, StartDate, 127) as StartDate,
        CONVERT(varchar, TargetDate, 127) as TargetDate,
        PlanDetail,
        CONVERT(varchar, CreatedAt, 127) as CreatedAt,
        NULL as InitialCigarettes,
        NULL as DailyReduction,
        NULL as CurrentStageId,
        Status,
        'coach' as planType,
        Title,
        Description
      FROM CoachSuggestedQuitPlans 
      WHERE UserId = ${userId} AND Status = 'accepted'
      ORDER BY CreatedAt DESC
    `;

    const allPlans = [
      ...customPlanResult.recordset,
      ...userSuggestedPlanResult.recordset,
      ...coachPlanResult.recordset
    ];

    if (allPlans.length === 0) {
      return res.status(404).json({ message: 'No quit plan found' });
    }

    // Sort all plans by CreatedAt date and take the latest one
    allPlans.sort((a, b) => new Date(b.CreatedAt) - new Date(a.CreatedAt));
    const latestPlan = allPlans[0];

    let stages = [];
    
    // Get stages based on plan type
    if (latestPlan.planType === 'custom') {
      // Handle both custom stages (StageId = NULL) and standard stages (StageId not NULL)
      const userStagesResult = await sql.query`
        SELECT 
          uqs.Id, 
          uqs.StageId, 
          uqs.Status, 
          CONVERT(varchar, uqs.StartDate, 127) as StartDate, 
          CONVERT(varchar, uqs.EndDate, 127) as EndDate,
          uqs.InitialCigarettes,
          uqs.TargetCigarettes,
          -- Use custom stage info if StageId is NULL, otherwise use standard stage info
          COALESCE(uqs.StageName, qs.StageName) as StageName,
          COALESCE(uqs.Objective, qs.Objective) as Objective,
          qs.StageOrder,
          qs.Description
        FROM UserQuitPlanStages uqs
        LEFT JOIN QuitPlanStages qs ON uqs.StageId = qs.Id
        WHERE uqs.QuitPlanId = ${latestPlan.Id}
        ORDER BY 
          CASE 
            WHEN qs.StageOrder IS NOT NULL THEN qs.StageOrder 
            ELSE uqs.Id 
          END ASC
      `;
      stages = userStagesResult.recordset;
    }
    // For suggested and coach plans, stages are typically handled differently or may not have stages
    // Add stage handling for suggested/coach plans if needed

    const responseData = {
      ...latestPlan,
      stages,
      planType: latestPlan.planType,
      title: latestPlan.Title || 'Custom Plan',
      description: latestPlan.Description || ''
    };

    res.json(responseData);

  } catch (error) {
    console.error('getUserQuitPlan error:', error);
    res.status(500).json({ message: 'Failed to get user quit plan', error: error.message });
  }
};;;;

exports.updateUserStageActivity = async (req, res) => {
  try {
    const { userQuitPlanStageId, activityId, isCompleted } = req.body;
    const result = await sql.query`
        MERGE UserStageActivities AS target
        USING (SELECT ${userQuitPlanStageId} AS UserQuitPlanStageId, ${activityId} AS ActivityId) AS source
        ON (target.UserQuitPlanStageId = source.UserQuitPlanStageId AND target.ActivityId = source.ActivityId)
        WHEN MATCHED THEN
            UPDATE SET IsCompleted = ${isCompleted}, CompletionDate = GETDATE()
        WHEN NOT MATCHED THEN
            INSERT (UserQuitPlanStageId, ActivityId, IsCompleted, CompletionDate)
            VALUES (source.UserQuitPlanStageId, source.ActivityId, ${isCompleted}, GETDATE());
    `;
    res.status(200).json({ message: 'Activity status updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update activity status', error: error.message });
  }
};
