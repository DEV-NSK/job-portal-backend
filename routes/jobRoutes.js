const router = require('express').Router();
const { getJobs, getJobById, createJob, updateJob, deleteJob } = require('../controllers/jobController');
const { protect, employerOnly, adminOnly } = require('../middleware/authMiddleware');

router.get('/', getJobs);
router.get('/:id', getJobById);
router.post('/', protect, employerOnly, createJob);
router.put('/:id', protect, employerOnly, updateJob);
router.delete('/:id', protect, deleteJob);

module.exports = router;
