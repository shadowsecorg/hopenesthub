'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('ai_alerts', 'status', {
      type: Sequelize.STRING(20),
      allowNull: false,
      defaultValue: 'active'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('ai_alerts', 'status');
  }
};


