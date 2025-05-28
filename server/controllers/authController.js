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
    const { email, emailOrUsername, password } = req.body;
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
    // Lấy thông tin cơ bản từ Users
    const userResult = await sql.query`
      SELECT Id, Username, Email, PhoneNumber, Address, Role, IsMember
      FROM Users WHERE Id = ${userId}
    `;
    const user = userResult.recordset[0];
    if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });

    // Lấy thông tin hút thuốc từ SmokingProfiles
    const profileResult = await sql.query`
      SELECT * FROM SmokingProfiles WHERE UserId = ${userId}
    `;
    const profile = profileResult.recordset[0];

    res.json({
      id: user.Id,
      username: user.Username,
      email: user.Email,
      phoneNumber: user.PhoneNumber || "",
      address: user.Address || "",
      role: user.Role,
      isMember: user.IsMember,
      smokingStatus: profile ? {
        cigarettesPerDay: profile.cigarettesPerDay || 0,
        costPerPack: profile.costPerPack || 0,
        smokingFrequency: profile.smokingFrequency || '',
        healthStatus: profile.healthStatus || '',
        cigaretteType: profile.cigaretteType || '',
        quitReason: profile.QuitReason || ''
      } : {}
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy thông tin người dùng', error: error.message });
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
  try {
    const userId = req.user.userId;
    let {
      cigarettesPerDay,
      costPerPack,
      smokingFrequency,
      healthStatus,
      cigaretteType,
      quitReason
    } = req.body;

    // Kiểm tra đã có profile chưa
    const check = await sql.query`
      SELECT * FROM SmokingProfiles WHERE UserId = ${userId}
    `;
    if (check.recordset.length > 0) {
      // Update
      await sql.query`
        UPDATE SmokingProfiles
        SET
          cigarettesPerDay = ${cigarettesPerDay},
          costPerPack = ${costPerPack},
          smokingFrequency = ${smokingFrequency},
          healthStatus = ${healthStatus},
          QuitReason = ${quitReason || ''},
          cigaretteType = ${cigaretteType || ''}
        WHERE UserId = ${userId}
      `;
    } else {
      // Insert
      await sql.query`
        INSERT INTO SmokingProfiles (UserId, cigarettesPerDay, costPerPack, smokingFrequency, healthStatus, QuitReason, cigaretteType)
        VALUES (${userId}, ${cigarettesPerDay}, ${costPerPack}, ${smokingFrequency}, ${healthStatus}, ${quitReason || ''}, ${cigaretteType || ''})
      `;
    }

    res.json({ message: 'Cập nhật tình trạng hút thuốc thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi cập nhật tình trạng hút thuốc', error: error.message });
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
    await sql.query`
      INSERT INTO SmokingDailyLog (UserId, Cigarettes, Feeling)
      VALUES (${userId}, ${cigarettes}, ${feeling})
    `;
    res.json({ message: 'Lưu nhật ký thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lưu nhật ký', error: error.message });
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

    // Validate dữ liệu đầu vào
    if (!startDate || !targetDate || !planType) {
      return res.status(400).json({ message: 'Thiếu thông tin bắt buộc!' });
    }

    // Kiểm tra user đã có kế hoạch chưa
    const check = await sql.query`
      SELECT * FROM QuitPlans WHERE UserId = ${userId}
    `;

    if (check.recordset.length > 0) {
      // Update
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
    } else {
      // Insert
      await sql.query`
        INSERT INTO QuitPlans (UserId, StartDate, TargetDate, PlanType, PlanDetail, InitialCigarettes, DailyReduction, Milestones, CurrentProgress)
        VALUES (${userId}, ${startDate}, ${targetDate}, ${planType}, ${planDetail || ''}, ${initialCigarettes || 0}, ${dailyReduction || 1}, ${JSON.stringify(milestones || [])}, ${currentProgress || 0})
      `;
    }

    res.json({ message: 'Cập nhật kế hoạch cai thuốc thành công!' });
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
    res.json({
      quitPlan: {
        startDate: plan.StartDate,
        targetDate: plan.TargetDate,
        planType: plan.PlanType,
        initialCigarettes: plan.InitialCigarettes,
        dailyReduction: plan.DailyReduction,
        milestones: plan.Milestones ? JSON.parse(plan.Milestones) : [],
        currentProgress: plan.CurrentProgress
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy kế hoạch cai thuốc', error: error.message });
  }
};

// Ghi nhật ký tiến độ vào bảng Progress
exports.addProgress = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { planId, date, cigarettes, moneySpent, note } = req.body;
    await sql.query`
      INSERT INTO Progress (UserId, PlanId, Date, Cigarettes, MoneySpent, Note)
      VALUES (${userId}, ${planId}, ${date}, ${cigarettes}, ${moneySpent}, ${note || ''})
    `;
    res.json({ message: 'Lưu tiến độ thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lưu tiến độ', error: error.message });
  }
};

exports.getLatestProgress = async (req, res) => {
  try {
    const userId = req.user.userId;
    // Lấy nhật ký mới nhất của user (có thể lọc theo ngày hôm nay nếu muốn)
    const result = await sql.query`
      SELECT TOP 1 * FROM Progress WHERE UserId = ${userId} ORDER BY Date DESC
    `;
    if (result.recordset.length === 0) {
      return res.json({ progress: null });
    }
    res.json({ progress: result.recordset[0] });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy nhật ký tiến độ', error: error.message });
  }
};