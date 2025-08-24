'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Caregiver extends Model {
    static associate(models) {
      Caregiver.belongsTo(models.User, { foreignKey: 'user_id' });
      Caregiver.belongsToMany(models.Patient, { through: models.PatientCaregiver, foreignKey: 'caregiver_id', otherKey: 'patient_id' });
    }
  }

  Caregiver.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      user_id: { type: DataTypes.INTEGER, allowNull: false, unique: true },
      relationship: { type: DataTypes.STRING(50) },
      created_at: { type: DataTypes.DATE }
    },
    {
      sequelize,
      modelName: 'Caregiver',
      tableName: 'caregivers',
      timestamps: true,
      updatedAt: false
    }
  );

  return Caregiver;
};


