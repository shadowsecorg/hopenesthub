const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { caregiverPatients, assignCaregiver, removeCaregiver } = require('../controllers/caregiverController');

const router = express.Router();

router.use(authenticateToken);
router.get('/:id/patients', caregiverPatients);
router.post('/:id/assign', assignCaregiver);
router.delete('/:id/patients/:pid', removeCaregiver);

module.exports = router;


