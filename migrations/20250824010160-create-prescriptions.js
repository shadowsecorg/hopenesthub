'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('prescriptions', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      doctor_id: {
        type: Sequelize.INTEGER,
        references: { model: 'doctors', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      patient_id: {
        type: Sequelize.INTEGER,
        references: { model: 'patients', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      medication_name: { type: Sequelize.STRING(100) },
      dosage: { type: Sequelize.STRING(50) },
      frequency: { type: Sequelize.STRING(50) },
      start_date: { type: Sequelize.DATEONLY },
      end_date: { type: Sequelize.DATEONLY }
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('prescriptions');
  }
};


