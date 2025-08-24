'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('patient_caregiver', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      patient_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'patients', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      caregiver_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'caregivers', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      }
    });
    await queryInterface.addConstraint('patient_caregiver', {
      type: 'unique',
      fields: ['patient_id', 'caregiver_id'],
      name: 'unique_patient_caregiver'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('patient_caregiver');
  }
};


