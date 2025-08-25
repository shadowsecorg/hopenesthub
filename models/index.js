'use strict';

const { Sequelize, DataTypes } = require('sequelize');

const databaseUrl = process.env.DATABASE_URL;

const sequelize = new Sequelize(databaseUrl, {
  dialect: 'postgres',
  logging: false,
  define: {
    underscored: true
  }
});

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Models
db.Role = require('./role')(sequelize, DataTypes);
db.User = require('./user')(sequelize, DataTypes);
db.Patient = require('./patient')(sequelize, DataTypes);
db.Caregiver = require('./caregiver')(sequelize, DataTypes);
db.PatientCaregiver = require('./patient_caregiver')(sequelize, DataTypes);
db.Doctor = require('./doctor')(sequelize, DataTypes);
db.HealthMetric = require('./health_metric')(sequelize, DataTypes);
db.Symptom = require('./symptom')(sequelize, DataTypes);
db.Emotion = require('./emotion')(sequelize, DataTypes);
db.Medication = require('./medication')(sequelize, DataTypes);
db.Reminder = require('./reminder')(sequelize, DataTypes);
db.Message = require('./message')(sequelize, DataTypes);
db.ChatbotLog = require('./chatbot_log')(sequelize, DataTypes);
db.AiAlert = require('./ai_alert')(sequelize, DataTypes);
db.AiPrediction = require('./ai_prediction')(sequelize, DataTypes);
db.DoctorNote = require('./doctor_note')(sequelize, DataTypes);
db.Prescription = require('./prescription')(sequelize, DataTypes);
db.PatientReport = require('./patient_report')(sequelize, DataTypes);
db.AuditLog = require('./audit_log')(sequelize, DataTypes);
db.ApiToken = require('./api_token')(sequelize, DataTypes);
db.AlertSetting = require('./alert_setting')(sequelize, DataTypes);
db.SystemSetting = require('./system_setting')(sequelize, DataTypes);
db.WearableDevice = require('./wearable_device')(sequelize, DataTypes);

// Associations
Object.values(db)
  .filter((m) => m && typeof m.associate === 'function')
  .forEach((m) => m.associate(db));

module.exports = db;
