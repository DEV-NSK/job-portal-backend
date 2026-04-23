const Job = require('../models/Job');
const User = require('../models/User');
const Application = require('../models/Application');

// POST /api/recruiter/jobs/skill-match
const findSkillMatches = async (req, res) => {
  try {
    const { jobId, minThreshold = 70 } = req.body;
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    const requiredSkills = job.skills || [];
    if (requiredSkills.length === 0) return res.json({ matches: [] });

    const users = await User.find({ role: 'user', skills: { $exists: true, $ne: [] } })
      .select('name email avatar skills bio location');

    const matches = users.map(user => {
      const userSkills = user.skills || [];
      const matched = requiredSkills.filter(s => userSkills.map(u => u.toLowerCase()).includes(s.toLowerCase()));
      const matchPct = Math.round((matched.length / requiredSkills.length) * 100);
      const missing = requiredSkills.filter(s => !userSkills.map(u => u.toLowerCase()).includes(s.toLowerCase()));
      return { user, matchPct, matchedSkills: matched, missingSkills: missing };
    }).filter(m => m.matchPct >= minThreshold)
      .sort((a, b) => b.matchPct - a.matchPct);

    res.json({ matches: matches.slice(0, 50), total: matches.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/jobs/quick-apply
const quickApply = async (req, res) => {
  try {
    const { jobId } = req.body;
    const existing = await Application.findOne({ job: jobId, applicant: req.user._id });
    if (existing) return res.status(400).json({ message: 'Already applied' });

    const app = await Application.create({
      job: jobId,
      applicant: req.user._id,
      coverLetter: 'Quick apply via skill match',
      funnelStage: 'applied'
    });

    await Job.findByIdAndUpdate(jobId, { $inc: { applicantsCount: 1 } });
    res.status(201).json(app);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { findSkillMatches, quickApply };
