const Job = require('../models/Job');
const Application = require('../models/Application');
const User = require('../models/User');

const getUrgency = (score) => {
  if (score >= 80) return 'hot';
  if (score >= 50) return 'warm';
  return 'cool';
};

const computeOpportunityScore = async (job, userSkills) => {
  // Factor 1: Posting age (newer = higher score)
  const ageMs = Date.now() - new Date(job.createdAt).getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  const postingAge = Math.max(0, Math.round(100 - ageDays * 5));

  // Factor 2: Applicant volume (fewer = better opportunity)
  const applicantVolume = Math.max(0, Math.round(100 - job.applicantsCount * 2));

  // Factor 3: Hiring velocity (based on how recently job was updated)
  const hiringVelocity = postingAge > 70 ? 90 : postingAge > 40 ? 70 : 50;

  // Factor 4: Role match (skill overlap)
  const jobSkills = job.skills || [];
  const overlap = userSkills.filter(s =>
    jobSkills.some(js => js.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(js.toLowerCase()))
  ).length;
  const roleMatch = jobSkills.length > 0
    ? Math.min(99, Math.round(50 + (overlap / Math.max(jobSkills.length, 1)) * 50))
    : 70;

  // Factor 5: Competition density (inverse of applicants)
  const competition = Math.max(10, Math.round(100 - job.applicantsCount * 1.5));

  const score = Math.round((postingAge + applicantVolume + hiringVelocity + roleMatch + competition) / 5);

  return {
    score: Math.min(99, Math.max(1, score)),
    urgency: getUrgency(score),
    factors: {
      posting_age: Math.min(99, postingAge),
      applicant_volume: Math.min(99, applicantVolume),
      hiring_velocity: hiringVelocity,
      role_match: roleMatch,
      competition: Math.min(99, competition)
    }
  };
};

// GET /api/opportunity/jobs
const getOpportunityJobs = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const userSkills = user.skills || [];

    const { sort = 'opportunity', urgency, page = 1, limit = 20 } = req.query;
    const query = { isActive: true };

    const jobs = await Job.find(query)
      .sort({ createdAt: -1 })
      .limit(50); // Get more to score and filter

    // Compute opportunity scores
    const scoredJobs = await Promise.all(jobs.map(async (job) => {
      const { score, urgency: urg, factors } = await computeOpportunityScore(job, userSkills);
      return {
        _id: job._id,
        title: job.title,
        company: job.companyName,
        companyLogo: job.companyLogo,
        location: job.location,
        salary: job.salary,
        type: job.type,
        skills: job.skills,
        applicants: job.applicantsCount,
        posted: job.createdAt,
        opportunityScore: score,
        urgency: urg,
        matchPct: factors.role_match,
        factors
      };
    }));

    // Filter by urgency if requested
    let filtered = urgency ? scoredJobs.filter(j => j.urgency === urgency) : scoredJobs;

    // Sort
    if (sort === 'opportunity') filtered.sort((a, b) => b.opportunityScore - a.opportunityScore);
    else if (sort === 'match') filtered.sort((a, b) => b.matchPct - a.matchPct);
    else if (sort === 'recent') filtered.sort((a, b) => new Date(b.posted) - new Date(a.posted));

    const start = (page - 1) * limit;
    const paginated = filtered.slice(start, start + Number(limit));

    res.json({ jobs: paginated, total: filtered.length, pages: Math.ceil(filtered.length / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/opportunity/jobs/:jobId/score
const getJobScore = async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    const user = await User.findById(req.user._id);
    const { score, urgency, factors } = await computeOpportunityScore(job, user.skills || []);

    res.json({ score, urgency, factors, jobId: job._id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getOpportunityJobs, getJobScore };
