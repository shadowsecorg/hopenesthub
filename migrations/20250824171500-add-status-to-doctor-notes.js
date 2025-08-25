'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('doctor_notes', 'status', { type: Sequelize.STRING(20), allowNull: true, defaultValue: 'pending' });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('doctor_notes', 'status');
  }
};


