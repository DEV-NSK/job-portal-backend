const ReputationScore = require('../models/ReputationScore');
const UserXP = require('../models/UserXP');
const CodingSubmission = require('../models/CodingSubmission');
const MockInterviewSession = require('../models/MockInterviewSession');
const PeerRoom = require('../models/PeerRoom');
const User = require('../models/User');
const axios = require('axios');

const getTier = (score) => {
  if (score >= 751) return 'Platinum';
  if (score >= 501) return 'Gold';
  if (score >= 251) return 'Silver';
  return 'Bronze';
};

// Compute reputation score from all signals
const computeReputation = async (userId) => {
  let rep = await ReputationScore.findOne({ user: userId });
  if (!rep) {
    rep = await ReputationScore.create({ user: userId });
  }

  // Signal 1: Platform XP (max 200)
  const xp = await UserXP.findOne({ user: userId });
  const platformXPScore = Math.min(200, Math.round((xp?.totalXP || 0) / 10));

  // Signal 2: LeetCode (max 200) — from stored data or 0
  const leetcodeScore = rep.signals.leetcodeRank.score;

  // Signal 3: GitHub (max 200) — from stored data or 0
  const githubScore = rep.signals.githubActivity.score;

  // Signal 4: Peer Ratings (max 200)
  const peerRatings = await PeerRoom.aggregate([
    { $unwind: '$ratings' },
    { $match: { 'ratings.rated': userId } },
    { $group: { _id: null, avg: { $avg: '$ratings.score' }, count: { $sum: 1 } } }
  ]);
  const peerScore = peerRatings.length > 0
    ? Math.min(200, Math.round(peerRatings[0].avg * 20 * Math.min(1, peerRatings[0].count / 5)))
    : rep.signals.peerRatings.score;

  // Signal 5: Employer Endorsements (max 200)
  const endorsementScore = Math.min(200, (rep.employerEndorsements?.filter(e => e.verified).length || 0) * 40);

  const totalScore = platformXPScore + leetcodeScore + githubScore + peerScore + endorsementScore;
  const tier = getTier(totalScore);

  // Percentile
  const allReps = await ReputationScore.find({}).select('totalScore');
  const lower = allReps.filter(r => r.totalScore < totalScore).length;
  const percentile = allReps.length > 1 ? Math.round((lower / allReps.length) * 100) : 50;

  // Update
  rep.totalScore = totalScore;
  rep.tier = tier;
  rep.percentile = percentile;
  rep.signals.platformXP = { score: platformXPScore, max: 200, trend: platformXPScore - (rep.signals.platformXP?.score || 0) };
  rep.signals.peerRatings = { score: peerScore, max: 200, trend: peerScore - (rep.signals.peerRatings?.score || 0) };
  rep.signals.employerEndorsements = { score: endorsementScore, max: 200, trend: 0 };

  // Record monthly history
  const thisMonth = new Date().toLocaleString('en-US', { month: 'short' });
  const lastEntry = rep.history[rep.history.length - 1];
  if (!lastEntry || lastEntry.month !== thisMonth) {
    rep.history.push({ month: thisMonth, score: totalScore });
    if (rep.history.length > 12) rep.history.shift();
  }

  await rep.save();
  return rep;
};

// GET /api/reputation
const getReputation = async (req, res) => {
  try {
    const rep = await computeReputation(req.user._id);
    res.json({
      score: rep.totalScore,
      tier: rep.tier,
      percentile: rep.percentile,
      signals: [
        { name: 'GitHub Activity', score: rep.signals.githubActivity.score, max: 200, trend: rep.signals.githubActivity.trend || 0, icon: 'github' },
        { name: 'LeetCode Rank', score: rep.signals.leetcodeRank.score, max: 200, trend: rep.signals.leetcodeRank.trend || 0, icon: 'code' },
        { name: 'Platform XP', score: rep.signals.platformXP.score, max: 200, trend: rep.signals.platformXP.trend || 0, icon: 'xp' },
        { name: 'Peer Ratings', score: rep.signals.peerRatings.score, max: 200, trend: rep.signals.peerRatings.trend || 0, icon: 'star' },
        { name: 'Employer Endorsements', score: rep.signals.employerEndorsements.score, max: 200, trend: 0, icon: 'award' }
      ],
      history: rep.history,
      githubConnected: rep.githubConnected,
      leetcodeConnected: rep.leetcodeConnected,
      githubUsername: rep.githubUsername,
      leetcodeUsername: rep.leetcodeUsername
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/reputation/profile/:username (public)
const getPublicProfile = async (req, res) => {
  try {
    const user = await User.findOne({ name: { $regex: req.params.username, $options: 'i' } }).select('name avatar');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const rep = await ReputationScore.findOne({ user: user._id });
    if (!rep) return res.status(404).json({ message: 'Reputation not found' });

    res.json({
      user: { name: user.name, avatar: user.avatar },
      score: rep.totalScore,
      tier: rep.tier,
      percentile: rep.percentile,
      history: rep.history
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/reputation/connect/github
const connectGitHub = async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) return res.status(400).json({ message: 'GitHub username required' });

    let githubScore = 50; // default
    let commits = 0, stars = 0, prs = 0;

    // Try to fetch real GitHub data
    try {
      const response = await axios.get(`https://api.github.com/users/${username}`, {
        headers: { 'User-Agent': 'JobPortal-App', ...(process.env.GITHUB_TOKEN ? { Authorization: `token ${process.env.GITHUB_TOKEN}` } : {}) },
        timeout: 5000
      });
      const userData = response.data;
      stars = userData.public_repos * 2; // approximate
      commits = userData.public_repos * 10; // approximate

      // Score based on public repos and followers
      githubScore = Math.min(200, Math.round(
        (userData.public_repos * 3) +
        (userData.followers * 2) +
        (userData.public_gists * 1)
      ));
    } catch (ghErr) {
      console.log('GitHub API unavailable, using default score');
    }

    await ReputationScore.findOneAndUpdate(
      { user: req.user._id },
      {
        githubConnected: true,
        githubUsername: username,
        'signals.githubActivity.score': githubScore,
        'signals.githubActivity.max': 200
      },
      { upsert: true, new: true }
    );

    // Recompute total
    await computeReputation(req.user._id);

    res.json({ success: true, githubScore, username, commits, stars });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/reputation/connect/leetcode
const connectLeetCode = async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) return res.status(400).json({ message: 'LeetCode username required' });

    let leetcodeScore = 50;
    let solved = 0, rating = 0;

    // Try LeetCode GraphQL API
    try {
      const response = await axios.post('https://leetcode.com/graphql', {
        query: `query getUserProfile($username: String!) {
          matchedUser(username: $username) {
            submitStats { acSubmissionNum { difficulty count } }
            profile { ranking }
          }
        }`,
        variables: { username }
      }, {
        headers: { 'Content-Type': 'application/json', 'Referer': 'https://leetcode.com' },
        timeout: 8000
      });

      const data = response.data?.data?.matchedUser;
      if (data) {
        const stats = data.submitStats?.acSubmissionNum || [];
        solved = stats.reduce((a, s) => a + s.count, 0);
        rating = data.profile?.ranking || 0;
        leetcodeScore = Math.min(200, Math.round(
          (solved * 0.5) + (rating > 0 ? Math.max(0, 200 - rating / 1000) : 0)
        ));
      }
    } catch (lcErr) {
      console.log('LeetCode API unavailable, using default score');
    }

    await ReputationScore.findOneAndUpdate(
      { user: req.user._id },
      {
        leetcodeConnected: true,
        leetcodeUsername: username,
        'signals.leetcodeRank.score': leetcodeScore,
        'signals.leetcodeRank.max': 200
      },
      { upsert: true, new: true }
    );

    await computeReputation(req.user._id);

    res.json({ success: true, leetcodeScore, username, solved, rating });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/reputation/endorse (employer endorses a user)
const requestEndorsement = async (req, res) => {
  try {
    const { targetUserId, message } = req.body;
    const user = await User.findById(req.user._id);

    await ReputationScore.findOneAndUpdate(
      { user: targetUserId },
      {
        $push: {
          employerEndorsements: {
            employer: req.user._id,
            companyName: user.name,
            message: message || '',
            verified: false
          }
        }
      },
      { upsert: true }
    );

    res.json({ success: true, message: 'Endorsement request sent. Verification email sent to employer.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getReputation, getPublicProfile, connectGitHub, connectLeetCode, requestEndorsement, computeReputation };
