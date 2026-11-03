const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const customerController = require('../controllers/customerController');

router.get('/customers', requireAuth, customerController.index);
router.post('/customers', requireAuth, customerController.create);
router.post('/customers/:id/update', requireAuth, customerController.update);
router.post('/customers/:id/delete', requireAuth, customerController.delete);

module.exports = router;
