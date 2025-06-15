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
    // Lấy thông tin user
    const userResult = await sql.query`
      SELECT Id, Username, Email, PhoneNumber, Address, Role, IsMember, CreatedAt, CoachId
      FROM Users WHERE Id = ${userId}
    `;
    if (userResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
    const user = userResult.recordset[0];

    // Lấy thông tin hút thuốc
    const smokingResult = await sql.query`
      SELECT cigarettesPerDay, costPerPack, smokingFrequency, healthStatus, QuitReason, cigaretteType
      FROM SmokingProfiles WHERE UserId = ${userId}
    `;
    const dbSmoking = smokingResult.recordset[0];

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

    const smokingStatus = dbSmoking ? {
      cigarettesPerDay: dbSmoking.cigarettesPerDay || 0,
      costPerPack: dbSmoking.costPerPack || 0,
      smokingFrequency: dbSmoking.smokingFrequency || '',
      healthStatus: dbSmoking.healthStatus || '',
      quitReason: dbSmoking.QuitReason || '',
      cigaretteType: dbSmoking.cigaretteType || '',
      dailyLog
    } : {
      cigarettesPerDay: 0,
      costPerPack: 0,
      smokingFrequency: '',
      healthStatus: '',
      quitReason: '',
      cigaretteType: '',
      dailyLog
    };

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
      coachId: user.CoachId
    });
  } catch (error) {
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

// Cập nhật tình trạng hút thuốc
exports.updateSmokingStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      cigarettesPerDay,
      costPerPack,
      smokingFrequency,
      healthStatus,
      cigaretteType,
      quitReason
    } = req.body;

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
          cigaretteType = ${cigaretteType},
          QuitReason = ${quitReason}
        WHERE UserId = ${userId}
      `;
    } else {
      // Tạo bản ghi mới nếu chưa tồn tại
      await sql.query`
        INSERT INTO SmokingProfiles (UserId, cigarettesPerDay, costPerPack, smokingFrequency, healthStatus, cigaretteType, QuitReason)
        VALUES (${userId}, ${cigarettesPerDay}, ${costPerPack}, ${smokingFrequency}, ${healthStatus}, ${cigaretteType}, ${quitReason})
      `;
    }

    res.status(200).json({ message: 'Tình trạng hút thuốc đã được cập nhật thành công' });
  } catch (error) {
    console.error('Update smoking status error:', error);
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
    const { startDate, targetDate, planType, initialCigarettes, dailyReduction, milestones, planDetail } = req.body;

    if (!startDate || !targetDate || !planType || initialCigarettes === undefined || dailyReduction === undefined) {
      return res.status(400).json({ message: 'Missing required quit plan fields' });
    }

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
          PlanDetail = ${planDetail}
        WHERE UserId = ${userId}
      `;
      res.status(200).json({ message: 'Kế hoạch cai thuốc đã được cập nhật thành công!' });
    } else {
      // Create new plan
      await sql.query`
        INSERT INTO QuitPlans (UserId, StartDate, TargetDate, PlanType, InitialCigarettes, DailyReduction, Milestones, CurrentProgress, PlanDetail)
        VALUES (${userId}, ${startIso}, ${targetIso}, ${planType}, ${initialCigarettes}, ${dailyReduction}, ${JSON.stringify(milestones)}, 0, ${planDetail})
      `;
      res.status(201).json({ message: 'Kế hoạch cai thuốc đã được tạo thành công!' });
    }
  } catch (error) {
    console.error('Error creating or updating quit plan:', error);
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
        initialCigarettes: plan.InitialCigarettes,
        dailyReduction: plan.DailyReduction,
        milestones: JSON.parse(plan.Milestones || '[]'), // Ensure milestones is an array
        currentProgress: plan.CurrentProgress,
        planDetail: plan.PlanDetail || '',
      }
    });
  } catch (error) {
    console.error('Error getting quit plan:', error);
    res.status(500).json({ message: 'Failed to get quit plan', error: error.message });
  }
};

// Thêm nhật ký tiến trình
exports.addProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { cigarettes, moneySpent, note, planId } = req.body;

    console.log('Add Progress Request Body:', req.body);
    console.log('User ID for addProgress:', userId);

    if (cigarettes === undefined || moneySpent === undefined) {
      return res.status(400).json({ message: 'Số điếu và số tiền là bắt buộc' });
    }

    // Lấy ngày hiện tại ở định dạng YYYY-MM-DD
    const today = new Date().toISOString().slice(0, 10);

    // Kiểm tra xem đã có bản ghi cho ngày hôm nay chưa
    const existingLog = await sql.query`
      SELECT Id FROM Progress WHERE UserId = ${userId} AND CONVERT(DATE, Date) = ${today}
    `;

    if (existingLog.recordset.length > 0) {
      // Nếu có, cập nhật bản ghi hiện có
      await sql.query`
        UPDATE Progress
        SET Cigarettes = ${cigarettes}, MoneySpent = ${moneySpent}, Note = ${note || null}, PlanId = ${planId}
        WHERE Id = ${existingLog.recordset[0].Id}
      `;
    } else {
      // Nếu chưa có, tạo bản ghi mới
      await sql.query`
        INSERT INTO Progress (UserId, Date, Cigarettes, MoneySpent, Note, PlanId)
        VALUES (${userId}, GETDATE(), ${cigarettes}, ${moneySpent}, ${note || null}, ${planId})
      `;
    }

    res.status(200).json({ message: 'Nhật ký tiến độ đã được cập nhật thành công' });
  } catch (error) {
    console.error('Error adding progress:', error);
    console.error('Error stack for addProgress:', error.stack);
    res.status(500).json({ message: 'Lỗi khi lưu nhật ký tiến độ', error: error.message });
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