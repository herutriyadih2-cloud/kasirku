const express = require('express');
const router = express.Router();
const { requireAuth, requireAdmin } = require('../middleware/auth');
const categoryController = require('../controllers/categoryController');

router.get('/categories', requireAuth, categoryController.index);
router.post('/categories', requireAuth, requireAdmin, categoryController.create);
router.post('/categories/:id/update', requireAuth, requireAdmin, categoryController.update);
router.post('/categories/:id/delete', requireAuth, requireAdmin, categoryController.delete);

module.exports = router;
