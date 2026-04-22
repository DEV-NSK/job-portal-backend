const router = require('express').Router();
const upload = require('../middleware/upload');
const { getProfile, updateProfile } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.get('/profile', protect, getProfile);
router.get('/profile/:id', protect, getProfile);
router.put('/profile', protect, upload.single('avatar'), updateProfile);
router.put('/resume', protect, upload.single('resume'), updateProfile);

module.exports = router;
