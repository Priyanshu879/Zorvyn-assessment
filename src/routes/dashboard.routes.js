const { Router } = require('express');
const dashboardController = require('../controllers/dashboard.controller');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { trendsQuerySchema, recentQuerySchema } = require('../validators/dashboard.validator');

const router = Router();

router.get('/summary', authenticate, authorize('VIEWER', 'ANALYST', 'ADMIN'), dashboardController.getSummary);
router.get('/categories', authenticate, authorize('VIEWER', 'ANALYST', 'ADMIN'), dashboardController.getCategoryTotals);
router.get(
  '/recent',
  authenticate, authorize('VIEWER', 'ANALYST', 'ADMIN'),
  validate(recentQuerySchema, 'query'),
  dashboardController.getRecentActivity
);
router.get(
  '/trends',
  authenticate, authorize('ANALYST', 'ADMIN'),
  validate(trendsQuerySchema, 'query'),
  dashboardController.getMonthlyTrends
);

module.exports = router;
