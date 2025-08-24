const db = require('../models');

async function chatbotMessage(req, res) {
  try {
    const { patient_id, question, answer } = req.body;
    if (!patient_id || !question) return res.status(400).json({ error: 'patient_id and question required' });
    const row = await db.ChatbotLog.create({ patient_id, question, answer, created_at: new Date() });
    res.status(201).json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function chatbotHistory(req, res) {
  try {
    const rows = await db.ChatbotLog.findAll({ order: [['created_at', 'DESC']], limit: 100 });
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function sendMessage(req, res) {
  try {
    const sender_id = req.user?.id;
    const receiver_id = parseInt(req.params.id_receiver, 10);
    const { content, message_type = 'text' } = req.body;
    if (!sender_id) return res.status(401).json({ error: 'Unauthorized' });
    const row = await db.Message.create({ sender_id, receiver_id, content, message_type, created_at: new Date() });
    res.status(201).json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function listMessages(req, res) {
  try {
    const user_id = req.user?.id;
    if (!user_id) return res.status(401).json({ error: 'Unauthorized' });
    const rows = await db.Message.findAll({
      where: db.sequelize.where(db.sequelize.literal(`${user_id} IN ("sender_id","receiver_id")`), true),
      order: [['created_at', 'DESC']],
      limit: 100
    });
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  chatbotMessage,
  chatbotHistory,
  sendMessage,
  listMessages
};


