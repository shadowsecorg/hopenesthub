'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Patient extends Model {
    static associate(models) {
      Patient.belongsTo(models.User, { foreignKey: 'user_id' });
      Patient.belongsTo(models.User, { foreignKey: 'assigned_doctor_id', as: 'assignedDoctor' });
      Patient.hasMany(models.HealthMetric, { foreignKey: 'patient_id' });
      Patient.hasMany(models.Symptom, { foreignKey: 'patient_id' });
      Patient.hasMany(models.Emotion, { foreignKey: 'patient_id' });
      Patient.hasMany(models.Medication, { foreignKey: 'patient_id' });
      Patient.hasMany(models.Reminder, { foreignKey: 'patient_id' });
      Patient.hasMany(models.ChatbotLog, { foreignKey: 'patient_id' });
      Patient.hasMany(models.AiAlert, { foreignKey: 'patient_id' });
      Patient.hasMany(models.AiPrediction, { foreignKey: 'patient_id' });
      Patient.hasMany(models.DoctorNote, { foreignKey: 'patient_id' });
      Patient.hasMany(models.Prescription, { foreignKey: 'patient_id' });
      Patient.hasMany(models.PatientReport, { foreignKey: 'patient_id' });
      Patient.belongsToMany(models.Caregiver, { through: models.PatientCaregiver, foreignKey: 'patient_id', otherKey: 'caregiver_id' });
      Patient.hasMany(models.WearableDevice, { foreignKey: 'user_id', sourceKey: 'user_id' });
    }
  }

  Patient.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      user_id: { type: DataTypes.INTEGER, allowNull: false, unique: true },
      cancer_type: { type: DataTypes.STRING(100) },
      diagnosis_date: { type: DataTypes.DATEONLY },
      treatment_plan: { type: DataTypes.TEXT },
      assigned_doctor_id: { type: DataTypes.INTEGER },
      health_status: { type: DataTypes.STRING(20), defaultValue: 'stable' },
      created_at: { type: DataTypes.DATE },
      updated_at: { type: DataTypes.DATE }
    },
    {
      sequelize,
      modelName: 'Patient',
      tableName: 'patients',
      timestamps: true
    }
  );

  return Patient;
};


