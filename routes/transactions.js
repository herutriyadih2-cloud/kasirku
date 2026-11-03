const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const transactionController = require('../controllers/transactionController');

router.get('/transactions', requireAuth, transactionController.index);
router.get('/transactions/pos', requireAuth, transactionController.pos);
router.post('/transactions', requireAuth, transactionController.store);
router.post('/transactions/:id/status', requireAuth, transactionController.updateStatus);
router.post('/transactions/:id/advance', requireAuth, transactionController.advanceStatus);
router.get('/transactions/:id/print', requireAuth, transactionController.print);
router.post('/transactions/:id/cancel', requireAuth, transactionController.cancel);

module.exports = router;
