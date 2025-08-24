'use strict';

const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const password = await bcrypt.hash('ChangeMe123!', 8);

    // Users: admin, doctor, patient, caregiver
    await queryInterface.bulkInsert('users', [
      { id: 1, name: 'Admin User', email: 'admin@hopenest.local', password_hash: password, role_id: 1, status: 'active', created_at: new Date(), updated_at: new Date() },
      { id: 2, name: 'Dr. Strange', email: 'doctor@hopenest.local', password_hash: password, role_id: 2, status: 'active', created_at: new Date(), updated_at: new Date() },
      { id: 3, name: 'Patient Zero', email: 'patient@hopenest.local', password_hash: password, role_id: 3, status: 'active', created_at: new Date(), updated_at: new Date() },
      { id: 4, name: 'Care Giver', email: 'caregiver@hopenest.local', password_hash: password, role_id: 4, status: 'active', created_at: new Date(), updated_at: new Date() }
    ]);

    // Profiles
    await queryInterface.bulkInsert('doctors', [
      { id: 1, user_id: 2, specialization: 'Oncology', hospital_name: 'Hope Hospital', license_number: 'LIC123', created_at: new Date() }
    ]);

    await queryInterface.bulkInsert('patients', [
      { id: 1, user_id: 3, cancer_type: 'Breast Cancer', diagnosis_date: new Date('2024-06-01'), treatment_plan: 'Chemo', assigned_doctor_id: 2, created_at: new Date(), updated_at: new Date() }
    ]);

    await queryInterface.bulkInsert('caregivers', [
      { id: 1, user_id: 4, relationship: 'Family', created_at: new Date() }
    ]);

    await queryInterface.bulkInsert('patient_caregiver', [
      { id: 1, patient_id: 1, caregiver_id: 1 }
    ]);

    // Align sequences after explicit IDs
    const seqFixes = [
      "SELECT setval(pg_get_serial_sequence('roles','id'), (SELECT COALESCE(MAX(id),0) FROM roles))",
      "SELECT setval(pg_get_serial_sequence('users','id'), (SELECT COALESCE(MAX(id),0) FROM users))",
      "SELECT setval(pg_get_serial_sequence('doctors','id'), (SELECT COALESCE(MAX(id),0) FROM doctors))",
      "SELECT setval(pg_get_serial_sequence('patients','id'), (SELECT COALESCE(MAX(id),0) FROM patients))",
      "SELECT setval(pg_get_serial_sequence('caregivers','id'), (SELECT COALESCE(MAX(id),0) FROM caregivers))",
      "SELECT setval(pg_get_serial_sequence('patient_caregiver','id'), (SELECT COALESCE(MAX(id),0) FROM patient_caregiver))"
    ];
    for (const sql of seqFixes) {
      // eslint-disable-next-line no-await-in-loop
      await queryInterface.sequelize.query(sql);
    }
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('patient_caregiver', null, {});
    await queryInterface.bulkDelete('caregivers', null, {});
    await queryInterface.bulkDelete('patients', null, {});
    await queryInterface.bulkDelete('doctors', null, {});
    await queryInterface.bulkDelete('users', null, {});
  }
};


