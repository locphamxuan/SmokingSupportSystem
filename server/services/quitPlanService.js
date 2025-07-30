const sql = require('mssql');

// Get all suggested quit plan stages for a given plan ID
const getSuggestedQuitPlanStages = async (planId) => {
  try {
    const result = await sql.query`
      SELECT *
      FROM SuggestedQuitPlanStages
      WHERE SuggestedPlanId = ${planId}
      ORDER BY StageOrder;
    `;
    return result.recordset;
  } catch (error) {
    console.error('Error in getSuggestedQuitPlanStages:', error);
    throw new Error('Failed to retrieve suggested quit plan stages');
  }
};

module.exports = {
  getSuggestedQuitPlanStages,
};
