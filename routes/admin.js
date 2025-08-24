const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { adminUsers, adminReports, adminLogs, adminSettings } = require('../controllers/adminController');

const router = express.Router();

router.use(authenticateToken);
router.get('/users', adminUsers);
router.get('/reports', adminReports);
router.get('/logs', adminLogs);
router.post('/settings', adminSettings);

module.exports = router;


