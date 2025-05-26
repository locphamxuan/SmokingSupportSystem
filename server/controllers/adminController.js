const { sql } = require('../db');

// Lấy danh sách user
exports.getUsers = async (req, res) => {
  try {
    const result = await sql.query`
      SELECT Id, Username, Email, IsMember, PhoneNumber, Address, CreatedAt,
             cigarettesPerDay, costPerPack, smokingFrequency, healthStatus, cigaretteType, dailyCigarettes, dailyFeeling
      FROM Users
    `;
    const users = result.recordset.map(user => ({
      id: user.Id,
      username: user.Username,
      email: user.Email,
      phoneNumber: user.PhoneNumber || "",
      address: user.Address || "",
      role: user.IsMember ? 'member' : 'guest',
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
    }));
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Get users failed', error: error.message });
  }
};

// Cập nhật thông tin user
exports.updateUser = async (req, res) => {
  try {
    const { username, email, isMember, phoneNumber, address, cigarettesPerDay, costPerPack, smokingFrequency, healthStatus, cigaretteType, dailyCigarettes, dailyFeeling } = req.body;
    const userId = req.params.id;

    await sql.query`
      UPDATE Users
      SET
        Username = ${username},
        Email = ${email},
        IsMember = ${isMember},
        PhoneNumber = ${phoneNumber},
        Address = ${address},
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
      SELECT Id, Username, Email, IsMember, PhoneNumber, Address, CreatedAt,
             cigarettesPerDay, costPerPack, smokingFrequency, healthStatus, cigaretteType, dailyCigarettes, dailyFeeling
      FROM Users WHERE Id = ${userId}
    `;
    res.json({
      id: result.recordset[0].Id,
      username: result.recordset[0].Username,
      email: result.recordset[0].Email,
      phoneNumber: result.recordset[0].PhoneNumber || "",
      address: result.recordset[0].Address || "",
      role: result.recordset[0].IsMember ? 'member' : 'guest',
      isMember: result.recordset[0].IsMember,
      createdAt: result.recordset[0].CreatedAt,
      smokingStatus: {
        cigarettesPerDay: result.recordset[0].cigarettesPerDay || 0,
        costPerPack: result.recordset[0].costPerPack || 0,
        smokingFrequency: result.recordset[0].smokingFrequency || '',
        healthStatus: result.recordset[0].healthStatus || '',
        cigaretteType: result.recordset[0].cigaretteType || '',
        dailyCigarettes: result.recordset[0].dailyCigarettes || 0,
        dailyFeeling: result.recordset[0].dailyFeeling || ''
      }
    });
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

// Lấy danh sách guests
exports.getGuests = async (req, res) => {
  try {
    const result = await sql.query`
      SELECT 
        Id,
        Username,
        Email,
        IsMember,
        IsAdmin,
        phoneNumber,
        address,
        cigarettesPerDay,
        costPerPack,
        smokingFrequency,
        healthStatus,
        QuitReason,
        CreatedAt
      FROM Guests
      ORDER BY CreatedAt DESC
    `;

    // Map thêm trường role cho mỗi guest
    const guests = result.recordset.map(guest => ({
      ...guest,
      role: guest.IsAdmin ? 'admin' : (guest.IsMember ? 'member' : 'guest')
    }));

    res.json(guests);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy danh sách guests', error: error.message });
  }
};

// Cập nhật thông tin guest
exports.updateGuest = async (req, res) => {
  try {
    const guestId = req.params.id;
    const { 
      username, 
      email, 
      isMember,
      phoneNumber, 
      address, 
      cigarettesPerDay, 
      costPerPack, 
      smokingFrequency, 
      healthStatus, 
      quitReason 
    } = req.body;

    // Kiểm tra guest có tồn tại không
    const guest = await sql.query`SELECT * FROM Guests WHERE Id = ${guestId}`;
    if (guest.recordset.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy guest' });
    }

    await sql.query`
      UPDATE Guests
      SET 
        Username = ${username},
        Email = ${email},
        IsMember = ${isMember},
        phoneNumber = ${phoneNumber},
        address = ${address},
        cigarettesPerDay = ${cigarettesPerDay},
        costPerPack = ${costPerPack},
        smokingFrequency = ${smokingFrequency},
        healthStatus = ${healthStatus},
        QuitReason = ${quitReason}
      WHERE Id = ${guestId}
    `;

    const updatedGuest = await sql.query`
      SELECT * FROM Guests WHERE Id = ${guestId}
    `;

    res.json({
      message: 'Cập nhật thông tin thành công',
      guest: {
        ...updatedGuest.recordset[0],
        role: updatedGuest.recordset[0].IsAdmin ? 'admin' : 
              (updatedGuest.recordset[0].IsMember ? 'member' : 'guest')
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi cập nhật thông tin guest', error: error.message });
  }
};

// Xóa guest
exports.deleteGuest = async (req, res) => {
  try {
    const guestId = req.params.id;

    // Kiểm tra xem guest có tồn tại không
    const guest = await sql.query`SELECT * FROM Guests WHERE Id = ${guestId}`;
    if (guest.recordset.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy guest' });
    }

    // Xóa các bản ghi liên quan
    await sql.query`DELETE FROM GuestBadges WHERE GuestId = ${guestId}`;
    await sql.query`DELETE FROM GuestMemberships WHERE GuestId = ${guestId}`;
    await sql.query`DELETE FROM Comments WHERE GuestId = ${guestId}`;
    await sql.query`DELETE FROM Blogs WHERE GuestId = ${guestId}`;
    await sql.query`DELETE FROM Feedbacks WHERE GuestId = ${guestId}`;
    await sql.query`DELETE FROM Plans WHERE GuestId = ${guestId}`;
    await sql.query`DELETE FROM Progress WHERE GuestId = ${guestId}`;
    await sql.query`DELETE FROM Notifications WHERE GuestId = ${guestId}`;
    await sql.query`DELETE FROM CommunityPosts WHERE GuestId = ${guestId}`;

    // Xóa guest
    await sql.query`DELETE FROM Guests WHERE Id = ${guestId}`;

    res.json({ message: 'Xóa guest thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi xóa guest', error: error.message });
  }
};