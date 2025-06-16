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
      INSERT INTO Users (Username, Email, Password, PhoneNumber, Address, Role, IsMember, CreatedAt, CoachId)
      VALUES (${username}, ${email}, ${password}, ${phoneNumber}, ${address}, 'guest', 0, GETDATE(), NULL);
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
        isMember: user.IsMember,
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
        isMember: user.IsMember,
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
      SELECT Id, Username, Email, PhoneNumber, Address, Role, IsMember, CreatedAt, CoachId
      FROM Users WHERE Id = ${userId}
    `;
    if (userResult.recordset.length === 0) {
      console.log(`[getProfile] User not found for userId: ${userId}`); // DEBUG
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
    let user = userResult.recordset[0];
    let coachDetails = null;
    let bookingInfo = null;

    if (user.CoachId) {
      const coachResult = await sql.query`
        SELECT Id, Username FROM Users WHERE Id = ${user.CoachId} AND Role = 'coach'
      `;
      if (coachResult.recordset.length > 0) {
        coachDetails = coachResult.recordset[0];

        // Lấy thông tin đặt lịch sắp tới hoặc đang chờ xác nhận của người dùng với huấn luyện viên này
        const bookingResult = await sql.query`
          SELECT TOP 1 Id, Status, ScheduledTime, Note
          FROM Booking
          WHERE MemberId = ${userId} AND CoachId = ${user.CoachId}
          AND Status IN ('pending', 'confirmed') -- Chỉ lấy lịch hẹn chưa hoàn thành/hủy
          ORDER BY ScheduledTime ASC; -- Lấy lịch hẹn sắp tới (nếu có nhiều)
        `;
        if (bookingResult.recordset.length > 0) {
          bookingInfo = bookingResult.recordset[0];
          // Thêm trạng thái booking vào coachDetails để tiện xử lý ở frontend
          coachDetails.bookingStatus = bookingInfo.Status;
          coachDetails.scheduledTime = bookingInfo.ScheduledTime;
          coachDetails.bookingNote = bookingInfo.Note;
        }
      }
    }

    // Lấy thông tin hút thuốc
    const smokingResult = await sql.query`
      SELECT cigarettesPerDay, costPerPack, smokingFrequency, healthStatus, QuitReason, cigaretteType
      FROM SmokingProfiles WHERE UserId = ${userId}
    `;
    const dbSmoking = smokingResult.recordset[0];
    console.log(`[getProfile] SmokingProfiles raw data for userId ${userId}:`, dbSmoking); // DEBUG

    // Lấy nhật ký hút thuốc mới nhất từ Progress
    let dailyLog = { cigarettes: 0, feeling: '' };
    const progressResult = await sql.query`
      SELECT TOP 1 * FROM Progress WHERE UserId = ${userId} ORDER BY Date DESC
    `;
    if (progressResult.recordset.length > 0) {
      dailyLog = {
        cigarettes: progressResult.recordset[0].Cigarettes || 0,
        feeling: progressResult.recordset[0].Note || ''
      };
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

    console.log(`[getProfile] Final smokingStatus object before sending:`, smokingStatus); // DEBUG

    res.json({
      id: user.Id,
      username: user.Username,
      email: user.Email,
      phoneNumber: user.PhoneNumber,
      address: user.Address,
      role: user.Role,
      isMember: user.IsMember,
      createdAt: user.CreatedAt,
      smokingStatus,
      coach: coachDetails
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
      SELECT Id, Username, Email, Role, IsMember FROM Users WHERE Id = ${userId}
    `;
    
    if (checkUser.recordset.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
    
    const currentUser = checkUser.recordset[0];
    console.log('Current user before upgrade:', currentUser);
    
    // Kiểm tra xem user đã là member chưa
    if (currentUser.IsMember === 1 || currentUser.IsMember === true || currentUser.Role === 'member') {
      return res.status(400).json({ message: 'Bạn đã là thành viên Premium rồi!' });
    }
    
    // Cập nhật cả Role và IsMember
    await sql.query`
      UPDATE Users 
      SET 
        IsMember = 1,
        Role = 'member'
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
      isMember: user.IsMember,
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
        isMember: user.IsMember,
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
      SELECT IsMember, CoachId FROM Users WHERE Id = ${userId}
    `;
    const user = userResult.recordset[0];

    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
    if (!user.IsMember) {
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
    if (!startDate || !targetDate || !planType || initialCigarettes === undefined) {
      return res.status(400).json({ message: 'Missing required quit plan fields (startDate, targetDate, planType, initialCigarettes)' });
    }

    // Ensure milestones is an array and dailyReduction defaults to 0
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
    res.json({
      quitPlan: {
        id: plan.Id,
        startDate: plan.StartDate.toISOString().slice(0, 10), // Format to YYYY-MM-DD
        targetDate: plan.TargetDate.toISOString().slice(0, 10), // Format to YYYY-MM-DD
        planType: plan.PlanType,
        initialCigarettes: plan.InitialCigarettes || 0,
        dailyReduction: plan.DailyReduction || 0,
        milestones: JSON.parse(plan.Milestones || '[]'), // Ensure milestones is an array
        currentProgress: plan.CurrentProgress,
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

// Thêm nhật ký tiến trình
exports.addProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { cigarettes, note, planId } = req.body;

    console.log('[addProgress] Received Request Body:', { cigarettes, note, planId });
    console.log('[addProgress] User ID:', userId);

    // Check if there's an existing progress entry for today for this user and plan
    const today = new Date().toISOString().slice(0, 10); // Format YYYY-MM-DD
    const existingProgress = await sql.query`
      SELECT Id FROM Progress WHERE UserId = ${userId} AND Date = ${today} AND PlanId = ${planId || null}
    `;
    console.log('[addProgress] Existing progress for today:', existingProgress.recordset);

    if (existingProgress.recordset.length > 0) {
      // Update existing entry
      const progressId = existingProgress.recordset[0].Id;
      await sql.query`
        UPDATE Progress
        SET Cigarettes = ${cigarettes},
            Note = ${note || null}
        WHERE Id = ${progressId}
      `;
      console.log('[addProgress] Updated existing progress entry.');
      res.status(200).json({ message: 'Nhật ký đã được cập nhật thành công!' });
    } else {
      // Insert new entry
      await sql.query`
        INSERT INTO Progress (UserId, PlanId, Date, Cigarettes, Note)
        VALUES (${userId}, ${planId || null}, ${today}, ${cigarettes}, ${note || null})
      `;
      console.log('[addProgress] Inserted new progress entry.');
      res.status(201).json({ message: 'Nhật ký đã được thêm thành công!' });
    }

  } catch (error) {
    console.error('[addProgress] Error adding/updating progress:', error);
    res.status(500).json({ message: 'Lỗi khi cập nhật nhật ký.', error: error.message });
  }
};

// Lấy nhật ký tiến trình mới nhất
exports.getLatestProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('Fetching latest progress for user ID:', userId);
    const result = await sql.query`
      SELECT TOP 1 Id, Date, Cigarettes, MoneySpent, Note
      FROM Progress
      WHERE UserId = ${userId}
      ORDER BY Date DESC
    `;
    console.log('Progress query result:', result.recordset);
    if (result.recordset.length === 0) {
      console.log('No progress found for user ID:', userId);
      return res.status(404).json({ message: 'Không tìm thấy nhật ký tiến trình' });
    }
    console.log('Latest progress found:', result.recordset[0]);
    res.json({ progress: result.recordset[0] });
  } catch (error) {
    console.error('Error getting latest progress:', error);
    console.error('Error stack for getLatestProgress:', error.stack);
    res.status(500).json({ message: 'Failed to get latest progress', error: error.message });
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