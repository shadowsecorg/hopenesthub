const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { sendNotification, getNotification, deleteNotification } = require('../controllers/notificationController');

const router = express.Router();

router.use(authenticateToken);
router.post('/send', sendNotification);
router.get('/:id', getNotification);
router.delete('/:id', deleteNotification);

module.exports = router;


