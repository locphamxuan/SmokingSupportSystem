const User = require('../models/User');

// Lấy danh sách user
exports.getUsers = async (req, res) => {
  try {
    // Lấy đầy đủ thông tin user, bao gồm cả smokingStatus
    const users = await User.find().select('-password -__v');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Get users failed', error: error.message });
  }
};

// Cập nhật thông tin user
exports.updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Cập nhật các trường cơ bản
    user.username = req.body.username || user.username;
    user.email = req.body.email || user.email;
    user.role = req.body.role || user.role;
    user.phoneNumber = req.body.phoneNumber || user.phoneNumber;
    user.address = req.body.address || user.address;

    // Cập nhật tình trạng hút thuốc (nếu có)
    if (req.body.smokingStatus) {
      user.smokingStatus = {
        ...user.smokingStatus,
        ...req.body.smokingStatus
      };
    }

    await user.save();
    res.json({ message: 'User updated', user });
  } catch (error) {
    res.status(500).json({ message: 'Update failed', error: error.message });
  }
};

// Xóa user
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Delete failed', error: error.message });
  }
};