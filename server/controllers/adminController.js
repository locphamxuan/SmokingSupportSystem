const { sql } = require('../db');

// Lấy thông tin chi tiết một user
exports.getUserDetail = async (req, res) => {
  try {
    const userId = req.params.id;
    
    console.log('Getting user detail for ID:', userId);
    
    // Lấy thông tin user cơ bản từ database
    const userResult = await sql.query`
      SELECT Id, Username, Email, Role, IsMember, PhoneNumber, Address, CreatedAt
      FROM Users
      WHERE Id = ${userId}
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
    
    // Format dữ liệu
    const userDetail = {
      id: user.Id,
      username: user.Username,
      email: user.Email,
      phoneNumber: user.PhoneNumber || "",
      address: user.Address || "",
      role: user.Role || 'guest',
      isMember: user.IsMember,
      createdAt: user.CreatedAt,
      smokingStatus: {
        cigarettesPerDay: profile.cigarettesPerDay || 0,
        costPerPack: profile.costPerPack || 0,
        smokingFrequency: profile.smokingFrequency || '',
        healthStatus: profile.healthStatus || '',
        cigaretteType: profile.cigaretteType || '',
        quitReason: profile.QuitReason || '',
        dailyCigarettes: dailyLog.Cigarettes || 0,
        dailyFeeling: dailyLog.Feeling || ''
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
    };
    
    console.log('User detail found:', userDetail);
    res.json(userDetail);
  } catch (error) {
    console.error('Get user detail error:', error);
    res.status(500).json({ message: 'Lỗi khi lấy thông tin chi tiết người dùng', error: error.message });
  }
};

// Lấy danh sách user
exports.getUsers = async (req, res) => {
  try {
    // Lấy thông tin user cơ bản
    const userResult = await sql.query`
      SELECT Id, Username, Email, Role, IsMember, PhoneNumber, Address, CreatedAt
      FROM Users
      ORDER BY CreatedAt DESC
    `;
    
    console.log('Raw database result:', userResult.recordset.length, 'users found');
    
    const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
    
    // Lấy tất cả smoking profiles
    const profilesResult = await sql.query`
      SELECT UserId, cigarettesPerDay, costPerPack, smokingFrequency, healthStatus, cigaretteType, QuitReason
      FROM SmokingProfiles
    `;
    
    // Lấy tất cả daily logs cho hôm nay
    const dailyLogsResult = await sql.query`
      SELECT UserId, Cigarettes, Feeling
      FROM SmokingDailyLog
      WHERE LogDate = ${today}
    `;
    
    // Tạo maps để lookup nhanh
    const profilesMap = {};
    profilesResult.recordset.forEach(profile => {
      profilesMap[profile.UserId] = profile;
    });
    
    const dailyLogsMap = {};
    dailyLogsResult.recordset.forEach(log => {
      dailyLogsMap[log.UserId] = log;
    });
    
    const users = userResult.recordset.map(user => {
      const profile = profilesMap[user.Id] || {};
      const dailyLog = dailyLogsMap[user.Id] || {};
      
      return {
        id: user.Id,
        username: user.Username,
        email: user.Email,
        phoneNumber: user.PhoneNumber || "",
        address: user.Address || "",
        role: user.Role || 'guest',
        isMember: user.IsMember,
        createdAt: user.CreatedAt,
        smokingStatus: {
          cigarettesPerDay: profile.cigarettesPerDay || 0,
          costPerPack: profile.costPerPack || 0,
          smokingFrequency: profile.smokingFrequency || '',
          healthStatus: profile.healthStatus || '',
          cigaretteType: profile.cigaretteType || '',
          quitReason: profile.QuitReason || '',
          dailyCigarettes: dailyLog.Cigarettes || 0,
          dailyFeeling: dailyLog.Feeling || ''
        }
      };
    });
    
    res.json(users);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ message: 'Get users failed', error: error.message });
  }
};

// Cập nhật thông tin user
exports.updateUser = async (req, res) => {
  console.log('=== UPDATE USER REQUEST ===');
  console.log('User ID:', req.params.id);
  console.log('Request body:', req.body);
  
  try {
    const { username, email, role, isMember, phoneNumber, address } = req.body;
    const userId = parseInt(req.params.id);

    console.log('Parsed userId:', userId, 'Type:', typeof userId);

    // Validate input
    if (!username || !email) {
      console.log('Validation failed: missing username or email');
      return res.status(400).json({ 
        success: false,
        message: 'Username và email là bắt buộc' 
      });
    }

    if (isNaN(userId)) {
      console.log('Invalid user ID:', req.params.id);
      return res.status(400).json({ 
        success: false,
        message: 'ID người dùng không hợp lệ' 
      });
    }

    // Kiểm tra user có tồn tại không
    console.log('Checking if user exists...');
    const checkUser = await sql.query`SELECT Id, Username, Email FROM Users WHERE Id = ${userId}`;
    console.log('Check user result:', checkUser.recordset);
    
    if (checkUser.recordset.length === 0) {
      console.log('User not found:', userId);
      return res.status(404).json({ 
        success: false,
        message: 'Không tìm thấy người dùng' 
      });
    }

    console.log('User found, proceeding with update...');

    // Cập nhật thông tin user với từng field riêng biệt
    console.log('Executing update query...');
    const updateResult = await sql.query`
      UPDATE Users
      SET
        Username = ${username},
        Email = ${email},
        Role = ${role || 'guest'},
        IsMember = ${isMember ? 1 : 0},
        PhoneNumber = ${phoneNumber || null},
        Address = ${address || null}
      WHERE Id = ${userId}
    `;

    console.log('Update query executed successfully, rows affected:', updateResult.rowsAffected);

    // Lấy thông tin user sau khi cập nhật
    console.log('Fetching updated user data...');
    const result = await sql.query`
      SELECT Id, Username, Email, Role, IsMember, PhoneNumber, Address, CreatedAt
      FROM Users WHERE Id = ${userId}
    `;
    
    if (result.recordset.length === 0) {
      console.log('User not found after update');
      return res.status(404).json({ 
        success: false,
        message: 'Không tìm thấy người dùng sau khi cập nhật' 
      });
    }
    
    const user = result.recordset[0];
    const updatedUser = {
      id: user.Id,
      username: user.Username,
      email: user.Email,
      phoneNumber: user.PhoneNumber || "",
      address: user.Address || "",
      role: user.Role || 'guest',
      isMember: user.IsMember,
      createdAt: user.CreatedAt
    };

    console.log('=== UPDATE SUCCESS ===');
    console.log('Updated user data:', updatedUser);
    
    // Đảm bảo response có status 200 và data đúng format
    const response = {
      success: true,
      message: 'Cập nhật người dùng thành công',
      data: updatedUser
    };
    
    console.log('Sending response:', response);
    res.status(200).json(response);
    
  } catch (error) {
    console.error('=== UPDATE ERROR ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    res.status(500).json({ 
      success: false,
      message: 'Update failed', 
      error: error.message,
      details: error.name
    });
  }
};

// Cập nhật smoking status cho user
exports.updateSmokingStatus = async (req, res) => {
  console.log('=== UPDATE SMOKING STATUS REQUEST ===');
  console.log('User ID:', req.params.id);
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
    const userId = parseInt(req.params.id);

    console.log('Parsed userId:', userId, 'Type:', typeof userId);

    if (isNaN(userId)) {
      console.log('Invalid user ID:', req.params.id);
      return res.status(400).json({ 
        success: false,
        message: 'ID người dùng không hợp lệ' 
      });
    }

    // Kiểm tra user có tồn tại không
    console.log('Checking if user exists...');
    const checkUser = await sql.query`SELECT Id, Username FROM Users WHERE Id = ${userId}`;
    console.log('Check user result:', checkUser.recordset);
    
    if (checkUser.recordset.length === 0) {
      console.log('User not found:', userId);
      return res.status(404).json({ 
        success: false,
        message: 'Không tìm thấy người dùng' 
      });
    }

    console.log('User found, proceeding with smoking status update...');

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
      dailyCigarettes: dailyLog.Cigarettes || 0,
      dailyFeeling: dailyLog.Feeling || ''
    };

    console.log('=== SMOKING STATUS UPDATE SUCCESS ===');
    console.log('Updated smoking status data:', updatedSmokingStatus);
    
    const response = {
      success: true,
      message: 'Cập nhật thông tin hút thuốc thành công',
      data: {
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

// Xóa user
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Kiểm tra user có tồn tại không
    const checkUser = await sql.query`SELECT * FROM Users WHERE Id = ${userId}`;
    if (checkUser.recordset.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
    
    // Xóa các bản ghi liên quan trước (nếu có)
    await sql.query`DELETE FROM UserBadges WHERE UserId = ${userId}`;
    await sql.query`DELETE FROM Comments WHERE UserId = ${userId}`;
    await sql.query`DELETE FROM Blogs WHERE UserId = ${userId}`;
    await sql.query`DELETE FROM Feedbacks WHERE UserId = ${userId}`;
    await sql.query`DELETE FROM QuitPlans WHERE UserId = ${userId}`;
    await sql.query`DELETE FROM Progress WHERE UserId = ${userId}`;
    await sql.query`DELETE FROM Notifications WHERE UserId = ${userId}`;
    await sql.query`DELETE FROM UserStatistics WHERE UserId = ${userId}`;
    await sql.query`DELETE FROM Rankings WHERE UserId = ${userId}`;
    await sql.query`DELETE FROM SmokingDailyLog WHERE UserId = ${userId}`;
    await sql.query`DELETE FROM SmokingProfiles WHERE UserId = ${userId}`;
    
    // Xóa user
    await sql.query`DELETE FROM Users WHERE Id = ${userId}`;
    
    console.log('User deleted successfully:', userId); // Debug log
    res.json({ message: 'Xóa người dùng thành công' });
  } catch (error) {
    console.error('Delete user error:', error); // Debug log
    res.status(500).json({ message: 'Delete failed', error: error.message });
  }
};

// Lấy thống kê tổng quan
exports.getStatistics = async (req, res) => {
  try {
    const totalUsers = await sql.query`SELECT COUNT(*) as count FROM Users`;
    const totalCoaches = await sql.query`SELECT COUNT(*) as count FROM Users WHERE Role = 'coach'`;
    const totalMembers = await sql.query`SELECT COUNT(*) as count FROM Users WHERE IsMember = 1`;
    const totalGuests = await sql.query`SELECT COUNT(*) as count FROM Users WHERE Role = 'guest'`;

    res.json({
      totalUsers: totalUsers.recordset[0].count,
      totalCoaches: totalCoaches.recordset[0].count,
      totalMembers: totalMembers.recordset[0].count,
      totalGuests: totalGuests.recordset[0].count
    });
  } catch (error) {
    console.error('Statistics error:', error);
    res.status(500).json({ message: 'Lỗi khi lấy thống kê', error: error.message });
  }
};