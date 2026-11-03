const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const expenseController = require('../controllers/expenseController');

router.get('/expenses', requireAuth, expenseController.index);
router.post('/expenses', requireAuth, expenseController.create);
router.post('/expenses/:id/update', requireAuth, expenseController.update);
router.post('/expenses/:id/delete', requireAuth, expenseController.delete);

module.exports = router;
