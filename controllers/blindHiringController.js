const Job = require('../models/Job');
const Application = require('../models/Application');
const BlindHiringReveal = require('../models/BlindHiringReveal');
const crypto = require('crypto');

// Generate deterministic pseudonym
const getPseudonym = (candidateId, jobId) => {
  const hash = crypto.createHash('sha256').update(`${candidateId}${jobId}`).digest('hex');
  return `Candidate #${hash.slice(0, 4).toUpperCase()}`;
};

// POST /api/recruiter/jobs/:jobId/blind-mode
const toggleBlindMode = async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    if (job.employer.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Forbidden' });
    if (job.blindModeLocked) return res.status(409).json({ message: 'Blind mode is locked after screening has begun' });

    job.blindMode = req.body.enabled;
    await job.save();
    res.json({ blindMode: job.blindMode });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/recruiter/blind/reveal
const revealIdentity = async (req, res) => {
  try {
    const { jobId, candidateId } = req.body;
    const app = await Application.findOne({ job: jobId, applicant: candidateId }).populate('applicant', 'name email avatar skills');
    if (!app) return res.status(404).json({ message: 'Application not found' });

    const allowedStages = ['shortlisted', 'interview_scheduled', 'interview_done', 'offer_extended', 'selected'];
    if (!allowedStages.includes(app.funnelStage)) {
      return res.status(403).json({ message: 'Can only reveal identity after candidate is shortlisted' });
    }

    await BlindHiringReveal.create({ job: jobId, recruiter: req.user._id, candidate: candidateId });
    res.json({ candidate: app.applicant });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { toggleBlindMode, revealIdentity, getPseudonym };
