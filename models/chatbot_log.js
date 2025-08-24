'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ChatbotLog extends Model {
    static associate(models) {
      ChatbotLog.belongsTo(models.Patient, { foreignKey: 'patient_id' });
    }
  }

  ChatbotLog.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      patient_id: { type: DataTypes.INTEGER },
      question: { type: DataTypes.TEXT },
      answer: { type: DataTypes.TEXT },
      created_at: { type: DataTypes.DATE }
    },
    {
      sequelize,
      modelName: 'ChatbotLog',
      tableName: 'chatbot_logs',
      timestamps: true,
      updatedAt: false
    }
  );

  return ChatbotLog;
};


