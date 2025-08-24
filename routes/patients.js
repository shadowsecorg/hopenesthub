const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { listPatients, getPatient, createPatient, updatePatient, deletePatient } = require('../controllers/patientController');
const { addSymptom, listSymptoms } = require('../controllers/symptomController');
const { addEmotion, listEmotions } = require('../controllers/emotionController');
const { addMetrics, listMetrics, latestMetrics } = require('../controllers/metricsController');
const { createReminder, listReminders } = require('../controllers/reminderController');
const { createMedication, listMedications } = require('../controllers/medicationController');

const router = express.Router();

// Grouped auth for all patient routes
router.use(authenticateToken);

// CRUD patients
router.get('/', listPatients);
router.get('/:id', getPatient);
router.post('/', createPatient);
router.put('/:id', updatePatient);
router.delete('/:id', deletePatient);

// Symptoms
router.post('/:id/symptoms', addSymptom);
router.get('/:id/symptoms', listSymptoms);

// Emotions
router.post('/:id/emotions', addEmotion);
router.get('/:id/emotions', listEmotions);

// Metrics
router.post('/:id/metrics', addMetrics);
router.get('/:id/metrics', listMetrics);
router.get('/:id/metrics/latest', latestMetrics);

// Reminders
router.post('/:id/reminders', createReminder);
router.get('/:id/reminders', listReminders);

// Medications
router.post('/:id/medications', createMedication);
router.get('/:id/medications', listMedications);

module.exports = router;


