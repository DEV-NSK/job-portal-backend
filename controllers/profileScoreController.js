const ReadinessScore = require('../models/ReadinessScore');
const { computeReadinessScore } = require('./copilotController');

// GET /api/profile-score
const getScore = async (req, res) => {
  try {
    const { score, dimensions, badge } = await computeReadinessScore(req.user._id);

    // Percentile
    const allLatest = await ReadinessScore.aggregate([
      { $sort: { createdAt: -1 } },
      { $group: { _id: '$user', score: { $first: '$score' } } }
    ]);
    const lower = allLatest.filter(u => u.score < score).length;
    const percentile = allLatest.length > 1
      ? Math.round((lower / allLatest.length) * 100)
      : 50;

    // Save snapshot
    await ReadinessScore.create({ user: req.user._id, score, dimensions, badge, percentile });

    res.json({ score, percentile, badge, dimensions });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/profile-score/history
const getHistory = async (req, res) => {
  try {
    const history = await ReadinessScore.find({ user: req.user._id })
      .sort({ createdAt: -1 }).limit(30);
    const data = history.reverse().map((h, i) => ({ day: i + 1, score: h.score, date: h.createdAt }));
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/profile-score/improvements
const getImprovements = async (req, res) => {
  try {
    const { dimensions } = await computeReadinessScore(req.user._id);

    const improvements = [];
    for (const dim of dimensions) {
      if (dim.score < 80) {
        const gap = 80 - dim.score;
        const gain = Math.round((gap / 100) * dim.weight);
        let action = '';
        switch (dim.name) {
          case 'Basic Info': action = 'Complete your bio, location, and phone number'; break;
          case 'Skills Listed': action = `Add ${Math.max(1, 8 - Math.floor(dim.score / 10))} more skills to your profile`; break;
          case 'Assessments': action = 'Complete a skill assessment in your target domain'; break;
          case 'Work Experience': action = 'Add your work experience with descriptions'; break;
          case 'Projects': action = 'Add 2 more projects to your portfolio'; break;
          case 'GitHub Activity': action = 'Connect your GitHub account'; break;
          case 'LeetCode Stats': action = 'Solve 10 more LeetCode problems'; break;
          case 'Peer Endorsements': action = 'Request endorsements from peers'; break;
          default: action = `Improve your ${dim.name}`;
        }
        improvements.push({ action, gain: Math.max(1, gain), effort: gain > 5 ? 'Medium' : 'Low', dimension: dim.name });
      }
    }

    improvements.sort((a, b) => b.gain - a.gain);
    res.json(improvements.slice(0, 4));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getScore, getHistory, getImprovements };
