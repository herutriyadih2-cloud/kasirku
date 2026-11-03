const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const reportController = require('../controllers/reportController');

router.get('/reports/sales', requireAuth, reportController.sales);
router.get('/reports/profit', requireAuth, reportController.profit);
router.get('/reports/stock', requireAuth, reportController.stock);

module.exports = router;
