'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('wearable_devices', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      user_id: { type: Sequelize.INTEGER, allowNull: false },
      device_type: { type: Sequelize.STRING(50), allowNull: false },
      device_id: { type: Sequelize.STRING(100), allowNull: false, unique: true },
      status: { type: Sequelize.STRING(20), allowNull: false, defaultValue: 'connected' },
      last_sync: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') }
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('wearable_devices');
  }
};


