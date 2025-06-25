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