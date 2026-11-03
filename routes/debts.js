const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const debtController = require('../controllers/debtController');

router.get('/debts', requireAuth, debtController.index);
router.post('/debts', requireAuth, debtController.create);
router.post('/debts/:id/pay', requireAuth, debtController.pay);
router.post('/debts/:id/delete', requireAuth, debtController.delete);

module.exports = router;
