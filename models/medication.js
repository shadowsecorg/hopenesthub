'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Medication extends Model {
    static associate(models) {
      Medication.belongsTo(models.Patient, { foreignKey: 'patient_id' });
    }
  }

  Medication.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      patient_id: { type: DataTypes.INTEGER, allowNull: false },
      name: { type: DataTypes.STRING(100) },
      dosage: { type: DataTypes.STRING(50) },
      frequency: { type: DataTypes.STRING(50) },
      start_date: { type: DataTypes.DATEONLY },
      end_date: { type: DataTypes.DATEONLY }
    },
    {
      sequelize,
      modelName: 'Medication',
      tableName: 'medications',
      timestamps: false
    }
  );

  return Medication;
};


