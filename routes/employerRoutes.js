const router = require('express').Router();
const Job = require('../models/Job');
const Application = require('../models/Application');
const Employer = require('../models/Employer');
const User = require('../models/User');
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

// Public route to get employer profile
router.get('/profile/:employerId', async (req, res) => {
  try {
    const user = await User.findById(req.params.employerId).select('name email');
    if (!user || user.role !== 'employer') {
      return res.status(404).json({ message: 'Employer not found' });
    }
    
    const employer = await Employer.findOne({ userId: req.params.employerId });
    if (!employer) {
      return res.status(404).json({ message: 'Employer profile not found' });
    }
    
    res.json({ employer });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
