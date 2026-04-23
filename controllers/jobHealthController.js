const Job = require('../models/Job');
const Application = require('../models/Application');
const JobHealth = require('../models/JobHealth');

// Compute health score for a job
const computeHealthScore = async (jobId) => {
  const job = await Job.findById(jobId);
  if (!job) return null;

  const now = new Date();
  const openDays = Math.floor((now - job.createdAt) / (1000 * 60 * 60 * 24));

  const apps = await Application.find({ job: jobId });
  const last7d = apps.filter(a => (now - a.createdAt) < 7 * 24 * 60 * 60 * 1000);
  const last48h = apps.filter(a => (now - a.createdAt) < 48 * 60 * 60 * 1000);
  const shortlisted = apps.filter(a => a.isShortlisted);

  const target7d = 10;
  const targetShortlist = 5;
  const avgScore = apps.reduce((s, a) => s + (a.rankingScore || 500), 0) / (apps.length || 1);

  const health = Math.min(100, Math.round(
    (last7d.length / target7d) * 40 +
    (avgScore / 1000) * 40 +
    (shortlisted.length / targetShortlist) * 20
  ));

  const tier = health < 40 ? 'promoted' : health < 70 ? 'standard' : 'high';
  const isUrgent = openDays > 14 && health < 40;
  const isHot = last48h.length > 50 && avgScore > 600;

  return { healthScore: health, tier, isUrgent, isHot };
};

// GET /api/recruiter/jobs/:jobId/health
const getJobHealth = async (req, res) => {
  try {
    let health = await JobHealth.findOne({ job: req.params.jobId });
    if (!health) {
      const computed = await computeHealthScore(req.params.jobId);
      if (!computed) return res.status(404).json({ message: 'Job not found' });
      health = await JobHealth.create({ job: req.params.jobId, ...computed });
    }
    res.json(health);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/recruiter/jobs/:jobId/tier
const overrideTier = async (req, res) => {
  try {
    const { tier, lockDays } = req.body;
    const lockUntil = new Date();
    lockUntil.setDate(lockUntil.getDate() + (lockDays || 7));

    const job = await Job.findByIdAndUpdate(req.params.jobId, { tier, tierLockedUntil: lockUntil }, { new: true });
    await JobHealth.findOneAndUpdate({ job: req.params.jobId }, { tier, tierLockedUntil: lockUntil }, { upsert: true });
    res.json(job);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/recruiter/jobs/health-overview
const getHealthOverview = async (req, res) => {
  try {
    const jobs = await Job.find({ employer: req.user._id, isActive: true });
    const results = await Promise.all(jobs.map(async (job) => {
      let health = await JobHealth.findOne({ job: job._id });
      if (!health) {
        const computed = await computeHealthScore(job._id);
        health = computed || { healthScore: 50, tier: 'standard', isUrgent: false, isHot: false };
      }
      return { job, health };
    }));
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getJobHealth, overrideTier, getHealthOverview, computeHealthScore };
