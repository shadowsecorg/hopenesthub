const express = require('express');
const multer = require('multer');
const { register, login, logout, getProfile, updateProfile, uploadAvatar } = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.post('/register', register);
router.post('/login', login);

// Grouped auth for protected user routes
router.use(authenticateToken);
router.post('/logout', logout);
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.post('/profile/avatar', upload.single('avatar'), uploadAvatar);

module.exports = router;


