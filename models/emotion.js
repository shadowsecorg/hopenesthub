'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Emotion extends Model {
    static associate(models) {
      Emotion.belongsTo(models.Patient, { foreignKey: 'patient_id' });
    }
  }

  Emotion.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      patient_id: { type: DataTypes.INTEGER, allowNull: false },
      emotion_type: { type: DataTypes.STRING(50) },
      intensity: { type: DataTypes.INTEGER },
      notes: { type: DataTypes.TEXT },
      recorded_at: { type: DataTypes.DATE }
    },
    {
      sequelize,
      modelName: 'Emotion',
      tableName: 'emotions',
      timestamps: false
    }
  );

  return Emotion;
};


