'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('roles', [
      { name: 'admin', description: 'Administrator' },
      { name: 'doctor', description: 'Doctor' },
      { name: 'patient', description: 'Patient' },
      { name: 'caregiver', description: 'Caregiver' }
    ]);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('roles', null, {});
  }
};


