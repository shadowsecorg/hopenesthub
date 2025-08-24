const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { analyze, aiAlerts, recommendations, predictions } = require('../controllers/aiController');

const router = express.Router();

router.use(authenticateToken);
router.post('/analyze', analyze);
router.get('/patients/:id/alerts', aiAlerts);
router.post('/recommendations', recommendations);
router.get('/patients/:id/predictions', predictions);

module.exports = router;


