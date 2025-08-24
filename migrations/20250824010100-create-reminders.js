'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('reminders', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      patient_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'patients', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      type: { type: Sequelize.STRING(50) },
      title: { type: Sequelize.STRING(100) },
      message: { type: Sequelize.TEXT },
      scheduled_time: { type: Sequelize.DATE },
      status: { type: Sequelize.STRING(20), allowNull: false, defaultValue: 'pending' }
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('reminders');
  }
};


