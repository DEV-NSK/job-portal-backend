const Application = require('../models/Application');
const Job = require('../models/Job');

const applyJob = async (req, res) => {
  try {
    const { jobId, coverLetter } = req.body;
    const exists = await Application.findOne({ job: jobId, applicant: req.user._id });
    if (exists) return res.status(400).json({ message: 'Already applied' });
    const application = await Application.create({
      job: jobId,
      applicant: req.user._id,
      coverLetter,
      resume: req.user.resume
    });
    await Job.findByIdAndUpdate(jobId, { $inc: { applicantsCount: 1 } });
    res.status(201).json(application);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getUserApplications = async (req, res) => {
  try {
    const apps = await Application.find({ applicant: req.user._id })
      .populate('job', 'title companyName location type salary companyLogo')
      .sort({ createdAt: -1 });
    res.json(apps);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getJobApplications = async (req, res) => {
  try {
    const job = await Job.findOne({ _id: req.params.id, employer: req.user._id });
    if (!job) return res.status(403).json({ message: 'Not authorized' });
    const apps = await Application.find({ job: req.params.id })
      .populate('applicant', 'name email avatar skills resume phone')
      .sort({ createdAt: -1 });
    res.json(apps);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateStatus = async (req, res) => {
  try {
    const { applicationId, status } = req.body;
    const app = await Application.findById(applicationId).populate('job');
    if (!app || app.job.employer.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not authorized' });
    app.status = status;
    await app.save();
    res.json(app);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { applyJob, getUserApplications, getJobApplications, updateStatus };
