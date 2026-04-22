const CodingProblem = require('../models/CodingProblem');
const CodingSubmission = require('../models/CodingSubmission');
const UserXP = require('../models/UserXP');
const { recordActivity } = require('./consistencyController');

const todayStr = () => new Date().toISOString().split('T')[0];

// Reset today's XP if new day
const ensureTodayXP = async (userId) => {
  const today = todayStr();
  let xp = await UserXP.findOne({ user: userId });
  if (!xp) {
    return await UserXP.create({ user: userId, totalXP: 0, todayXP: 0, lastResetDate: today });
  }
  if (xp.lastResetDate !== today) {
    xp.todayXP = 0;
    xp.lastResetDate = today;
    await xp.save();
  }
  return xp;
};

// GET /api/coding/daily
const getDailyProblems = async (req, res) => {
  try {
    // Get user's solved problems today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const solvedToday = await CodingSubmission.find({
      user: req.user._id,
      status: 'accepted',
      createdAt: { $gte: today }
    }).distinct('problem');

    // Serve one of each difficulty
    const difficulties = ['Easy', 'Medium', 'Hard'];
    const problems = [];
    for (const diff of difficulties) {
      const problem = await CodingProblem.findOne({
        difficulty: diff,
        isActive: true,
        _id: { $nin: solvedToday }
      });
      if (problem) problems.push({ ...problem.toObject(), solved: false });
    }

    // If not enough problems, fill with any
    if (problems.length < 3) {
      const extra = await CodingProblem.find({ isActive: true }).limit(3 - problems.length);
      extra.forEach(p => problems.push({ ...p.toObject(), solved: solvedToday.includes(p._id.toString()) }));
    }

    res.json({ problems });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/coding/problems/:id
const getProblem = async (req, res) => {
  try {
    const problem = await CodingProblem.findById(req.params.id);
    if (!problem) return res.status(404).json({ message: 'Problem not found' });

    // Check if user already solved it
    const solved = await CodingSubmission.findOne({
      user: req.user._id,
      problem: problem._id,
      status: 'accepted'
    });

    res.json({ ...problem.toObject(), solved: !!solved });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/coding/problems (list all)
const getProblems = async (req, res) => {
  try {
    const { difficulty, topic, page = 1, limit = 20 } = req.query;
    const query = { isActive: true };
    if (difficulty) query.difficulty = difficulty;
    if (topic) query.topic = { $regex: topic, $options: 'i' };

    const total = await CodingProblem.countDocuments(query);
    const problems = await CodingProblem.find(query)
      .select('-testCases -optimalSolution -starterCode')
      .sort({ difficulty: 1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    // Mark solved
    const solvedIds = await CodingSubmission.find({ user: req.user._id, status: 'accepted' }).distinct('problem');
    const solvedSet = new Set(solvedIds.map(id => id.toString()));

    res.json({
      problems: problems.map(p => ({ ...p.toObject(), solved: solvedSet.has(p._id.toString()) })),
      total,
      pages: Math.ceil(total / limit)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/coding/problems/:id/submit
const submitSolution = async (req, res) => {
  try {
    const { code, language } = req.body;
    const problem = await CodingProblem.findById(req.params.id);
    if (!problem) return res.status(404).json({ message: 'Problem not found' });

    // Check if already solved (no double XP)
    const alreadySolved = await CodingSubmission.findOne({
      user: req.user._id,
      problem: problem._id,
      status: 'accepted'
    });

    // Simulate test execution against test cases
    const testResults = (problem.testCases || []).map(tc => ({
      input: tc.input,
      expected: tc.expectedOutput,
      output: tc.expectedOutput, // In real impl: run code via Judge0
      passed: true // Simulated: always pass for demo
    }));

    const allPassed = testResults.every(r => r.passed);
    const status = allPassed ? 'accepted' : 'wrong_answer';

    // XP calculation
    let xpEarned = 0;
    if (allPassed && !alreadySolved) {
      xpEarned = problem.xp;
      const xp = await ensureTodayXP(req.user._id);
      const isFirstToday = xp.todayXP === 0;
      if (isFirstToday) xpEarned *= 2; // double XP on first solve of day

      await UserXP.findOneAndUpdate(
        { user: req.user._id },
        { $inc: { totalXP: xpEarned, todayXP: xpEarned }, $push: { log: { amount: xpEarned, reason: `Solved: ${problem.title}` } } },
        { upsert: true }
      );

      // Record activity
      await recordActivity(req.user._id, 'codingProblems');
    }

    const submission = await CodingSubmission.create({
      user: req.user._id,
      problem: problem._id,
      code,
      language,
      status,
      runtime: `${Math.floor(Math.random() * 100 + 40)}ms`,
      memory: `${(Math.random() * 10 + 38).toFixed(1)}MB`,
      xpEarned,
      testResults
    });

    res.json({
      accepted: allPassed,
      status,
      runtime: submission.runtime,
      memory: submission.memory,
      xpEarned,
      testResults,
      submissionId: submission._id
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/coding/leaderboard
const getLeaderboard = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const leaderboard = await CodingSubmission.aggregate([
      { $match: { status: 'accepted', createdAt: { $gte: today } } },
      { $group: { _id: '$user', solved: { $addToSet: '$problem' }, xpEarned: { $sum: '$xpEarned' } } },
      { $project: { solved: { $size: '$solved' }, xpEarned: 1 } },
      { $sort: { xpEarned: -1, solved: -1 } },
      { $limit: 20 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $project: { name: '$user.name', avatar: '$user.avatar', solved: 1, xpEarned: 1 } }
    ]);

    const result = leaderboard.map((entry, i) => ({
      rank: i + 1,
      name: entry.name,
      avatar: entry.name?.slice(0, 2).toUpperCase(),
      solved: entry.solved,
      xp: entry.xpEarned,
      isYou: entry._id.toString() === req.user._id.toString()
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/coding/xp
const getXP = async (req, res) => {
  try {
    const xp = await ensureTodayXP(req.user._id);
    res.json({ total: xp.totalXP, today: xp.todayXP });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/coding/stats
const getStats = async (req, res) => {
  try {
    const solved = await CodingSubmission.find({ user: req.user._id, status: 'accepted' }).distinct('problem');
    const byDiff = await CodingSubmission.aggregate([
      { $match: { user: req.user._id, status: 'accepted' } },
      { $group: { _id: '$problem' } },
      { $lookup: { from: 'codingproblems', localField: '_id', foreignField: '_id', as: 'problem' } },
      { $unwind: '$problem' },
      { $group: { _id: '$problem.difficulty', count: { $sum: 1 } } }
    ]);
    res.json({ totalSolved: solved.length, byDifficulty: byDiff });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getDailyProblems, getProblem, getProblems, submitSolution, getLeaderboard, getXP, getStats };
