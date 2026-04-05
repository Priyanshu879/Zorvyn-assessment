const dashboardService = require('../services/dashboard.service');
const asyncHandler = require('../utils/asyncHandler');

const getSummary = asyncHandler(async (req, res) => {
  const data = await dashboardService.getSummary();
  return res.status(200).json({ success: true, data });
});

const getCategoryTotals = asyncHandler(async (req, res) => {
  const data = await dashboardService.getCategoryTotals();
  return res.status(200).json({ success: true, data });
});

const getMonthlyTrends = asyncHandler(async (req, res) => {
  const data = await dashboardService.getMonthlyTrends(req.query.months);
  return res.status(200).json({ success: true, data });
});

const getRecentActivity = asyncHandler(async (req, res) => {
  const data = await dashboardService.getRecentActivity(req.query.limit);
  return res.status(200).json({ success: true, data });
});

module.exports = { getSummary, getCategoryTotals, getMonthlyTrends, getRecentActivity };
