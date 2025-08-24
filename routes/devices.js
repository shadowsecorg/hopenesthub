const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { registerDevice, getDevice, syncDevice, deviceMetrics } = require('../controllers/deviceController');

const router = express.Router();

router.use(authenticateToken);
router.post('/register', registerDevice);
router.get('/:id', getDevice);
router.post('/:id/sync', syncDevice);
router.get('/:id/metrics', deviceMetrics);

module.exports = router;


