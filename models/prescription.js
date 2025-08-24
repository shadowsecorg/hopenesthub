'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Prescription extends Model {
    static associate(models) {
      Prescription.belongsTo(models.Doctor, { foreignKey: 'doctor_id' });
      Prescription.belongsTo(models.Patient, { foreignKey: 'patient_id' });
    }
  }

  Prescription.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      doctor_id: { type: DataTypes.INTEGER },
      patient_id: { type: DataTypes.INTEGER },
      medication_name: { type: DataTypes.STRING(100) },
      dosage: { type: DataTypes.STRING(50) },
      frequency: { type: DataTypes.STRING(50) },
      start_date: { type: DataTypes.DATEONLY },
      end_date: { type: DataTypes.DATEONLY }
    },
    {
      sequelize,
      modelName: 'Prescription',
      tableName: 'prescriptions',
      timestamps: false
    }
  );

  return Prescription;
};


