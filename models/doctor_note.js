'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class DoctorNote extends Model {
    static associate(models) {
      DoctorNote.belongsTo(models.Doctor, { foreignKey: 'doctor_id' });
      DoctorNote.belongsTo(models.Patient, { foreignKey: 'patient_id' });
    }
  }

  DoctorNote.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      doctor_id: { type: DataTypes.INTEGER },
      patient_id: { type: DataTypes.INTEGER },
      note_type: { type: DataTypes.STRING(50) },
      content: { type: DataTypes.TEXT },
      created_at: { type: DataTypes.DATE }
    },
    {
      sequelize,
      modelName: 'DoctorNote',
      tableName: 'doctor_notes',
      timestamps: true,
      updatedAt: false
    }
  );

  return DoctorNote;
};


