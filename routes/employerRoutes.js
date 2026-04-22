const router = require('express').Router();
const Job = require('../models/Job');
const Application = require('../models/Application');
const { protect, employerOnly } = require('../middleware/authMiddleware');

router.get('/jobs', protect, employerOnly, async (req, res) => {
  try {
    const jobs = await Job.find({ employer: req.user._id }).sort({ createdAt: -1 });
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/applications', protect, employerOnly, async (req, res) => {
  try {
    const jobs = await Job.find({ employer: req.user._id }).select('_id');
    const jobIds = jobs.map(j => j._id);
    const apps = await Application.find({ job: { $in: jobIds } })
      .populate('job', 'title companyName')
      .populate('applicant', 'name email avatar skills phone')
      .sort({ createdAt: -1 });
    res.json(apps);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
