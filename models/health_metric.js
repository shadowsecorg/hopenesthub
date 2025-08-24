'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class HealthMetric extends Model {
    static associate(models) {
      HealthMetric.belongsTo(models.Patient, { foreignKey: 'patient_id' });
    }
  }

  HealthMetric.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      patient_id: { type: DataTypes.INTEGER, allowNull: false },
      source: { type: DataTypes.STRING(50) },
      heart_rate: { type: DataTypes.INTEGER },
      spo2: { type: DataTypes.INTEGER },
      ecg_data: { type: DataTypes.JSONB },
      temperature: { type: DataTypes.FLOAT },
      respiration_rate: { type: DataTypes.INTEGER },
      blood_pressure_sys: { type: DataTypes.INTEGER },
      blood_pressure_dia: { type: DataTypes.INTEGER },
      steps: { type: DataTypes.INTEGER },
      activity_minutes: { type: DataTypes.INTEGER },
      sleep_hours: { type: DataTypes.FLOAT },
      stress_level: { type: DataTypes.INTEGER },
      recorded_at: { type: DataTypes.DATE }
    },
    {
      sequelize,
      modelName: 'HealthMetric',
      tableName: 'health_metrics',
      timestamps: false
    }
  );

  return HealthMetric;
};


