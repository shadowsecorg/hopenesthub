'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class WearableDevice extends Model {
    static associate(models) {
      WearableDevice.belongsTo(models.User, { foreignKey: 'user_id' });
    }
  }

  WearableDevice.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      user_id: { type: DataTypes.INTEGER, allowNull: false },
      device_type: { type: DataTypes.STRING(50), allowNull: false },
      device_id: { type: DataTypes.STRING(100), allowNull: false },
      status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'connected' },
      last_sync: { type: DataTypes.DATE },
      created_at: { type: DataTypes.DATE },
      updated_at: { type: DataTypes.DATE }
    },
    {
      sequelize,
      modelName: 'WearableDevice',
      tableName: 'wearable_devices',
      timestamps: true
    }
  );

  return WearableDevice;
};


