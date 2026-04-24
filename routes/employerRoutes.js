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
    const user = await User.findById(req.params.employerId).select('name email avatar role');
    if (!user || user.role !== 'employer') {
      return res.status(404).json({ message: 'Employer not found' });
    }
    
    // Try to find employer profile
    let employer = await Employer.findOne({ userId: req.params.employerId });
    
    // If no employer profile exists, get basic info from jobs
    if (!employer) {
      const jobs = await Job.find({ employer: req.params.employerId, isActive: true })
        .select('companyName companyLogo location category')
        .limit(1);
      
      // Create a basic employer object from job data or user data
      const basicEmployer = {
        userId: req.params.employerId,
        companyName: jobs.length > 0 ? jobs[0].companyName : user.name,
        companyLogo: jobs.length > 0 ? jobs[0].companyLogo : user.avatar || '',
        location: jobs.length > 0 ? jobs[0].location : '',
        industry: jobs.length > 0 ? jobs[0].category : '',
        description: `${jobs.length > 0 ? jobs[0].companyName : user.name} is actively hiring. Check out their open positions.`,
        website: '',
        companySize: '',
        culture: '',
        benefits: '',
        founded: ''
      };
      
      return res.json({ employer: basicEmployer });
    }
    
    // If employer profile exists but companyLogo is empty, use user avatar
    if (!employer.companyLogo && user.avatar) {
      employer.companyLogo = user.avatar;
    }
    
    // Convert to plain object to allow modifications
    const employerData = employer.toObject();
    
    // Ensure companyLogo falls back to user avatar if still empty
    if (!employerData.companyLogo && user.avatar) {
      employerData.companyLogo = user.avatar;
    }
    
    res.json({ employer: employerData });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
