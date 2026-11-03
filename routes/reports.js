const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const reportController = require('../controllers/reportController');

router.get('/reports/sales', requireAuth, reportController.sales);
router.get('/reports/profit', requireAuth, reportController.profit);
router.get('/reports/stock', requireAuth, reportController.stock);

// Export Excel
router.get('/reports/sales/export/excel', requireAuth, reportController.exportSalesExcel);
router.get('/reports/profit/export/excel', requireAuth, reportController.exportProfitExcel);
router.get('/reports/stock/export/excel', requireAuth, reportController.exportStockExcel);

// Export PDF
router.get('/reports/sales/export/pdf', requireAuth, reportController.exportSalesPDF);
router.get('/reports/profit/export/pdf', requireAuth, reportController.exportProfitPDF);
router.get('/reports/stock/export/pdf', requireAuth, reportController.exportStockPDF);

module.exports = router;
