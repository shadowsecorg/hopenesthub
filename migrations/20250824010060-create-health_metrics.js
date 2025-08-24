'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('health_metrics', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      patient_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'patients', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      source: { type: Sequelize.STRING(50) },
      heart_rate: { type: Sequelize.INTEGER },
      spo2: { type: Sequelize.INTEGER },
      ecg_data: { type: Sequelize.JSONB },
      temperature: { type: Sequelize.FLOAT },
      respiration_rate: { type: Sequelize.INTEGER },
      blood_pressure_sys: { type: Sequelize.INTEGER },
      blood_pressure_dia: { type: Sequelize.INTEGER },
      steps: { type: Sequelize.INTEGER },
      activity_minutes: { type: Sequelize.INTEGER },
      sleep_hours: { type: Sequelize.FLOAT },
      stress_level: { type: Sequelize.INTEGER },
      recorded_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') }
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('health_metrics');
  }
};


