const Application = require('../models/Application');
const CandidateRanking = require('../models/CandidateRanking');
const RecruiterPin = require('../models/RecruiterPin');
const User = require('../models/User');
const Job = require('../models/Job');

// Compute ranking score from factors + weights
const computeScore = (factors, weights) => {
  const w = weights || { skillMatch: 0.30, codingScore: 0.25, consistency: 0.20, profileStrength: 0.15, reputationScore: 0.10 };
  return Math.round(
    (factors.skillMatch || 0) * w.skillMatch +
    (factors.codingScore || 0) * w.codingScore +
    (factors.consistency || 0) * w.consistency +
    (factors.profileStrength || 0) * w.profileStrength +
    (factors.reputationScore || 0) * w.reputationScore
  );
};

// GET /api/recruiter/jobs/:jobId/applicants/ranked
const getRankedApplicants = async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    const apps = await Application.find({ job: jobId, isVetoed: { $ne: true } })
      .populate('applicant', 'name email avatar skills bio github linkedin');

    // Compute or fetch scores
    const ranked = await Promise.all(apps.map(async (app) => {
      let ranking = await CandidateRanking.findOne({ job: jobId, candidate: app.applicant._id });
      if (!ranking) {
        // Generate mock scores based on profile completeness
        const u = app.applicant;
        const skillMatch = job.skills?.length > 0
          ? Math.round((u.skills?.filter(s => job.skills.includes(s)).length / job.skills.length) * 1000)
          : Math.floor(Math.random() * 600) + 200;
        const factors = {
          skillMatch: Math.min(skillMatch, 1000),
          codingScore: Math.floor(Math.random() * 700) + 200,
          consistency: Math.floor(Math.random() * 700) + 200,
          profileStrength: u.skills?.length > 3 ? 700 : 400,
          reputationScore: Math.floor(Math.random() * 500) + 200
        };
        ranking = await CandidateRanking.create({ job: jobId, candidate: app.applicant._id, ...factors, overallScore: computeScore(factors) });
      }
      return {
        applicationId: app._id,
        candidateId: app.applicant._id,
        candidate: app.applicant,
        funnelStage: app.funnelStage,
        isShortlisted: app.isShortlisted,
        factors: {
          skillMatch: ranking.skillMatch,
          codingScore: ranking.codingScore,
          consistency: ranking.consistency,
          profileStrength: ranking.profileStrength,
          reputationScore: ranking.reputationScore
        },
        overallScore: ranking.overallScore
      };
    }));

    ranked.sort((a, b) => b.overallScore - a.overallScore);

    // Attach pins
    const pins = await RecruiterPin.find({ recruiter: req.user._id, job: jobId });
    const pinnedIds = new Set(pins.map(p => p.candidate.toString()));
    ranked.forEach(r => {
      r.isPinned = pinnedIds.has(r.candidateId.toString());
      const pin = pins.find(p => p.candidate.toString() === r.candidateId.toString());
      r.recruiterNote = pin?.note || '';
    });

    res.json(ranked);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/recruiter/pins
const pinCandidate = async (req, res) => {
  try {
    const { jobId, candidateId, note } = req.body;
    const pin = await RecruiterPin.findOneAndUpdate(
      { recruiter: req.user._id, job: jobId, candidate: candidateId },
      { note: note || '' },
      { upsert: true, new: true }
    );
    res.json(pin);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/recruiter/pins/:jobId/:candidateId
const unpinCandidate = async (req, res) => {
  try {
    await RecruiterPin.findOneAndDelete({ recruiter: req.user._id, job: req.params.jobId, candidate: req.params.candidateId });
    res.json({ message: 'Unpinned' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getRankedApplicants, pinCandidate, unpinCandidate, computeScore };
