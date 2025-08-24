'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class AiAlert extends Model {
    static associate(models) {
      AiAlert.belongsTo(models.Patient, { foreignKey: 'patient_id' });
    }
  }

  AiAlert.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      patient_id: { type: DataTypes.INTEGER },
      alert_type: { type: DataTypes.STRING(100) },
      severity: { type: DataTypes.STRING(20) },
      description: { type: DataTypes.TEXT },
      created_at: { type: DataTypes.DATE }
    },
    {
      sequelize,
      modelName: 'AiAlert',
      tableName: 'ai_alerts',
      timestamps: true,
      updatedAt: false
    }
  );

  return AiAlert;
};


