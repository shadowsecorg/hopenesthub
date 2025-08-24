'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Message extends Model {
    static associate(models) {
      Message.belongsTo(models.User, { foreignKey: 'sender_id', as: 'sender' });
      Message.belongsTo(models.User, { foreignKey: 'receiver_id', as: 'receiver' });
    }
  }

  Message.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      sender_id: { type: DataTypes.INTEGER },
      receiver_id: { type: DataTypes.INTEGER },
      message_type: { type: DataTypes.STRING(20) },
      content: { type: DataTypes.TEXT },
      created_at: { type: DataTypes.DATE }
    },
    {
      sequelize,
      modelName: 'Message',
      tableName: 'messages',
      timestamps: true,
      updatedAt: false
    }
  );

  return Message;
};


