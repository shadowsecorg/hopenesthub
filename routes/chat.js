const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { chatbotMessage, chatbotHistory, sendMessage, listMessages } = require('../controllers/chatController');

const router = express.Router();

router.use(authenticateToken);
router.post('/chatbot/message', chatbotMessage);
router.get('/chatbot/history', chatbotHistory);
router.post('/messages/:id_receiver', sendMessage);
router.get('/messages', listMessages);

module.exports = router;


