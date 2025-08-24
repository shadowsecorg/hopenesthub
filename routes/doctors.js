const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { doctorPatients, patientReport, addNote, addPrescription, doctorAlert, doctorAnalytics } = require('../controllers/doctorController');

const router = express.Router();

router.use(authenticateToken);
router.get('/:id/patients', doctorPatients);
router.get('/:id/patients/:pid/report', patientReport);
router.post('/:id/patients/:pid/notes', addNote);
router.post('/:id/patients/:pid/prescriptions', addPrescription);
router.post('/:id/alerts', doctorAlert);
router.get('/:id/analytics', doctorAnalytics);

module.exports = router;


