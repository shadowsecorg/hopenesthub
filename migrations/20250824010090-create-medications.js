'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('medications', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      patient_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'patients', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      name: { type: Sequelize.STRING(100) },
      dosage: { type: Sequelize.STRING(50) },
      frequency: { type: Sequelize.STRING(50) },
      start_date: { type: Sequelize.DATEONLY },
      end_date: { type: Sequelize.DATEONLY }
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('medications');
  }
};


