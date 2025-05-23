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
    const { cigarettesPerDay, costPerPack, smokingFrequency, healthStatus } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    user.smokingStatus = {
      cigarettesPerDay: cigarettesPerDay || 0,
      costPerPack: costPerPack || 0,
      smokingFrequency: smokingFrequency || '',
      healthStatus: healthStatus || ''
    };

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
    const { startDate, targetDate } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    user.quitPlan = {
      startDate: startDate || null,
      targetDate: targetDate || null,
      milestones: [],
      currentProgress: 0
    };

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

// Update quit plan
exports.updateQuitPlan = async (req, res) => {
  try {
    const { milestones, currentProgress } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    if (milestones) {
      user.quitPlan.milestones = milestones;
    }
    if (currentProgress !== undefined) {
      user.quitPlan.currentProgress = currentProgress;
    }

    await user.save();

    res.json({
      message: 'Cập nhật kế hoạch cai thuốc thành công',
      quitPlan: user.quitPlan
    });
  } catch (error) {
    console.error('Update quit plan error:', error);
    res.status(500).json({ 
      message: 'Lỗi khi cập nhật kế hoạch cai thuốc',
      error: error.message 
    });
  }
};

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