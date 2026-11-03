const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const attendanceController = require('../controllers/attendanceController');

router.get('/attendance', requireAuth, attendanceController.index);
router.get('/attendance/create', requireAuth, attendanceController.createForm);
router.post('/attendance', requireAuth, attendanceController.store);
router.post('/attendance/check-in', requireAuth, attendanceController.checkIn);
router.post('/attendance/check-out', requireAuth, attendanceController.checkOut);
router.get('/attendance/:id/edit', requireAuth, attendanceController.edit);
router.post('/attendance/:id/update', requireAuth, attendanceController.update);
router.post('/attendance/:id/delete', requireAuth, attendanceController.destroy);
router.get('/api/attendance/today', requireAuth, attendanceController.apiToday);

module.exports = router;
