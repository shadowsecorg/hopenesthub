'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const now = new Date();

    await queryInterface.bulkInsert('health_metrics', [
      { patient_id: 1, source: 'fitbit', heart_rate: 72, spo2: 98, temperature: 36.7, steps: 3200, sleep_hours: 7.5, recorded_at: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000) },
      { patient_id: 1, source: 'fitbit', heart_rate: 75, spo2: 97, temperature: 36.8, steps: 5400, sleep_hours: 6.8, recorded_at: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000) },
      { patient_id: 1, source: 'fitbit', heart_rate: 68, spo2: 99, temperature: 36.6, steps: 4100, sleep_hours: 8.2, recorded_at: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000) },
      { patient_id: 1, source: 'fitbit', heart_rate: 79, spo2: 96, temperature: 36.9, steps: 6200, sleep_hours: 6.5, recorded_at: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000) },
      { patient_id: 1, source: 'fitbit', heart_rate: 71, spo2: 98, temperature: 36.7, steps: 3800, sleep_hours: 7.8, recorded_at: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) },
      { patient_id: 1, source: 'fitbit', heart_rate: 76, spo2: 97, temperature: 36.8, steps: 5100, sleep_hours: 7.2, recorded_at: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000) },
      { patient_id: 1, source: 'fitbit', heart_rate: 73, spo2: 98, temperature: 36.7, steps: 4500, sleep_hours: 7.0, recorded_at: now }
    ]);

    await queryInterface.bulkInsert('symptoms', [
      { patient_id: 1, symptom_type: 'nausea', severity: 2, notes: 'Morning only', recorded_at: now }
    ]);

    await queryInterface.bulkInsert('emotions', [
      { patient_id: 1, emotion_type: 'anxiety', intensity: 3, notes: 'Before checkup', recorded_at: now }
    ]);

    await queryInterface.bulkInsert('reminders', [
      { patient_id: 1, type: 'medication', title: 'Take pill', message: 'Morning dose', scheduled_time: now, status: 'pending' }
    ]);

    await queryInterface.bulkInsert('medications', [
      { patient_id: 1, name: 'Med-A', dosage: '500mg', frequency: 'daily', start_date: new Date('2024-06-02') }
    ]);

    await queryInterface.bulkInsert('messages', [
      { sender_id: 2, receiver_id: 3, message_type: 'text', content: 'How are you feeling today?', created_at: now },
      { sender_id: 3, receiver_id: 2, message_type: 'text', content: 'Feeling okay, slight nausea.', created_at: now }
    ]);

    await queryInterface.bulkInsert('chatbot_logs', [
      { patient_id: 1, question: 'What should I eat today?', answer: 'Light meals and stay hydrated.', created_at: now }
    ]);

    await queryInterface.bulkInsert('ai_alerts', [
      { patient_id: 1, alert_type: 'high_heart_rate', severity: 'low', description: 'Heart rate slightly elevated', status: 'active', created_at: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) },
      { patient_id: 1, alert_type: 'poor_sleep', severity: 'medium', description: 'Sleep quality below recommended levels', status: 'active', created_at: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000) },
      { patient_id: 1, alert_type: 'low_activity', severity: 'low', description: 'Daily step count below target', status: 'acknowledged', created_at: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000) }
    ]);

    await queryInterface.bulkInsert('ai_predictions', [
      { patient_id: 1, prediction_type: 'fatigue_risk', value: 'medium', confidence_score: 0.72, created_at: now }
    ]);

    await queryInterface.bulkInsert('doctor_notes', [
      { doctor_id: 1, patient_id: 1, note_type: 'visit', content: 'Routine follow-up. Monitor nausea.', created_at: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000) },
      { doctor_id: 1, patient_id: 1, note_type: 'consultation', content: 'Patient reports improved sleep quality. Continue current medication.', created_at: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000) },
      { doctor_id: 1, patient_id: 1, note_type: 'assessment', content: 'Blood pressure stable. Recommend increased physical activity.', created_at: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000) }
    ]);

    await queryInterface.bulkInsert('prescriptions', [
      { doctor_id: 1, patient_id: 1, medication_name: 'Med-A', dosage: '500mg', frequency: 'daily', start_date: new Date('2024-06-02'), end_date: new Date('2024-07-02') }
    ]);

    await queryInterface.bulkInsert('patient_reports', [
      { patient_id: 1, report_type: 'weekly_summary', content: JSON.stringify({ steps: 22000, avg_hr: 73 }), created_at: now }
    ]);

    await queryInterface.bulkInsert('audit_logs', [
      { user_id: 1, action: 'seed', details: 'Initial demo data inserted', created_at: now }
    ]);

    await queryInterface.bulkInsert('api_tokens', [
      { user_id: 1, token: 'demo-token-admin', expires_at: new Date(Date.now() + 7 * 24 * 3600 * 1000) }
    ]);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('api_tokens', null, {});
    await queryInterface.bulkDelete('audit_logs', null, {});
    await queryInterface.bulkDelete('patient_reports', null, {});
    await queryInterface.bulkDelete('prescriptions', null, {});
    await queryInterface.bulkDelete('doctor_notes', null, {});
    await queryInterface.bulkDelete('ai_predictions', null, {});
    await queryInterface.bulkDelete('ai_alerts', null, {});
    await queryInterface.bulkDelete('chatbot_logs', null, {});
    await queryInterface.bulkDelete('messages', null, {});
    await queryInterface.bulkDelete('medications', null, {});
    await queryInterface.bulkDelete('reminders', null, {});
    await queryInterface.bulkDelete('emotions', null, {});
    await queryInterface.bulkDelete('symptoms', null, {});
    await queryInterface.bulkDelete('health_metrics', null, {});
  }
};


