const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sql } = require('../db');

// Đăng ký
exports.register = async (req, res) => {
  try {
    const { username, email, password, phoneNumber, address } = req.body;
    if (!username || !email || !password || !phoneNumber || !address) {
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin' });
    }

    const check = await sql.query`SELECT * FROM Users WHERE Email = ${email} OR Username = ${username}`;
    if (check.recordset.length > 0) {
      return res.status(400).json({ message: 'Email hoặc tên người dùng đã tồn tại' });
    }

    const hash = await bcrypt.hash(password, 10);
    await sql.query`
      INSERT INTO Users (Username, Password, Email, phoneNumber, address, IsPremium)
      VALUES (${username}, ${hash}, ${email}, ${phoneNumber}, ${address}, 0)
    `;

    const result = await sql.query`SELECT * FROM Users WHERE Email = ${email}`;
    const user = result.recordset[0];

    const token = jwt.sign(
      { userId: user.Id, isPremium: user.IsPremium },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'Đăng ký thành công',
      token,
      user: {
        id: user.Id,
        username: user.Username,
        email: user.Email,
        phoneNumber: user.phoneNumber || "",
        address: user.address || "",
        isPremium: user.IsPremium,
        role: user.IsAdmin ? 'admin' : (user.IsPremium ? 'premium' : 'user')
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi đăng ký', error: error.message });
  }
};

// Đăng nhập
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Vui lòng nhập email và mật khẩu' });

    const result = await sql.query`SELECT * FROM Users WHERE Email = ${email}`;
    const user = result.recordset[0];
    if (!user) return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });

    const isMatch = await bcrypt.compare(password, user.Password);
    if (!isMatch) return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });

    const token = jwt.sign(
      { userId: user.Id, isPremium: user.IsPremium },
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
        phoneNumber: user.phoneNumber || "",
        address: user.address || "",
        isPremium: user.IsPremium,
        role: user.IsAdmin ? 'admin' : (user.IsPremium ? 'premium' : 'user')
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi đăng nhập', error: error.message });
  }
};

// Lấy profile
exports.getProfile = async (req, res) => {
  try {
    const user = req.user;
    res.json({
      id: user.Id,
      username: user.Username,
      email: user.Email,
      phoneNumber: user.phoneNumber || "",
      address: user.address || "",
      isPremium: user.IsPremium,
      role: user.IsAdmin ? 'admin' : (user.IsPremium ? 'premium' : 'user'),
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
      quitPlan: (user.quitPlan && typeof user.quitPlan === 'object') ? user.quitPlan : {
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
    res.status(500).json({ message: 'Lỗi khi lấy thông tin người dùng', error: error.message });
  }
};

// Nâng cấp premium
exports.upgradePremium = async (req, res) => {
  try {
    // Cập nhật IsPremium
    await sql.query`UPDATE Users SET IsPremium = 1 WHERE Id = ${req.user.Id}`;

    // Lấy gói mặc định (ví dụ: gói 1 tháng)
    const membershipResult = await sql.query`SELECT TOP 1 Id, DurationInDays FROM Memberships ORDER BY Id ASC`;
    const membership = membershipResult.recordset[0];

    if (membership) {
      // Thêm vào bảng UserMemberships
      await sql.query`
        INSERT INTO UserMemberships (UserId, MembershipId, StartDate, EndDate)
        VALUES (
          ${req.user.Id},
          ${membership.Id},
          GETDATE(),
          DATEADD(DAY, ${membership.DurationInDays}, GETDATE())
        )
      `;
    }

    // Lấy lại user mới nhất
    const userResult = await sql.query`SELECT * FROM Users WHERE Id = ${req.user.Id}`;
    const user = userResult.recordset[0];

    res.json({
      message: 'Nâng cấp thành công',
      user: {
        id: user.Id,
        username: user.Username,
        email: user.Email,
        phoneNumber: user.phoneNumber || "",
        address: user.address || "",
        isPremium: user.IsPremium,
        role: user.IsAdmin ? 'admin' : (user.IsPremium ? 'premium' : 'user')
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi nâng cấp', error: error.message });
  }
};

// Cập nhật tình trạng hút thuốc
exports.updateSmokingStatus = async (req, res) => {
  try {
    const userId = req.user.Id;
    const { cigarettesPerDay, costPerPack, smokingFrequency, healthStatus, cigaretteType, quitReason } = req.body;

    await sql.query`
      UPDATE Users
      SET
        cigarettesPerDay = ${cigarettesPerDay},
        costPerPack = ${costPerPack},
        smokingFrequency = ${smokingFrequency},
        healthStatus = ${healthStatus},
        QuitReason = ${quitReason}
      WHERE Id = ${userId}
    `;

    // Lấy lại user mới nhất
    const result = await sql.query`SELECT * FROM Users WHERE Id = ${userId}`;
    const user = result.recordset[0];

    res.json({
      message: 'Cập nhật tình trạng hút thuốc thành công',
      user: {
        id: user.Id,
        username: user.Username,
        email: user.Email,
        phoneNumber: user.phoneNumber || "",
        address: user.address || "",
        isPremium: user.IsPremium,
        role: user.IsAdmin ? 'admin' : (user.IsPremium ? 'premium' : 'user'),
        cigarettesPerDay: user.cigarettesPerDay,
        costPerPack: user.costPerPack,
        smokingFrequency: user.smokingFrequency,
        healthStatus: user.healthStatus,
        quitReason: user.QuitReason
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi cập nhật tình trạng hút thuốc', error: error.message });
  }
};