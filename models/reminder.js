'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Reminder extends Model {
    static associate(models) {
      Reminder.belongsTo(models.Patient, { foreignKey: 'patient_id' });
    }
  }

  Reminder.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      patient_id: { type: DataTypes.INTEGER, allowNull: false },
      type: { type: DataTypes.STRING(50) },
      title: { type: DataTypes.STRING(100) },
      message: { type: DataTypes.TEXT },
      scheduled_time: { type: DataTypes.DATE },
      status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'pending' }
    },
    {
      sequelize,
      modelName: 'Reminder',
      tableName: 'reminders',
      timestamps: false
    }
  );

  return Reminder;
};


