const { sql } = require('../db');

// Lấy thông tin chi tiết một user
exports.getUserDetail = async (req, res) => {
  try {
    const userId = req.params.id;
    // Lấy thông tin user từ Users
    const userResult = await sql.query`
      SELECT Id, Username, Email, Role, IsMember, PhoneNumber, Address
      FROM Users WHERE Id = ${userId}
    `;
    if (userResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
    const user = userResult.recordset[0];

    // Lấy thông tin hút thuốc từ SmokingProfiles
    const profileResult = await sql.query`
      SELECT * FROM SmokingProfiles WHERE UserId = ${userId}
    `;
    const profile = profileResult.recordset[0];

    const userDetail = {
      id: user.Id,
      username: user.Username,
      email: user.Email,
      phoneNumber: user.PhoneNumber || "",
      address: user.Address || "",
      role: user.Role || 'guest',
      isMember: user.IsMember,
      smokingStatus: profile ? {
        cigarettesPerDay: profile.cigarettesPerDay || 0,
        costPerPack: profile.costPerPack || 0,
        smokingFrequency: profile.smokingFrequency || '',
        healthStatus: profile.healthStatus || '',
        cigaretteType: profile.cigaretteType || '',
        quitReason: profile.QuitReason || ''
      } : {}
    };
    res.json(userDetail);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy thông tin chi tiết người dùng', error: error.message });
  }
};

// Lấy danh sách user
exports.getUsers = async (req, res) => {
  try {
    const result = await sql.query`
      SELECT Id, Username, Email, Role, IsMember, PhoneNumber, Address, CreatedAt,
             cigarettesPerDay, costPerPack, smokingFrequency, healthStatus, cigaretteType, dailyCigarettes, dailyFeeling
      FROM Users
      ORDER BY CreatedAt DESC
    `;
    
    console.log('Raw database result:', result.recordset.length, 'users found'); // Debug log
    
    const users = result.recordset.map(user => {
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
          cigarettesPerDay: user.cigarettesPerDay || 0,
          costPerPack: user.costPerPack || 0,
          smokingFrequency: user.smokingFrequency || '',
          healthStatus: user.healthStatus || '',
          cigaretteType: user.cigaretteType || '',
          dailyCigarettes: user.dailyCigarettes || 0,
          dailyFeeling: user.dailyFeeling || ''
        }
      };
    });
    
    console.log('Mapped users:', users.length); // Debug log
    res.json(users);
  } catch (error) {
    console.error('Database error:', error); // Debug log
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