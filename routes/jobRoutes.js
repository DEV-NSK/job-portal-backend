const router = require('express').Router();
const { getJobs, getJobById, createJob, updateJob, deleteJob, bookmarkJob, unbookmarkJob, getBookmarkedJobs } = require('../controllers/jobController');
const { protect, employerOnly, adminOnly } = require('../middleware/authMiddleware');
const Job = require('../models/Job');

router.get('/', getJobs);
router.get('/bookmarked', protect, getBookmarkedJobs);
router.get('/employer/:employerId', async (req, res) => {
  try {
    const jobs = await Job.find({ 
      employer: req.params.employerId,
      status: 'active'
    }).sort({ createdAt: -1 });
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
router.get('/:id', getJobById);
router.post('/', protect, employerOnly, createJob);
router.post('/:id/bookmark', protect, bookmarkJob);
router.put('/:id', protect, employerOnly, updateJob);
router.delete('/:id', protect, deleteJob);
router.delete('/:id/bookmark', protect, unbookmarkJob);

module.exports = router;
