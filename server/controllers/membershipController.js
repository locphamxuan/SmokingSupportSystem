const { sql } = require('../db');

// Get all membership packages
exports.getMembershipPackages = async (req, res) => {
  try {
    const result = await sql.query`
      SELECT * FROM MembershipPackages ORDER BY Price ASC
    `;
    const packages = result.recordset.map(pkg => ({
      id: pkg.Id,
      name: pkg.Name,
      description: pkg.Description,
      price: pkg.Price,
      durationInDays: pkg.DurationInDays,
      features: pkg.Features ? pkg.Features.split('\n') : []
    }));
    res.json(packages);
  } catch (error) {
    console.error('Get membership packages error:', error);
    res.status(500).json({ message: 'Failed to get membership packages', error: error.message });
  }
};

// Create a new membership package
exports.createMembershipPackage = async (req, res) => {
  try {
    const { name, description, price, durationInDays, features } = req.body;
    if (!name || !price || !durationInDays) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    const featuresStr = Array.isArray(features) ? features.join('\n') : (features || '');
    const result = await sql.query`
      INSERT INTO MembershipPackages (Name, Description, Price, DurationInDays, Features)
      VALUES (${name}, ${description || ''}, ${price}, ${durationInDays}, ${featuresStr});
      SELECT SCOPE_IDENTITY() AS Id;
    `;
    const newId = result.recordset[0].Id;
    res.status(201).json({ id: newId, name, description, price, durationInDays, features: features ? (Array.isArray(features) ? features : featuresStr.split('\n')) : [] });
  } catch (error) {
    console.error('Create membership package error:', error);
    res.status(500).json({ message: 'Failed to create membership package', error: error.message });
  }
};

// Update a membership package
exports.updateMembershipPackage = async (req, res) => {
  try {
    const id = req.params.id;
    const { name, description, price, durationInDays, features } = req.body;
    if (!name || !price || !durationInDays) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    const featuresStr = Array.isArray(features) ? features.join('\n') : (features || '');
    const result = await sql.query`
      UPDATE MembershipPackages
      SET Name = ${name}, Description = ${description || ''}, Price = ${price}, DurationInDays = ${durationInDays}, Features = ${featuresStr}
      WHERE Id = ${id}
    `;
    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: 'Membership package not found' });
    }
    res.json({ id, name, description, price, durationInDays, features: features ? (Array.isArray(features) ? features : featuresStr.split('\n')) : [] });
  } catch (error) {
    console.error('Update membership package error:', error);
    res.status(500).json({ message: 'Failed to update membership package', error: error.message });
  }
};

// Delete a membership package
exports.deleteMembershipPackage = async (req, res) => {
  try {
    const id = req.params.id;
    const result = await sql.query`
      DELETE FROM MembershipPackages WHERE Id = ${id}
    `;
    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: 'Membership package not found' });
    }
    res.json({ message: 'Membership package deleted successfully' });
  } catch (error) {
    console.error('Delete membership package error:', error);
    res.status(500).json({ message: 'Failed to delete membership package', error: error.message });
  }
};

const purchaseVIP = async (req, res) => {
    const transaction = await sql.transaction();
    
    try {
        const { userId, packageId } = req.body;

        // Kiểm tra user
        const userCheck = await new sql.Request(transaction).query`
            SELECT IsMemberVip, VipEndDate
            FROM Users
            WHERE Id = ${userId}
        `;

        if (userCheck.recordset.length === 0) {
            throw new Error('User không tồn tại');
        }

        const user = userCheck.recordset[0];
        let startDate = new Date();
        
        // Nếu đang là VIP và còn hạn, gia hạn thêm 30 ngày từ ngày hết hạn cũ
        if (user.IsMemberVip && user.VipEndDate > new Date()) {
            startDate = new Date(user.VipEndDate);
        }

        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 30);

        // Cập nhật trạng thái VIP
        await new sql.Request(transaction).query`
            UPDATE Users 
            SET IsMemberVip = 1,
                VipStartDate = ${startDate},
                VipEndDate = ${endDate}
            WHERE Id = ${userId}
        `;

        // Thêm thông báo
        await new sql.Request(transaction).query`
            INSERT INTO Notifications (
                UserId,
                Message,
                Type,
                CreatedAt,
                IsRead
            )
            VALUES (
                ${userId},
                ${user.IsMemberVip ? 'Gia hạn gói VIP thành công' : 'Kích hoạt gói VIP thành công'},
                'vip_activated',
                ${new Date()},
                0
            )
        `;

        await transaction.commit();

        res.json({
            success: true,
            message: user.IsMemberVip ? 'Gia hạn VIP thành công' : 'Kích hoạt VIP thành công',
            expiryDate: endDate
        });

    } catch (error) {
        await transaction.rollback();
        console.error('Purchase VIP error:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra',
            error: error.message
        });
    }
};