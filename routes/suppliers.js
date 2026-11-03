const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const supplierController = require('../controllers/supplierController');

router.get('/suppliers', requireAuth, supplierController.index);
router.post('/suppliers', requireAuth, supplierController.create);
router.post('/suppliers/:id/update', requireAuth, supplierController.update);
router.post('/suppliers/:id/delete', requireAuth, supplierController.delete);

module.exports = router;
