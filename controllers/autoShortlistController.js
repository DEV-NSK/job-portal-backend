const Application = require('../models/Application');
const CandidateRanking = require('../models/CandidateRanking');
const ShortlistAudit = require('../models/ShortlistAudit');
const Job = require('../models/Job');
const OpenAI = require('openai');

const getOpenAI = () => new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// POST /api/recruiter/shortlist
const autoShortlist = async (req, res) => {
  try {
    const { jobId, n = 10, diversityMode = false } = req.body;
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    const apps = await Application.find({ job: jobId, isVetoed: { $ne: true } })
      .populate('applicant', 'name email avatar skills bio location education');

    const rankings = await CandidateRanking.find({ job: jobId });
    const rankMap = {};
    rankings.forEach(r => { rankMap[r.candidate.toString()] = r.overallScore; });

    // Sort by score
    apps.sort((a, b) => (rankMap[b.applicant._id.toString()] || 0) - (rankMap[a.applicant._id.toString()] || 0));

    const topN = apps.slice(0, Math.min(n, apps.length));

    // Generate AI rationales
    const isBlind = job.blindMode;
    const rationalesPromises = topN.map(async (app) => {
      const score = rankMap[app.applicant._id.toString()] || 0;
      const skills = app.applicant.skills?.join(', ') || 'various skills';
      const prompt = isBlind
        ? `Generate a 2-sentence hiring rationale for a candidate with score ${score}/1000 who has skills: ${skills}. Do NOT mention name, college, or gender.`
        : `Generate a 2-sentence hiring rationale for ${app.applicant.name} with score ${score}/1000 and skills: ${skills}.`;
      try {
        const completion = await getOpenAI().chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 100
        });
        return completion.choices[0].message.content;
      } catch {
        return `Strong candidate with score ${score}/1000 and relevant skill set for this role.`;
      }
    });

    const rationales = await Promise.all(rationalesPromises);

    const result = topN.map((app, i) => ({
      applicationId: app._id,
      candidateId: app.applicant._id,
      candidate: isBlind ? {
        _id: app.applicant._id,
        name: `Candidate #${String(app.applicant._id).slice(-4).toUpperCase()}`,
        avatar: '',
        skills: app.applicant.skills
      } : app.applicant,
      score: rankMap[app.applicant._id.toString()] || 0,
      rationale: rationales[i],
      status: 'pending'
    }));

    res.json({ shortlist: result, jobId, n });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/recruiter/shortlist/approve
const approveShortlist = async (req, res) => {
  try {
    const { jobId, decisions } = req.body; // [{candidateId, action, rationale}]
    const auditEntries = decisions.map(d => ({
      job: jobId,
      recruiter: req.user._id,
      candidate: d.candidateId,
      action: d.action,
      rationale: d.rationale || ''
    }));
    await ShortlistAudit.insertMany(auditEntries);

    // Update application statuses
    for (const d of decisions) {
      if (d.action === 'accepted') {
        await Application.findOneAndUpdate(
          { job: jobId, applicant: d.candidateId },
          { isShortlisted: true, funnelStage: 'shortlisted' }
        );
      } else if (d.action === 'vetoed') {
        await Application.findOneAndUpdate(
          { job: jobId, applicant: d.candidateId },
          { isVetoed: true, funnelStage: 'rejected' }
        );
      }
    }

    res.json({ message: 'Shortlist approved', count: decisions.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { autoShortlist, approveShortlist };
