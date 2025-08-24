'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Symptom extends Model {
    static associate(models) {
      Symptom.belongsTo(models.Patient, { foreignKey: 'patient_id' });
    }
  }

  Symptom.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      patient_id: { type: DataTypes.INTEGER, allowNull: false },
      symptom_type: { type: DataTypes.STRING(50) },
      severity: { type: DataTypes.INTEGER },
      notes: { type: DataTypes.TEXT },
      recorded_at: { type: DataTypes.DATE }
    },
    {
      sequelize,
      modelName: 'Symptom',
      tableName: 'symptoms',
      timestamps: false
    }
  );

  return Symptom;
};


