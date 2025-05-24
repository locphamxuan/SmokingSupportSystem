const { sql } = require('../db');

// Lấy danh sách user
exports.getUsers = async (req, res) => {
  try {
    const result = await sql.query`
      SELECT Id, Username, Email, IsPremium, IsAdmin, phoneNumber, address, CreatedAt,
             cigarettesPerDay, costPerPack, smokingFrequency, healthStatus
      FROM Users
    `;
    // Map thêm trường role cho mỗi user
    const users = result.recordset.map(user => ({
      ...user,
      role: user.IsAdmin ? 'admin' : (user.IsPremium ? 'premium' : 'user')
    }));
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Get users failed', error: error.message });
  }
};

// Cập nhật thông tin user
exports.updateUser = async (req, res) => {
  try {
    const { username, email, isPremium, isAdmin, phoneNumber, address, cigarettesPerDay, costPerPack, smokingFrequency, healthStatus } = req.body;
    const userId = req.params.id;

    await sql.query`
      UPDATE Users
      SET
        Username = ${username},
        Email = ${email},
        IsPremium = ${isPremium},
        IsAdmin = ${isAdmin},
        phoneNumber = ${phoneNumber},
        address = ${address},
        cigarettesPerDay = ${cigarettesPerDay},
        costPerPack = ${costPerPack},
        smokingFrequency = ${smokingFrequency},
        healthStatus = ${healthStatus}
      WHERE Id = ${userId}
    `;

    const result = await sql.query`
      SELECT Id, Username, Email, IsPremium, IsAdmin, phoneNumber, address, CreatedAt,
             cigarettesPerDay, costPerPack, smokingFrequency, healthStatus
      FROM Users WHERE Id = ${userId}
    `;
    res.json({ message: 'User updated', user: result.recordset[0] });
  } catch (error) {
    res.status(500).json({ message: 'Update failed', error: error.message });
  }
};

// Xóa user
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    await sql.query`DELETE FROM Users WHERE Id = ${userId}`;
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Delete failed', error: error.message });
  }
};