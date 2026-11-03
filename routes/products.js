const express = require('express');
const router = express.Router();
const { requireAuth, requireAdmin } = require('../middleware/auth');
const productController = require('../controllers/productController');

router.get('/products', requireAuth, productController.index);
router.post('/products', requireAuth, requireAdmin, productController.create);
router.post('/products/:id/update', requireAuth, requireAdmin, productController.update);
router.post('/products/:id/delete', requireAuth, requireAdmin, productController.delete);

// API
router.get('/api/products/search', requireAuth, productController.apiSearch);
router.get('/api/products/code/:code', requireAuth, productController.apiByCode);

module.exports = router;
