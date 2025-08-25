'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('roles', 'permissions', { type: Sequelize.JSONB, allowNull: true });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('roles', 'permissions');
  }
};


