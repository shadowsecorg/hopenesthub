'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class AiPrediction extends Model {
    static associate(models) {
      AiPrediction.belongsTo(models.Patient, { foreignKey: 'patient_id' });
    }
  }

  AiPrediction.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      patient_id: { type: DataTypes.INTEGER },
      prediction_type: { type: DataTypes.STRING(100) },
      value: { type: DataTypes.STRING(100) },
      confidence_score: { type: DataTypes.FLOAT },
      created_at: { type: DataTypes.DATE }
    },
    {
      sequelize,
      modelName: 'AiPrediction',
      tableName: 'ai_predictions',
      timestamps: true,
      updatedAt: false
    }
  );

  return AiPrediction;
};


