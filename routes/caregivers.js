const express = require('express');
const { requireRoleApi } = require('../middleware/auth');
const { caregiverPatients, assignCaregiver, removeCaregiver } = require('../controllers/caregiverController');

const router = express.Router();

router.use(requireRoleApi('caregiver'));
router.get('/:id/patients', caregiverPatients);
router.post('/:id/assign', assignCaregiver);
router.delete('/:id/patients/:pid', removeCaregiver);

module.exports = router;


