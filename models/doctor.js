'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Doctor extends Model {
    static associate(models) {
      Doctor.belongsTo(models.User, { foreignKey: 'user_id' });
      Doctor.hasMany(models.DoctorNote, { foreignKey: 'doctor_id' });
      Doctor.hasMany(models.Prescription, { foreignKey: 'doctor_id' });
    }
  }

  Doctor.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      user_id: { type: DataTypes.INTEGER, allowNull: false, unique: true },
      specialization: { type: DataTypes.STRING(100) },
      hospital_name: { type: DataTypes.STRING(100) },
      license_number: { type: DataTypes.STRING(50) },
      created_at: { type: DataTypes.DATE }
    },
    {
      sequelize,
      modelName: 'Doctor',
      tableName: 'doctors',
      timestamps: true,
      updatedAt: false
    }
  );

  return Doctor;
};


