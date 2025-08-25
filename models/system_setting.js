'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class SystemSetting extends Model {
    static associate(models) {}
  }

  SystemSetting.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      key: { type: DataTypes.STRING(100), allowNull: false, unique: true },
      value: { type: DataTypes.JSONB },
      created_at: { type: DataTypes.DATE },
      updated_at: { type: DataTypes.DATE }
    },
    {
      sequelize,
      modelName: 'SystemSetting',
      tableName: 'system_settings',
      timestamps: true
    }
  );

  return SystemSetting;
};


