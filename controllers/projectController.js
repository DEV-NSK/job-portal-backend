const Project = require('../models/Project');
const ProjectSubmission = require('../models/ProjectSubmission');
const { recordActivity } = require('./consistencyController');

// GET /api/projects
const getProjects = async (req, res) => {
  try {
    const { domain, difficulty, page = 1, limit = 20 } = req.query;
    const query = { isActive: true };
    if (domain) query.domain = domain;
    if (difficulty) query.difficulty = difficulty;

    const total = await Project.countDocuments(query);
    const projects = await Project.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    // Attach user's submission status
    const userSubs = await ProjectSubmission.find({ user: req.user._id }).select('project status');
    const subMap = {};
    userSubs.forEach(s => { subMap[s.project.toString()] = s.status; });

    res.json({
      projects: projects.map(p => ({
        ...p.toObject(),
        userStatus: subMap[p._id.toString()] || null
      })),
      total,
      pages: Math.ceil(total / limit)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/projects/:id
const getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const submission = await ProjectSubmission.findOne({ project: project._id, user: req.user._id });
    res.json({ ...project.toObject(), submission: submission || null });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/projects/:id/accept
const acceptProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const existing = await ProjectSubmission.findOne({ project: project._id, user: req.user._id });
    if (existing) return res.status(400).json({ message: 'Already accepted this project' });

    const deadline = new Date(Date.now() + project.durationHours * 3600000);
    const submission = await ProjectSubmission.create({
      project: project._id,
      user: req.user._id,
      deadline,
      status: 'in_progress'
    });

    res.status(201).json({ success: true, deadline, submissionId: submission._id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/projects/:id/submit
const submitProject = async (req, res) => {
  try {
    const submission = await ProjectSubmission.findOne({ project: req.params.id, user: req.user._id });
    if (!submission) return res.status(404).json({ message: 'No active submission found' });

    if (new Date() > submission.deadline) {
      return res.status(400).json({ message: 'Submission deadline has passed' });
    }

    const timeUsed = Math.round((Date.now() - submission.acceptedAt.getTime()) / 3600000);
    const testPassRate = Math.floor(Math.random() * 30 + 70); // Simulated
    const qualityScore = Math.floor(Math.random() * 20 + 65); // Simulated

    // Count other submissions for percentile
    const allSubs = await ProjectSubmission.find({ project: req.params.id, status: 'evaluated' });
    const betterSubs = allSubs.filter(s => s.testPassRate > testPassRate).length;
    const percentileRank = allSubs.length > 0
      ? Math.round(((allSubs.length - betterSubs) / allSubs.length) * 100)
      : 75;

    submission.status = 'evaluated';
    submission.submittedAt = new Date();
    submission.codeUrl = req.body.codeUrl || '';
    submission.testPassRate = testPassRate;
    submission.qualityScore = qualityScore;
    submission.timeUsed = `${timeUsed}h`;
    submission.percentileRank = percentileRank;
    submission.aiSummary = `Submission evaluated. Test pass rate: ${testPassRate}%. Code quality score: ${qualityScore}/100.`;
    await submission.save();

    await Project.findByIdAndUpdate(req.params.id, { $inc: { submissionsCount: 1 } });
    await recordActivity(req.user._id, 'codingProblems');

    res.json(submission);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/projects/my-submissions
const getMySubmissions = async (req, res) => {
  try {
    const submissions = await ProjectSubmission.find({ user: req.user._id })
      .populate('project', 'title company difficulty domain reward')
      .sort({ createdAt: -1 });
    res.json(submissions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/projects (employer creates project)
const createProject = async (req, res) => {
  try {
    const project = await Project.create({ ...req.body, employer: req.user._id });
    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getProjects, getProject, acceptProject, submitProject, getMySubmissions, createProject };
