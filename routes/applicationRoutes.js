const router = require('express').Router();
const { applyJob, getUserApplications, getJobApplications, updateStatus } = require('../controllers/applicationController');
const { protect } = require('../middleware/authMiddleware');

router.post('/apply', protect, applyJob);
router.get('/user', protect, getUserApplications);
router.get('/job/:id', protect, getJobApplications);
router.put('/status', protect, updateStatus);

module.exports = router;
