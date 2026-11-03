const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const printController = require('../controllers/printController');

router.post('/api/print/tcp', requireAuth, printController.tcpPrint);
router.post('/api/print/tcp/test', requireAuth, printController.testTcpPrint);

module.exports = router;
