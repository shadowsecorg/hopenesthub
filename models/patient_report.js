'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PatientReport extends Model {
    static associate(models) {
      PatientReport.belongsTo(models.Patient, { foreignKey: 'patient_id' });
    }
  }

  PatientReport.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      patient_id: { type: DataTypes.INTEGER },
      report_type: { type: DataTypes.STRING(50) },
      content: { type: DataTypes.JSONB },
      created_at: { type: DataTypes.DATE }
    },
    {
      sequelize,
      modelName: 'PatientReport',
      tableName: 'patient_reports',
      timestamps: true,
      updatedAt: false
    }
  );

  return PatientReport;
};


