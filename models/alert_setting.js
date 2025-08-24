'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class AlertSetting extends Model {
    static associate(models) {
      AlertSetting.belongsTo(models.User, { foreignKey: 'user_id' });
    }
  }

  AlertSetting.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      user_id: { type: DataTypes.INTEGER },
      heart_rate_threshold: { type: DataTypes.INTEGER },
      sleep_threshold: { type: DataTypes.INTEGER },
      activity_threshold: { type: DataTypes.INTEGER },
      language: { type: DataTypes.STRING(5) },
      notification_preference: { type: DataTypes.STRING(10) },
      created_at: { type: DataTypes.DATE },
      updated_at: { type: DataTypes.DATE }
    },
    {
      sequelize,
      modelName: 'AlertSetting',
      tableName: 'alert_settings',
      timestamps: true
    }
  );

  return AlertSetting;
};


