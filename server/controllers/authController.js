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

    // Mã hóa mật khẩu
    const hash = await bcrypt.hash(password, 10);

    // Thêm người dùng mới
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
        ${hash}, 
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
    const result = await sql.query`
      SELECT * FROM Users WHERE Id = ${userId}
    `;
    const user = result.recordset[0];

    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
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
      smokingStatus: user.smokingStatus || {
        cigarettesPerDay: 0,
        costPerPack: 0,
        smokingFrequency: '',
        healthStatus: '',
        cigaretteType: '',
        quitReason: '',
        dailyLog: {
          cigarettes: 0,
          feeling: ''
        }
      },
      quitPlan: user.quitPlan || {
        startDate: '',
        targetDate: '',
        planType: '',
        milestones: [],
        currentProgress: 0,
        initialCigarettes: 0,
        dailyReduction: 1
      },
      achievements: user.achievements || []
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
    
    await sql.query`
      UPDATE Users 
      SET IsMember = 1 
      WHERE Id = ${userId}
    `;

    const result = await sql.query`
      SELECT * FROM Users WHERE Id = ${userId}
    `;
    const user = result.recordset[0];

    res.json({
      message: 'Nâng cấp thành công',
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
    console.error('Lỗi nâng cấp:', error);
    res.status(500).json({ 
      message: 'Lỗi khi nâng cấp',
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
      dailyCigarettes,
      dailyFeeling
    } = req.body;

    // Validate input bắt buộc
    if (
      cigarettesPerDay === undefined ||
      costPerPack === undefined ||
      smokingFrequency === undefined ||
      healthStatus === undefined
    ) {
      return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin tình trạng hút thuốc.' });
    }

    // Gán giá trị mặc định nếu undefined
    cigaretteType = cigaretteType ?? '';
    dailyCigarettes = dailyCigarettes ?? 0;
    dailyFeeling = dailyFeeling ?? '';

    await sql.query`
      UPDATE Users
      SET
        cigarettesPerDay = ${cigarettesPerDay},
        costPerPack = ${costPerPack},
        smokingFrequency = ${smokingFrequency},
        healthStatus = ${healthStatus},
        cigaretteType = ${cigaretteType},
        dailyCigarettes = ${dailyCigarettes},
        dailyFeeling = ${dailyFeeling}
      WHERE Id = ${userId}
    `;

    const result = await sql.query`
      SELECT * FROM Users WHERE Id = ${userId}
    `;
    const user = result.recordset[0];
    res.json({
      message: 'Cập nhật tình trạng hút thuốc thành công',
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
    console.error('Lỗi cập nhật tình trạng hút thuốc:', error);
    res.status(500).json({ 
      message: 'Lỗi khi cập nhật tình trạng hút thuốc',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Đã xảy ra lỗi, vui lòng thử lại sau'
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
    await sql.query`
      INSERT INTO SmokingDailyLog (UserId, Cigarettes, Feeling)
      VALUES (${userId}, ${cigarettes}, ${feeling})
    `;
    res.json({ message: 'Lưu nhật ký thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lưu nhật ký', error: error.message });
  }
};