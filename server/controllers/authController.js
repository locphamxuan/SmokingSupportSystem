const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Register new user
exports.register = async (req, res) => {
  try {
    const { username, email, password, phoneNumber, address } = req.body;

    // Validate input
    if (!username || !email || !password || !phoneNumber || !address) {
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: 'Email hoặc tên người dùng đã tồn tại' });
    }

    // Create new user
    const user = new User({
      username,
      email,
      password,
      phoneNumber,
      address,
      smokingStatus: {
        cigarettesPerDay: 0,
        costPerPack: 0,
        smokingFrequency: '',
        healthStatus: ''
      },
      quitPlan: {
        startDate: null,
        targetDate: null,
        milestones: [],
        currentProgress: 0
      },
      achievements: []
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'Đăng ký thành công',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        phoneNumber: user.phoneNumber,
        address: user.address,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      message: 'Lỗi khi đăng ký',
      error: error.message 
    });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Vui lòng nhập email và mật khẩu' });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Đăng nhập thành công',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        phoneNumber: user.phoneNumber,
        address: user.address,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Dữ liệu không hợp lệ',
        error: error.message 
      });
    }
    res.status(500).json({ 
      message: 'Lỗi khi đăng nhập',
      error: error.message 
    });
  }
};

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    res.json({
      username: user.username,
      email: user.email,
      phoneNumber: user.phoneNumber,
      address: user.address,
      role: user.role,
      createdAt: user.createdAt,
      smokingStatus: user.smokingStatus || {
        cigarettesPerDay: 0,
        costPerPack: 0,
        smokingFrequency: '',
        healthStatus: ''
      },
      quitPlan: user.quitPlan || {
        startDate: null,
        targetDate: null,
        milestones: [],
        currentProgress: 0
      },
      achievements: user.achievements || [],
      isPremium: user.role === 'premium'
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ 
      message: 'Lỗi khi lấy thông tin người dùng',
      error: error.message 
    });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const { username, email, phoneNumber, address } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    // Check if email or username is already taken
    if (email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email đã được sử dụng' });
      }
    }

    if (username !== user.username) {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({ message: 'Tên người dùng đã tồn tại' });
      }
    }

    // Update user information
    user.username = username || user.username;
    user.email = email || user.email;
    user.phoneNumber = phoneNumber || user.phoneNumber;
    user.address = address || user.address;

    await user.save();

    res.json({
      message: 'Cập nhật thông tin thành công',
      user: {
        username: user.username,
        email: user.email,
        phoneNumber: user.phoneNumber,
        address: user.address
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ 
      message: 'Lỗi khi cập nhật thông tin',
      error: error.message 
    });
  }
};

// Update smoking status
exports.updateSmokingStatus = async (req, res) => {
  try {
    const { 
      cigarettesPerDay, 
      costPerPack, 
      smokingFrequency, 
      healthStatus,
      cigaretteType,
      quitReason,
      dailyLog
    } = req.body;
    
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    // Update basic smoking status
    user.smokingStatus = {
      ...user.smokingStatus,
      cigarettesPerDay: cigarettesPerDay || user.smokingStatus.cigarettesPerDay,
      costPerPack: costPerPack || user.smokingStatus.costPerPack,
      smokingFrequency: smokingFrequency || user.smokingStatus.smokingFrequency,
      healthStatus: healthStatus || user.smokingStatus.healthStatus,
      cigaretteType: cigaretteType || user.smokingStatus.cigaretteType,
      quitReason: quitReason || user.smokingStatus.quitReason
    };

    // Add daily log if provided
    if (dailyLog) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const existingLogIndex = user.smokingStatus.dailyLog.findIndex(
        log => new Date(log.date).setHours(0, 0, 0, 0) === today.getTime()
      );

      if (existingLogIndex >= 0) {
        user.smokingStatus.dailyLog[existingLogIndex] = {
          ...user.smokingStatus.dailyLog[existingLogIndex],
          ...dailyLog,
          date: today
        };
      } else {
        user.smokingStatus.dailyLog.push({
          ...dailyLog,
          date: today
        });
      }
    }

    await user.save();

    res.json({
      message: 'Cập nhật tình trạng hút thuốc thành công',
      smokingStatus: user.smokingStatus
    });
  } catch (error) {
    console.error('Update smoking status error:', error);
    res.status(500).json({ 
      message: 'Lỗi khi cập nhật tình trạng hút thuốc',
      error: error.message 
    });
  }
};

// Create quit plan
exports.createQuitPlan = async (req, res) => {
  try {
    const { 
      planType,
      startDate, 
      targetDate,
      initialCigarettes,
      dailyReduction
    } = req.body;
    
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    // Create milestones based on plan type
    let milestones = [];
    const start = new Date(startDate);
    const target = new Date(targetDate);
    const daysDiff = Math.ceil((target - start) / (1000 * 60 * 60 * 24));

    if (planType === 'gradual') {
      // Create daily milestones for gradual reduction
      let currentCigarettes = initialCigarettes;
      for (let i = 0; i < daysDiff; i++) {
        const milestoneDate = new Date(start);
        milestoneDate.setDate(start.getDate() + i);
        
        milestones.push({
          title: `Giảm xuống ${currentCigarettes} điếu/ngày`,
          date: milestoneDate,
          type: 'time',
          value: currentCigarettes,
          description: `Mục tiêu: ${currentCigarettes} điếu/ngày`
        });

        currentCigarettes = Math.max(0, currentCigarettes - dailyReduction);
      }
    } else {
      // Create standard milestones for cold-turkey and custom plans
      const standardMilestones = [
        { days: 1, title: '1 ngày không hút thuốc' },
        { days: 7, title: '1 tuần không hút thuốc' },
        { days: 30, title: '1 tháng không hút thuốc' },
        { days: 90, title: '3 tháng không hút thuốc' },
        { days: 180, title: '6 tháng không hút thuốc' },
        { days: 365, title: '1 năm không hút thuốc' }
      ];

      milestones = standardMilestones
        .filter(m => m.days <= daysDiff)
        .map(m => {
          const milestoneDate = new Date(start);
          milestoneDate.setDate(start.getDate() + m.days);
          return {
            title: m.title,
            date: milestoneDate,
            type: 'time',
            value: m.days,
            description: `Đạt được ${m.days} ngày không hút thuốc`
          };
        });
    }

    // Add money saved milestones
    const moneyMilestones = [
      { amount: 100000, title: 'Tiết kiệm 100.000đ' },
      { amount: 500000, title: 'Tiết kiệm 500.000đ' },
      { amount: 1000000, title: 'Tiết kiệm 1.000.000đ' },
      { amount: 5000000, title: 'Tiết kiệm 5.000.000đ' }
    ];

    moneyMilestones.forEach(m => {
      const daysToReach = Math.ceil(m.amount / (user.smokingStatus.cigarettesPerDay * user.smokingStatus.costPerPack / 20));
      if (daysToReach <= daysDiff) {
        const milestoneDate = new Date(start);
        milestoneDate.setDate(start.getDate() + daysToReach);
        milestones.push({
          title: m.title,
          date: milestoneDate,
          type: 'money',
          value: m.amount,
          description: `Tiết kiệm được ${m.amount.toLocaleString()}đ`
        });
      }
    });

    // Add health improvement milestones
    const healthMilestones = [
      { days: 1, title: 'Huyết áp và nhịp tim bắt đầu trở về bình thường' },
      { days: 2, title: 'Khứu giác và vị giác bắt đầu cải thiện' },
      { days: 14, title: 'Chức năng phổi bắt đầu cải thiện' },
      { days: 30, title: 'Giảm nguy cơ mắc bệnh tim mạch' },
      { days: 90, title: 'Giảm nguy cơ mắc bệnh phổi' }
    ];

    healthMilestones
      .filter(m => m.days <= daysDiff)
      .forEach(m => {
        const milestoneDate = new Date(start);
        milestoneDate.setDate(start.getDate() + m.days);
        milestones.push({
          title: m.title,
          date: milestoneDate,
          type: 'health',
          value: m.days,
          description: `Cải thiện sức khỏe sau ${m.days} ngày`
        });
      });

    user.quitPlan = {
      planType: planType || 'gradual',
      startDate: startDate || null,
      targetDate: targetDate || null,
      initialCigarettes: initialCigarettes || user.smokingStatus.cigarettesPerDay,
      dailyReduction: dailyReduction || 1,
      milestones: milestones,
      currentProgress: 0,
      dailyProgress: []
    };

    // Add initial notification
    user.notifications.push({
      title: 'Bắt đầu hành trình cai thuốc',
      message: 'Chúc mừng bạn đã bắt đầu hành trình cai thuốc! Hãy kiên trì và theo dõi tiến độ của bạn.',
      type: 'motivation'
    });

    await user.save();

    res.json({
      message: 'Tạo kế hoạch cai thuốc thành công',
      quitPlan: user.quitPlan
    });
  } catch (error) {
    console.error('Create quit plan error:', error);
    res.status(500).json({ 
      message: 'Lỗi khi tạo kế hoạch cai thuốc',
      error: error.message 
    });
  }
};

// Update quit plan progress
exports.updateQuitPlanProgress = async (req, res) => {
  try {
    const { cigarettes, notes, mood } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    if (!user.quitPlan.startDate) {
      return res.status(400).json({ message: 'Chưa có kế hoạch cai thuốc' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate money saved
    const moneySaved = (user.smokingStatus.cigarettesPerDay - cigarettes) * 
                      (user.smokingStatus.costPerPack / 20);

    // Add daily progress
    const dailyProgress = {
      date: today,
      cigarettes,
      moneySaved,
      notes,
      mood: mood || 'okay'
    };

    user.quitPlan.dailyProgress.push(dailyProgress);

    // Update milestones
    const daysSinceStart = Math.ceil((today - new Date(user.quitPlan.startDate)) / (1000 * 60 * 60 * 24));
    const totalDays = Math.ceil((new Date(user.quitPlan.targetDate) - new Date(user.quitPlan.startDate)) / (1000 * 60 * 60 * 24));
    
    user.quitPlan.currentProgress = Math.min(100, Math.round((daysSinceStart / totalDays) * 100));

    // Check and update milestones
    user.quitPlan.milestones.forEach(milestone => {
      if (!milestone.completed && new Date(milestone.date) <= today) {
        milestone.completed = true;
        
        // Add achievement
        user.achievements.push({
          title: milestone.title,
          description: milestone.description,
          type: milestone.type,
          value: milestone.value,
          icon: getMilestoneIcon(milestone.type)
        });

        // Add notification
        user.notifications.push({
          title: 'Đạt được mốc quan trọng!',
          message: `Chúc mừng bạn đã ${milestone.title.toLowerCase()}`,
          type: 'milestone'
        });
      }
    });

    await user.save();

    res.json({
      message: 'Cập nhật tiến độ thành công',
      quitPlan: user.quitPlan
    });
  } catch (error) {
    console.error('Update quit plan progress error:', error);
    res.status(500).json({ 
      message: 'Lỗi khi cập nhật tiến độ',
      error: error.message 
    });
  }
};

// Helper function to get milestone icon
function getMilestoneIcon(type) {
  switch (type) {
    case 'time':
      return '⏰';
    case 'money':
      return '💰';
    case 'health':
      return '❤️';
    default:
      return '🏆';
  }
}

// Nâng cấp tài khoản lên premium
exports.upgradePremium = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
    user.role = 'premium';
    await user.save();
    res.json({ message: 'Nâng cấp thành công', user });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi nâng cấp', error: error.message });
  }
};

// Nâng cấp tài khoản lên admin
exports.upgradeToAdmin = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
    
    // Kiểm tra xem người dùng có phải là admin không
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Không có quyền thực hiện thao tác này' });
    }

    const { userId } = req.body;
    const targetUser = await User.findById(userId);
    
    if (!targetUser) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng cần nâng cấp' });
    }

    targetUser.role = 'admin';
    await targetUser.save();

    res.json({ 
      message: 'Nâng cấp tài khoản lên admin thành công',
      user: targetUser
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Lỗi khi nâng cấp tài khoản',
      error: error.message 
    });
  }
}; 
// Thêm vào cuối file authController.js
exports.updateQuitPlan = (req, res) => {
  res.status(501).json({ message: 'Not implemented' });
};