'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PatientCaregiver extends Model {
    static associate(models) {}
  }

  PatientCaregiver.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      patient_id: { type: DataTypes.INTEGER, allowNull: false },
      caregiver_id: { type: DataTypes.INTEGER, allowNull: false }
    },
    {
      sequelize,
      modelName: 'PatientCaregiver',
      tableName: 'patient_caregiver',
      timestamps: false,
      indexes: [
        { unique: true, fields: ['patient_id', 'caregiver_id'] }
      ]
    }
  );

  return PatientCaregiver;
};


