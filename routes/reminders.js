const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { updateReminder, deleteReminder } = require('../controllers/reminderController');

const router = express.Router();

router.use(authenticateToken);
router.put('/:id', updateReminder);
router.delete('/:id', deleteReminder);

module.exports = router;


