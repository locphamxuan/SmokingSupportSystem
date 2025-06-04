const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sql } = require('../db');

// Đăng ký
exports.register = async (req, res) => {
  try {
    const { username, email, password, phoneNumber, address } = req.body;
    
    // Kiểm tra dữ liệu đầu vào
    if (!username || !email || !password || !phoneNumber || !address) {
      return res.status(400).json({ 
        message: 'Vui lòng điền đầy đủ thông tin',
        missing: {
          username: !username,
          email: !email,
          password: !password,
          phoneNumber: !phoneNumber,
          address: !address
        }
      });
    }

    // Kiểm tra email hợp lệ
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Email không hợp lệ' });
    }

    // Kiểm tra độ dài mật khẩu
    if (password.length < 6) {
      return res.status(400).json({ message: 'Mật khẩu phải có ít nhất 6 ký tự' });
    }

    // Kiểm tra số điện thoại
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return res.status(400).json({ message: 'Số điện thoại phải có 10 chữ số' });
    }

    // Kiểm tra email và username đã tồn tại
    const check = await sql.query`
      SELECT * FROM Users 
      WHERE Email = ${email} OR Username = ${username}
    `;
    
    if (check.recordset.length > 0) {
      const existingUser = check.recordset[0];
      if (existingUser.Email === email) {
        return res.status(400).json({ message: 'Email đã được sử dụng' });
      }
      if (existingUser.Username === username) {
        return res.status(400).json({ message: 'Tên đăng nhập đã tồn tại' });
      }
    }

    // Lưu password dạng plain text (không mã hóa)
    console.log('📝 Storing password as plain text for user:', username);

    // Thêm người dùng mới với password plain text
    const insertResult = await sql.query`
      INSERT INTO Users (
        Username, 
        Password, 
        Email, 
        PhoneNumber, 
        Address, 
        IsMember,
        Role,
        CreatedAt
      )
      VALUES (
        ${username}, 
        ${password}, 
        ${email}, 
        ${phoneNumber}, 
        ${address}, 
        0,
        'guest',
        GETDATE()
      );
      
      SELECT SCOPE_IDENTITY() AS Id;
    `;

    const userId = insertResult.recordset[0].Id;

    // Lấy thông tin người dùng vừa tạo
    const userResult = await sql.query`
      SELECT * FROM Users WHERE Id = ${userId}
    `;
    const user = userResult.recordset[0];

    // Tạo token
    const token = jwt.sign(
      { 
        userId: user.Id,
        role: user.Role
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    console.log('✅ User registered successfully with plain text password');

    // Trả về thông tin người dùng
    res.status(201).json({
      message: 'Đăng ký thành công',
      token,
      user: {
        id: user.Id,
        username: user.Username,
        email: user.Email,
        phoneNumber: user.PhoneNumber || "",
        address: user.Address || "",
        role: user.Role,
        isMember: user.IsMember
      }
    });
  } catch (error) {
    console.error('Lỗi đăng ký:', error);
    res.status(500).json({ 
      message: 'Lỗi khi đăng ký',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Đã xảy ra lỗi, vui lòng thử lại sau'
    });
  }
};

// Đăng nhập
exports.login = async (req, res) => {
  try {
    console.log('Login request body:', req.body); // Debug log
    const { email, emailOrUsername, password, userType } = req.body;
    const loginField = emailOrUsername || email; // Hỗ trợ cả hai trường
    
    console.log('Login field:', loginField, 'Password provided:', !!password); // Debug log
    
    if (!loginField || !password) {
      console.log('Missing credentials - loginField:', loginField, 'password:', !!password);
      return res.status(400).json({ message: 'Vui lòng nhập email/tên đăng nhập và mật khẩu' });
    }

    // Tìm user bằng email hoặc username
    const result = await sql.query`
      SELECT * FROM Users 
      WHERE Email = ${loginField} OR Username = ${loginField}
    `;
    const user = result.recordset[0];

    console.log('User found:', user ? user.Username : 'No user found');

    if (!user) {
      console.log('User not found for loginField:', loginField);
      return res.status(401).json({ message: 'Email/tên đăng nhập hoặc mật khẩu không đúng' });
    }

    // So sánh mật khẩu - hỗ trợ cả plain text và bcrypt
    let isPasswordValid = false;
    
    // Kiểm tra xem mật khẩu có phải là bcrypt hash không (bắt đầu bằng $2a$, $2b$, $2y$)
    if (user.Password.startsWith('$2a$') || user.Password.startsWith('$2b$') || user.Password.startsWith('$2y$')) {
      // Mật khẩu đã được hash bằng bcrypt
      isPasswordValid = await bcrypt.compare(password, user.Password);
    } else {
      // Mật khẩu plain text (cho tài khoản cũ như admin)
      isPasswordValid = password === user.Password;
    }
    
    if (!isPasswordValid) {
      console.log('Password mismatch!');
      return res.status(401).json({ message: 'Email/tên đăng nhập hoặc mật khẩu không đúng' });
    }

    console.log('Login successful for user:', user.Username);

    const token = jwt.sign(
      { 
        userId: user.Id,
        role: user.Role
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Đăng nhập thành công',
      token,
      user: {
        id: user.Id,
        username: user.Username,
        email: user.Email,
        phoneNumber: user.PhoneNumber || "",
        address: user.Address || "",
        role: user.Role,
        isMember: user.IsMember
      }
    });
  } catch (error) {
    console.error('Lỗi đăng nhập:', error);
    res.status(500).json({ 
      message: 'Lỗi khi đăng nhập',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Đã xảy ra lỗi, vui lòng thử lại sau'
    });
  }
};

// Lấy thông tin người dùng
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    console.log('=== GET PROFILE START ===');
    console.log('Requested User ID:', userId);
    console.log('User ID type:', typeof userId);
    
    // Lấy thông tin user cơ bản
    const userResult = await sql.query`
      SELECT Id, Username, Email, PhoneNumber, Address, Role, IsMember, CreatedAt
      FROM Users WHERE Id = ${userId}
    `;
    
    if (userResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
    
    const user = userResult.recordset[0];
    
    // Lấy smoking profile từ SmokingProfiles table
    const profileResult = await sql.query`
      SELECT cigarettesPerDay, costPerPack, smokingFrequency, healthStatus, cigaretteType, QuitReason
      FROM SmokingProfiles 
      WHERE UserId = ${userId}
    `;
    
    // Lấy daily log hôm nay từ SmokingDailyLog table
    const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
    const dailyLogResult = await sql.query`
      SELECT Cigarettes, Feeling
      FROM SmokingDailyLog 
      WHERE UserId = ${userId} AND LogDate = ${today}
    `;
    
    const profile = profileResult.recordset[0] || {};
    const dailyLog = dailyLogResult.recordset[0] || {};
    
    console.log('=== GET PROFILE DEBUG ===');
    console.log('Found user:', !!user);
    console.log('Found profile:', !!profile.cigarettesPerDay);
    console.log('Found daily log:', !!dailyLog.Cigarettes);
    
    if (user) {
      console.log('User ID from DB:', user.Id);
      console.log('Username:', user.Username);
      console.log('Smoking profile data:', profile);
      console.log('Daily log data:', dailyLog);
    }

    res.json({
      id: user.Id,
      username: user.Username,
      email: user.Email,
      phoneNumber: user.PhoneNumber || "",
      address: user.Address || "",
      role: user.Role,
      isMember: user.IsMember,
      createdAt: user.CreatedAt,
      smokingStatus: {
        cigarettesPerDay: profile.cigarettesPerDay || 0,
        costPerPack: profile.costPerPack || 0,
        smokingFrequency: profile.smokingFrequency || '',
        healthStatus: profile.healthStatus || '',
        cigaretteType: profile.cigaretteType || '',
        quitReason: profile.QuitReason || '',
        dailyLog: {
          cigarettes: dailyLog.Cigarettes || 0,
          feeling: dailyLog.Feeling || ''
        }
      },
      quitPlan: {
        startDate: '',
        targetDate: '',
        planType: '',
        milestones: [],
        currentProgress: 0,
        initialCigarettes: 0,
        dailyReduction: 1
      },
      achievements: []
    });
  } catch (error) {
    console.error('Lỗi lấy thông tin người dùng:', error);
    res.status(500).json({ 
      message: 'Lỗi khi lấy thông tin người dùng',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Đã xảy ra lỗi, vui lòng thử lại sau'
    });
  }
};

// Nâng cấp thành viên
exports.upgradeMember = async (req, res) => {
  try {
    const userId = req.user.userId;
    
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
      role: user.Role,
      isMember: user.IsMember
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
        isMember: user.IsMember
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
  console.log('=== USER SMOKING STATUS UPDATE ===');
  console.log('User ID:', req.user.userId);
  console.log('Request body:', req.body);
  
  try {
    const { 
      cigarettesPerDay, 
      costPerPack, 
      smokingFrequency, 
      healthStatus, 
      cigaretteType, 
      quitReason, 
      dailyCigarettes, 
      dailyFeeling 
    } = req.body;
    const userId = req.user.userId;

    console.log('Processing smoking status update for user:', userId);

    // Bước 1: Cập nhật hoặc tạo mới SmokingProfile
    console.log('Updating SmokingProfiles table...');
    
    // Kiểm tra xem user đã có smoking profile chưa
    const existingProfile = await sql.query`
      SELECT Id FROM SmokingProfiles WHERE UserId = ${userId}
    `;

    if (existingProfile.recordset.length > 0) {
      // Update existing profile
      console.log('Updating existing smoking profile...');
      await sql.query`
        UPDATE SmokingProfiles
        SET
          cigarettesPerDay = ${cigarettesPerDay || 0},
          costPerPack = ${costPerPack || 0},
          smokingFrequency = ${smokingFrequency || ''},
          healthStatus = ${healthStatus || ''},
          cigaretteType = ${cigaretteType || ''},
          QuitReason = ${quitReason || ''}
        WHERE UserId = ${userId}
      `;
    } else {
      // Create new profile
      console.log('Creating new smoking profile...');
      await sql.query`
        INSERT INTO SmokingProfiles (UserId, cigarettesPerDay, costPerPack, smokingFrequency, healthStatus, cigaretteType, QuitReason)
        VALUES (${userId}, ${cigarettesPerDay || 0}, ${costPerPack || 0}, ${smokingFrequency || ''}, ${healthStatus || ''}, ${cigaretteType || ''}, ${quitReason || ''})
      `;
    }

    // Bước 2: Cập nhật hoặc tạo mới SmokingDailyLog cho hôm nay
    console.log('Updating SmokingDailyLog table...');
    
    const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
    
    // Kiểm tra xem đã có log cho hôm nay chưa
    const existingLog = await sql.query`
      SELECT Id FROM SmokingDailyLog WHERE UserId = ${userId} AND LogDate = ${today}
    `;

    if (existingLog.recordset.length > 0) {
      // Update existing daily log
      console.log('Updating existing daily log for today...');
      await sql.query`
        UPDATE SmokingDailyLog
        SET
          Cigarettes = ${dailyCigarettes || 0},
          Feeling = ${dailyFeeling || ''}
        WHERE UserId = ${userId} AND LogDate = ${today}
      `;
    } else {
      // Create new daily log
      console.log('Creating new daily log for today...');
      await sql.query`
        INSERT INTO SmokingDailyLog (UserId, LogDate, Cigarettes, Feeling)
        VALUES (${userId}, ${today}, ${dailyCigarettes || 0}, ${dailyFeeling || ''})
      `;
    }

    // Bước 3: Lấy thông tin đã cập nhật để trả về
    console.log('Fetching updated smoking status data...');
    
    // Lấy smoking profile
    const profileResult = await sql.query`
      SELECT cigarettesPerDay, costPerPack, smokingFrequency, healthStatus, cigaretteType, QuitReason
      FROM SmokingProfiles WHERE UserId = ${userId}
    `;
    
    // Lấy daily log hôm nay
    const logResult = await sql.query`
      SELECT Cigarettes, Feeling
      FROM SmokingDailyLog WHERE UserId = ${userId} AND LogDate = ${today}
    `;

    // Lấy thông tin user
    const userResult = await sql.query`
      SELECT Id, Username, Email FROM Users WHERE Id = ${userId}
    `;
    
    const user = userResult.recordset[0];
    const profile = profileResult.recordset[0] || {};
    const dailyLog = logResult.recordset[0] || {};

    const updatedSmokingStatus = {
      cigarettesPerDay: profile.cigarettesPerDay || 0,
      costPerPack: profile.costPerPack || 0,
      smokingFrequency: profile.smokingFrequency || '',
      healthStatus: profile.healthStatus || '',
      cigaretteType: profile.cigaretteType || '',
      quitReason: profile.QuitReason || '',
      dailyLog: {
        cigarettes: dailyLog.Cigarettes || 0,
        feeling: dailyLog.Feeling || ''
      }
    };

    console.log('=== SMOKING STATUS UPDATE SUCCESS ===');
    console.log('Updated smoking status data:', updatedSmokingStatus);
    
    const response = {
      success: true,
      message: 'Cập nhật thông tin hút thuốc thành công',
      user: {
        userId: user.Id,
        username: user.Username,
        email: user.Email,
        smokingStatus: updatedSmokingStatus
      }
    };
    
    console.log('Sending response:', response);
    res.status(200).json(response);
    
  } catch (error) {
    console.error('=== SMOKING STATUS UPDATE ERROR ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    res.status(500).json({ 
      success: false,
      message: 'Cập nhật thông tin hút thuốc thất bại', 
      error: error.message,
      details: error.name
    });
  }
};

// Cập nhật thông tin người dùng
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { username, email, phoneNumber, address } = req.body;
    if (!username || !email) {
      return res.status(400).json({ message: 'Vui lòng nhập đầy đủ tên đăng nhập và email.' });
    }
    await sql.query`
      UPDATE Users
      SET
        Username = ${username},
        Email = ${email},
        PhoneNumber = ${phoneNumber},
        Address = ${address}
      WHERE Id = ${userId}
    `;
    const result = await sql.query`
      SELECT * FROM Users WHERE Id = ${userId}
    `;
    const user = result.recordset[0];
    res.json({
      message: 'Cập nhật thành công',
      user: {
        id: user.Id,
        username: user.Username,
        email: user.Email,
        phoneNumber: user.PhoneNumber || "",
        address: user.Address || "",
        role: user.Role,
        isMember: user.IsMember
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Cập nhật thất bại', error: error.message });
  }
};

// Thêm vào authController.js
exports.addSmokingDailyLog = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { cigarettes, feeling } = req.body;
    
    console.log('=== ADD SMOKING DAILY LOG ===');
    console.log('User ID:', userId);
    console.log('Data:', { cigarettes, feeling });
    
    const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
    
    // Kiểm tra xem đã có log cho hôm nay chưa
    const existingLog = await sql.query`
      SELECT Id FROM SmokingDailyLog WHERE UserId = ${userId} AND LogDate = ${today}
    `;

    if (existingLog.recordset.length > 0) {
      // Update existing log
      console.log('Updating existing daily log for today...');
      await sql.query`
        UPDATE SmokingDailyLog
        SET
          Cigarettes = ${cigarettes || 0},
          Feeling = ${feeling || ''}
        WHERE UserId = ${userId} AND LogDate = ${today}
      `;
    } else {
      // Create new log
      console.log('Creating new daily log for today...');
      await sql.query`
        INSERT INTO SmokingDailyLog (UserId, LogDate, Cigarettes, Feeling)
        VALUES (${userId}, ${today}, ${cigarettes || 0}, ${feeling || ''})
      `;
    }
    
    console.log('✅ Daily log saved successfully');
    res.json({ 
      success: true,
      message: 'Lưu nhật ký hàng ngày thành công',
      data: {
        userId,
        date: today,
        cigarettes: cigarettes || 0,
        feeling: feeling || ''
      }
    });
  } catch (error) {
    console.error('❌ Error saving daily log:', error);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi khi lưu nhật ký hàng ngày', 
      error: error.message 
    });
  }
};

// Thêm hoặc cập nhật kế hoạch cai thuốc cho user
exports.createOrUpdateQuitPlan = async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      startDate,
      targetDate,
      planType,
      initialCigarettes,
      dailyReduction,
      milestones,
      currentProgress,
      planDetail
    } = req.body;

    console.log('📝 Creating/updating quit plan for user:', userId);
    console.log('Plan data:', req.body);

    // Validate dữ liệu đầu vào
    if (!startDate || !targetDate || !planType) {
      return res.status(400).json({ message: 'Thiếu thông tin bắt buộc!' });
    }

    // Kiểm tra user đã có kế hoạch chưa
    const check = await sql.query`
      SELECT * FROM QuitPlans WHERE UserId = ${userId}
    `;

    let planId;

    if (check.recordset.length > 0) {
      // Update
      planId = check.recordset[0].Id;
      await sql.query`
        UPDATE QuitPlans
        SET
          StartDate = ${startDate},
          TargetDate = ${targetDate},
          PlanType = ${planType},
          PlanDetail = ${planDetail || ''},
          InitialCigarettes = ${initialCigarettes || 0},
          DailyReduction = ${dailyReduction || 1},
          Milestones = ${JSON.stringify(milestones || [])},
          CurrentProgress = ${currentProgress || 0}
        WHERE UserId = ${userId}
      `;
      console.log('✅ Updated existing quit plan with ID:', planId);
    } else {
      // Insert
      const insertResult = await sql.query`
        INSERT INTO QuitPlans (UserId, StartDate, TargetDate, PlanType, PlanDetail, InitialCigarettes, DailyReduction, Milestones, CurrentProgress)
        VALUES (${userId}, ${startDate}, ${targetDate}, ${planType}, ${planDetail || ''}, ${initialCigarettes || 0}, ${dailyReduction || 1}, ${JSON.stringify(milestones || [])}, ${currentProgress || 0});
        
        SELECT SCOPE_IDENTITY() AS PlanId;
      `;
      planId = insertResult.recordset[0].PlanId;
      console.log('✅ Created new quit plan with ID:', planId);
    }

    res.json({ 
      message: 'Cập nhật kế hoạch cai thuốc thành công!', 
      planId: planId 
    });
  } catch (error) {
    console.error('Lỗi tạo/cập nhật kế hoạch cai thuốc:', error);
    res.status(500).json({ message: 'Lỗi khi tạo/cập nhật kế hoạch cai thuốc', error: error.message });
  }
};

exports.getQuitPlan = async (req, res) => {
  try {
    const userId = req.user.userId;
    const result = await sql.query`
      SELECT * FROM QuitPlans WHERE UserId = ${userId}
    `;
    if (result.recordset.length === 0) {
      return res.json({ quitPlan: null });
    }
    const plan = result.recordset[0];
    
    const quitPlanData = {
      id: plan.Id,
      startDate: plan.StartDate,
      targetDate: plan.TargetDate,
      planType: plan.PlanType,
      planDetail: plan.PlanDetail,
      initialCigarettes: plan.InitialCigarettes,
      dailyReduction: plan.DailyReduction,
      milestones: plan.Milestones ? JSON.parse(plan.Milestones) : [],
      currentProgress: plan.CurrentProgress
    };
    
    console.log('📋 Quit plan retrieved:', quitPlanData);
    res.json({ quitPlan: quitPlanData });
  } catch (error) {
    console.error('Lỗi getQuitPlan:', error);
    res.status(500).json({ message: 'Lỗi khi lấy kế hoạch cai thuốc', error: error.message });
  }
};

// Thêm tiến độ/nhật ký cho kế hoạch cai thuốc
exports.addProgress = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { planId, date, cigarettes, moneySpent, note } = req.body;

    console.log('📊 Adding progress for user:', userId);
    console.log('Progress data:', { planId, date, cigarettes, moneySpent, note });

    // Validate dữ liệu đầu vào
    if (!planId || !date) {
      return res.status(400).json({ message: 'Thiếu thông tin bắt buộc (planId, date)!' });
    }

    // Kiểm tra xem đã có record cho ngày này chưa
    const existingProgress = await sql.query`
      SELECT * FROM Progress 
      WHERE PlanId = ${planId} AND Date = ${date} AND UserId = ${userId}
    `;

    if (existingProgress.recordset.length > 0) {
      // Update existing record
      await sql.query`
        UPDATE Progress 
        SET 
          Cigarettes = ${cigarettes || 0},
          MoneySpent = ${moneySpent || 0},
          Note = ${note || ''}
        WHERE PlanId = ${planId} AND Date = ${date} AND UserId = ${userId}
      `;
      console.log('✅ Updated existing progress record');
    } else {
      // Insert new record with UserId
      await sql.query`
        INSERT INTO Progress (UserId, PlanId, Date, Cigarettes, MoneySpent, Note)
        VALUES (${userId}, ${planId}, ${date}, ${cigarettes || 0}, ${moneySpent || 0}, ${note || ''})
      `;
      console.log('✅ Created new progress record');
    }

    res.json({ 
      message: 'Lưu tiến độ thành công!',
      data: { planId, date, cigarettes, moneySpent, note }
    });
  } catch (error) {
    console.error('❌ Error adding progress:', error);
    res.status(500).json({ 
      message: 'Lỗi khi lưu tiến độ', 
      error: error.message 
    });
  }
};

// Lấy tiến độ mới nhất
exports.getLatestProgress = async (req, res) => {
  try {
    const userId = req.user.userId;

    console.log('📈 Getting latest progress for user:', userId);

    // Lấy tiến độ mới nhất từ các kế hoạch của user
    const result = await sql.query`
      SELECT TOP 1 p.*, qp.UserId
      FROM Progress p
      INNER JOIN QuitPlans qp ON p.PlanId = qp.Id
      WHERE qp.UserId = ${userId}
      ORDER BY p.Date DESC
    `;

    if (result.recordset.length === 0) {
      console.log('📈 No progress found for user:', userId);
      return res.json({ progress: null });
    }

    const progress = result.recordset[0];
    console.log('📈 Latest progress retrieved:', progress);

    res.json({ 
      progress: {
        id: progress.Id,
        planId: progress.PlanId,
        date: progress.Date,
        cigarettes: progress.Cigarettes,
        moneySpent: progress.MoneySpent,
        note: progress.Note
      }
    });
  } catch (error) {
    console.error('❌ Error getting latest progress:', error);
    res.status(500).json({ 
      message: 'Lỗi khi lấy tiến độ mới nhất', 
      error: error.message 
    });
  }
};