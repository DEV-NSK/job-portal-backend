const MicroInternship = require('../models/MicroInternship');
const MicroInternshipSubmission = require('../models/MicroInternshipSubmission');
const Application = require('../models/Application');
const OpenAI = require('openai');

const getOpenAI = () => new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// GET /api/marketplace/micro-internships
const getMarketplace = async (req, res) => {
  try {
    const { skills, duration, page = 1, limit = 12 } = req.query;
    const query = { status: 'active' };
    if (skills) query.skills = { $in: skills.split(',') };
    if (duration) query.durationDays = { $lte: parseInt(duration) };

    const internships = await MicroInternship.find(query)
      .populate('recruiter', 'name avatar')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await MicroInternship.countDocuments(query);
    res.json({ internships, total, page: parseInt(page) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/marketplace/micro-internships
const createInternship = async (req, res) => {
  try {
    const { title, description, skills, durationDays, compensation, maxCandidates, deliverable, rubric } = req.body;
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + (durationDays || 3));
    const internship = await MicroInternship.create({
      recruiter: req.user._id, title, description, skills, durationDays, compensation, maxCandidates, deliverable, rubric, deadline
    });
    res.status(201).json(internship);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/marketplace/micro-internships/:id/apply
const applyToInternship = async (req, res) => {
  try {
    const internship = await MicroInternship.findById(req.params.id);
    if (!internship) return res.status(404).json({ message: 'Not found' });
    if (internship.applicants.includes(req.user._id)) return res.status(400).json({ message: 'Already applied' });
    internship.applicants.push(req.user._id);
    await internship.save();
    res.json({ message: 'Applied successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/marketplace/micro-internships/:id/accept/:candidateId
const acceptCandidate = async (req, res) => {
  try {
    const internship = await MicroInternship.findById(req.params.id);
    if (!internship) return res.status(404).json({ message: 'Not found' });
    if (internship.accepted.length >= internship.maxCandidates) return res.status(400).json({ message: 'Max candidates reached' });
    if (!internship.accepted.includes(req.params.candidateId)) {
      internship.accepted.push(req.params.candidateId);
      await internship.save();
    }
    res.json({ message: 'Candidate accepted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/marketplace/micro-internships/:id/submit
const submitWork = async (req, res) => {
  try {
    const { deliverableText, deliverableUrl } = req.body;
    const internship = await MicroInternship.findById(req.params.id);
    if (!internship) return res.status(404).json({ message: 'Not found' });
    if (new Date() > internship.deadline) return res.status(400).json({ message: 'Deadline passed' });

    let submission = await MicroInternshipSubmission.findOne({ internship: req.params.id, candidate: req.user._id });
    if (!submission) {
      submission = new MicroInternshipSubmission({ internship: req.params.id, candidate: req.user._id });
    }
    submission.deliverableText = deliverableText || '';
    submission.deliverableUrl = deliverableUrl || '';
    submission.submittedAt = new Date();
    await submission.save();

    // Auto-evaluate with AI
    if (deliverableText && internship.rubric) {
      try {
        const completion = await getOpenAI().chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [{
            role: 'user',
            content: `Evaluate this submission against the rubric.\nRubric: ${internship.rubric}\nSubmission: ${deliverableText.slice(0, 500)}\nRespond with JSON: {"score": 0-100, "evaluation": "excellent|good|below_expectation", "feedback": "brief feedback"}`
          }],
          max_tokens: 200
        });
        const result = JSON.parse(completion.choices[0].message.content);
        submission.score = result.score || 50;
        submission.evaluation = result.evaluation || 'good';
        await submission.save();
      } catch { /* use defaults */ }
    }

    res.json(submission);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/marketplace/micro-internships/:id/submissions
const getSubmissions = async (req, res) => {
  try {
    const submissions = await MicroInternshipSubmission.find({ internship: req.params.id })
      .populate('candidate', 'name email avatar skills');
    res.json(submissions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/marketplace/micro-internships/:id/evaluate/:submissionId
const evaluateSubmission = async (req, res) => {
  try {
    const { evaluation, recruiterNotes } = req.body;
    const submission = await MicroInternshipSubmission.findByIdAndUpdate(
      req.params.submissionId,
      { evaluation, recruiterNotes },
      { new: true }
    );
    res.json(submission);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/marketplace/micro-internships/:id/fast-track/:candidateId
const fastTrack = async (req, res) => {
  try {
    const internship = await MicroInternship.findById(req.params.id);
    if (!internship) return res.status(404).json({ message: 'Not found' });

    // Create application record
    const app = await Application.create({
      job: internship.recruiter, // placeholder - in real app would link to a job
      applicant: req.params.candidateId,
      funnelStage: 'interview_scheduled',
      isShortlisted: true
    });

    await MicroInternshipSubmission.findOneAndUpdate(
      { internship: req.params.id, candidate: req.params.candidateId },
      { fastTracked: true }
    );

    res.json({ message: 'Fast-tracked to interview', application: app });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/marketplace/micro-internships/my
const getMyInternships = async (req, res) => {
  try {
    const submissions = await MicroInternshipSubmission.find({ candidate: req.user._id })
      .populate('internship');
    res.json(submissions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getMarketplace, createInternship, applyToInternship, acceptCandidate, submitWork, getSubmissions, evaluateSubmission, fastTrack, getMyInternships };
