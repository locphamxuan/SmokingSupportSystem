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
      durationInDays: pkg.DurationInDays
    }));
    res.json(packages);
  } catch (error) {
    console.error('Get membership packages error:', error);
    res.status(500).json({ message: 'Failed to get membership packages', error: error.message });
  }
}; 