const express = require('express');
const router = express.Router();
const { requireAuth, requireAdmin } = require('../middleware/auth');
const employeeController = require('../controllers/employeeController');

router.get('/employees', requireAuth, requireAdmin, employeeController.index);
router.post('/employees', requireAuth, requireAdmin, employeeController.create);
router.post('/employees/:id/update', requireAuth, requireAdmin, employeeController.update);
router.post('/employees/:id/delete', requireAuth, requireAdmin, employeeController.delete);

module.exports = router;
