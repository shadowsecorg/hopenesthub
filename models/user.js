'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.belongsTo(models.Role, { foreignKey: 'role_id' });
      User.hasOne(models.Patient, { foreignKey: 'user_id' });
      User.hasOne(models.Caregiver, { foreignKey: 'user_id' });
      User.hasOne(models.Doctor, { foreignKey: 'user_id' });
      User.hasMany(models.Message, { foreignKey: 'sender_id', as: 'sentMessages' });
      User.hasMany(models.Message, { foreignKey: 'receiver_id', as: 'receivedMessages' });
      User.hasMany(models.ApiToken, { foreignKey: 'user_id' });
      User.hasMany(models.AuditLog, { foreignKey: 'user_id' });
    }
  }

  User.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      name: { type: DataTypes.STRING(100), allowNull: false },
      email: { type: DataTypes.STRING(100), allowNull: false, unique: true },
      phone: { type: DataTypes.STRING(20) },
      password_hash: { type: DataTypes.TEXT, allowNull: false },
      date_of_birth: { type: DataTypes.DATEONLY },
      gender: { type: DataTypes.STRING(10) },
      role_id: { type: DataTypes.INTEGER },
      status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'active' },
      is_verified: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      created_at: { type: DataTypes.DATE },
      updated_at: { type: DataTypes.DATE }
    },
    {
      sequelize,
      modelName: 'User',
      tableName: 'users',
      timestamps: true
    }
  );

  return User;
};


