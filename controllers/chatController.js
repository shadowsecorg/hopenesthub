function chatbotMessage(req, res) {
  res.json({ message: 'ok', route: 'chatbot message', body: req.body });
}

function chatbotHistory(req, res) {
  res.json({ message: 'ok', route: 'chatbot history' });
}

function sendMessage(req, res) {
  res.json({ message: 'ok', route: 'send message', to: req.params.id_receiver, body: req.body });
}

function listMessages(req, res) {
  res.json({ message: 'ok', route: 'list messages' });
}

module.exports = {
  chatbotMessage,
  chatbotHistory,
  sendMessage,
  listMessages
};


