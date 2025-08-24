'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const now = new Date();
    await queryInterface.bulkInsert('roles', [
      { id: 1, name: 'admin', description: 'Administrator' },
      { id: 2, name: 'doctor', description: 'Doctor' },
      { id: 3, name: 'patient', description: 'Patient' },
      { id: 4, name: 'caregiver', description: 'Caregiver' }
    ]);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('roles', null, {});
  }
};


