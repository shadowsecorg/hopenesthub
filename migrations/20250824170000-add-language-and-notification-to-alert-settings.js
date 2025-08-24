'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('alert_settings', 'language', { type: Sequelize.STRING(5), allowNull: true });
    await queryInterface.addColumn('alert_settings', 'notification_preference', { type: Sequelize.STRING(10), allowNull: true });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('alert_settings', 'notification_preference');
    await queryInterface.removeColumn('alert_settings', 'language');
  }
};


