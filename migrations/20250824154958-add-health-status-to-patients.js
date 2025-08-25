'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('patients', 'health_status', { type: Sequelize.STRING(20), allowNull: true });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('patients', 'health_status');
  }
};
