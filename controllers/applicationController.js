const Application = require('../models/Application');
const Job = require('../models/Job');
const Notification = require('../models/Notification');

const statusLabels = {
  pending: 'Under Review',
  reviewed: 'Reviewed',
  accepted: 'Accepted 🎉',
  rejected: 'Not Selected'
};

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

    const job = await Job.findByIdAndUpdate(jobId, { $inc: { applicantsCount: 1 } }, { new: true });

    // Notify employer: new applicant
    if (job) {
      await Notification.create({
        recipient: job.employer,
        type: 'application_received',
        title: 'New Application Received',
        message: `${req.user.name} applied for "${job.title}"`,
        link: `/employer/applicants/${jobId}`,
        application: application._id,
        job: job._id,
        relatedUser: req.user._id
      });
    }

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

    const oldStatus = app.status;
    app.status = status;
    await app.save();

    // Notify job seeker if status changed
    if (oldStatus !== status) {
      const label = statusLabels[status] || status;
      const messages = {
        accepted: `Congratulations! Your application for "${app.job.title}" at ${app.job.companyName} has been accepted.`,
        rejected: `Your application for "${app.job.title}" at ${app.job.companyName} was not selected this time.`,
        reviewed: `Your application for "${app.job.title}" at ${app.job.companyName} is being reviewed.`,
        pending: `Your application for "${app.job.title}" is back to pending review.`
      };
      await Notification.create({
        recipient: app.applicant,
        type: 'application_status',
        title: `Application ${label}`,
        message: messages[status] || `Your application status changed to ${label}.`,
        link: '/applied',
        application: app._id,
        job: app.job._id
      });
    }

    res.json(app);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { applyJob, getUserApplications, getJobApplications, updateStatus };
