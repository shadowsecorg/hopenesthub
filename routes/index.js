const express = require('express');

const usersRoutes = require('./users');
const patientsRoutes = require('./patients');
const caregiversRoutes = require('./caregivers');
const doctorsRoutes = require('./doctors');
const aiRoutes = require('./ai');
const chatRoutes = require('./chat');
const devicesRoutes = require('./devices');
const adminRoutes = require('./admin');
const notificationsRoutes = require('./notifications');
const remindersRoutes = require('./reminders');

const router = express.Router();

// Keep original top-level auth endpoints like /register, /login, /logout, /profile
router.use('/', usersRoutes);
router.use('/patients', patientsRoutes);
router.use('/caregivers', caregiversRoutes);
router.use('/doctors', doctorsRoutes);
router.use('/ai', aiRoutes);
router.use('/', chatRoutes); // keeps /chatbot and /messages under /api/
router.use('/devices', devicesRoutes);
router.use('/admin', adminRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/reminders', remindersRoutes);

module.exports = router;


