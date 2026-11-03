const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const incomeController = require('../controllers/incomeController');

router.get('/incomes', requireAuth, incomeController.index);
router.post('/incomes', requireAuth, incomeController.create);
router.post('/incomes/:id/update', requireAuth, incomeController.update);
router.post('/incomes/:id/delete', requireAuth, incomeController.delete);

module.exports = router;
