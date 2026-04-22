const CopilotGoal = require('../models/CopilotGoal');
const ChatMessage = require('../models/ChatMessage');
const ReadinessScore = require('../models/ReadinessScore');
const User = require('../models/User');
const CodingSubmission = require('../models/CodingSubmission');
const ActivityLog = require('../models/ActivityLog');
const Job = require('../models/Job');

// ── Compute readiness score from user profile ────────────────────────────────
const computeReadinessScore = async (userId) => {
  const user = await User.findById(userId);
  if (!user) return { score: 0, dimensions: [] };

  const dims = [
    {
      name: 'Basic Info',
      weight: 10,
      score: (() => {
        let s = 0;
        if (user.name) s += 20;
        if (user.email) s += 20;
        if (user.bio && user.bio.length > 20) s += 20;
        if (user.location) s += 20;
        if (user.phone) s += 10;
        if (user.linkedin) s += 10;
        return Math.min(100, s);
      })()
    },
    {
      name: 'Skills Listed',
      weight: 15,
      score: Math.min(100, (user.skills?.length || 0) * 10)
    },
    {
      name: 'Assessments',
      weight: 20,
      score: 40 // placeholder — real: count completed assessments
    },
    {
      name: 'Work Experience',
      weight: 20,
      score: Math.min(100, (user.experience?.length || 0) * 25)
    },
    {
      name: 'Projects',
      weight: 15,
      score: 55 // placeholder — real: count portfolio projects
    },
    {
      name: 'GitHub Activity',
      weight: 10,
      score: user.github ? 70 : 0
    },
    {
      name: 'LeetCode Stats',
      weight: 5,
      score: 45 // placeholder — real: from ReputationScore.signals.leetcodeRank
    },
    {
      name: 'Peer Endorsements',
      weight: 5,
      score: 30 // placeholder — real: from ReputationScore.signals.peerRatings
    }
  ];

  const score = Math.round(dims.reduce((acc, d) => acc + (d.score / 100) * d.weight, 0));
  const badge = score >= 86 ? 'Platinum' : score >= 71 ? 'Gold' : score >= 41 ? 'Silver' : 'Bronze';

  return { score, dimensions: dims, badge };
};

// GET /api/copilot/readiness
const getReadiness = async (req, res) => {
  try {
    const { score, dimensions, badge } = await computeReadinessScore(req.user._id);

    // Get yesterday's score for delta
    const yesterday = await ReadinessScore.findOne({ user: req.user._id })
      .sort({ createdAt: -1 }).skip(1);
    const delta = yesterday ? score - yesterday.score : 0;

    // Upsert today's score
    await ReadinessScore.create({ user: req.user._id, score, dimensions, badge });

    // Compute percentile (users with lower score / total users)
    const totalUsers = await ReadinessScore.distinct('user');
    const lowerCount = await ReadinessScore.aggregate([
      { $sort: { createdAt: -1 } },
      { $group: { _id: '$user', score: { $first: '$score' } } },
      { $match: { score: { $lt: score } } },
      { $count: 'count' }
    ]);
    const percentile = totalUsers.length > 0
      ? Math.round(((lowerCount[0]?.count || 0) / totalUsers.length) * 100)
      : 50;

    res.json({ score, delta, percentile, badge, dimensions, trend: delta >= 0 ? 'up' : 'down' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/copilot/briefing
const getBriefing = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const goal = await CopilotGoal.findOne({ user: req.user._id });

    // Top matched jobs based on user skills
    const userSkills = user.skills || [];
    const topJobs = await Job.find({
      isActive: true,
      ...(userSkills.length > 0 ? { skills: { $in: userSkills } } : {})
    })
      .sort({ createdAt: -1 })
      .limit(3)
      .select('title companyName location skills');

    const topJobsMapped = topJobs.map(j => {
      const overlap = userSkills.filter(s =>
        j.skills.some(js => js.toLowerCase().includes(s.toLowerCase()))
      ).length;
      const match = userSkills.length > 0
        ? Math.min(99, 60 + Math.round((overlap / Math.max(j.skills.length, 1)) * 40))
        : 75;
      return { title: j.title, company: j.companyName, match, location: j.location };
    });

    // Skill gaps: skills in job postings not in user profile
    const allJobSkills = await Job.aggregate([
      { $match: { isActive: true } },
      { $unwind: '$skills' },
      { $group: { _id: '$skills', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 }
    ]);
    const skillGaps = allJobSkills
      .map(s => s._id)
      .filter(s => !userSkills.some(us => us.toLowerCase() === s.toLowerCase()))
      .slice(0, 2);

    // Score delta
    const scores = await ReadinessScore.find({ user: req.user._id })
      .sort({ createdAt: -1 }).limit(2);
    const delta = scores.length >= 2 ? scores[0].score - scores[1].score : 0;

    res.json({
      date: new Date().toISOString(),
      delta,
      topJobs: topJobsMapped.length > 0 ? topJobsMapped : [
        { title: 'Software Engineer', company: 'Top Company', match: 80, location: 'Remote' }
      ],
      skillGaps: skillGaps.length > 0 ? skillGaps : ['System Design', 'GraphQL'],
      recommendedAction: skillGaps.length > 0
        ? `Learn ${skillGaps[0]} to increase your match rate for top roles`
        : 'Complete your profile to improve your readiness score',
      insight: 'Remote engineering roles are up 18% this month — now is a great time to apply.',
      targetRole: goal?.targetRole || 'Software Engineer'
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/copilot/chat
const chat = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ message: 'Message required' });

    // Save user message
    await ChatMessage.create({ user: req.user._id, role: 'user', text: message });

    // Get last 10 messages for context
    const history = await ChatMessage.find({ user: req.user._id })
      .sort({ createdAt: -1 }).limit(10);

    let replyText;

    // Use OpenAI if key is configured
    if (process.env.OPENAI_API_KEY) {
      try {
        const { OpenAI } = require('openai');
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

        const user = await User.findById(req.user._id);
        const goal = await CopilotGoal.findOne({ user: req.user._id });
        const { score } = await computeReadinessScore(req.user._id);

        const systemPrompt = `You are an AI Career Copilot for a job seeker platform. 
User profile: Name: ${user.name}, Skills: ${user.skills?.join(', ') || 'not listed'}, 
Target Role: ${goal?.targetRole || 'Software Engineer'}, 
Current Readiness Score: ${score}/100.
Give concise, actionable career advice. Keep responses under 150 words.`;

        const messages = [
          { role: 'system', content: systemPrompt },
          ...history.reverse().map(m => ({ role: m.role, content: m.text })),
          { role: 'user', content: message }
        ];

        const completion = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages,
          max_tokens: 200
        });
        replyText = completion.choices[0].message.content;
      } catch (aiErr) {
        console.error('OpenAI error:', aiErr.message);
        replyText = generateFallbackReply(message, req.user);
      }
    } else {
      replyText = generateFallbackReply(message, req.user);
    }

    const reply = await ChatMessage.create({ user: req.user._id, role: 'assistant', text: replyText });
    res.json({ id: reply._id, role: 'assistant', text: replyText });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const generateFallbackReply = (message, user) => {
  const msg = message.toLowerCase();
  if (msg.includes('score') || msg.includes('readiness'))
    return `Your readiness score reflects your profile completeness and activity. To improve it: add more skills, complete coding challenges daily, and fill in your work experience section.`;
  if (msg.includes('job') || msg.includes('apply'))
    return `Focus on roles that match at least 70% of your skills. Tailor your resume for each application and highlight measurable achievements. Quality over quantity wins.`;
  if (msg.includes('skill') || msg.includes('learn'))
    return `Based on current job market trends, System Design and TypeScript are high-demand skills worth investing in. Check your Learning Path for a structured roadmap.`;
  if (msg.includes('interview'))
    return `Practice daily with the Mock Interview Bot. Focus on the STAR method for behavioural questions and think out loud during technical problems — interviewers value your thought process.`;
  return `Great question! Focus on consistent daily practice — even 30 minutes a day compounds significantly over weeks. Check your Daily Coding section for today's recommended problems.`;
};

// GET /api/copilot/chat/history
const getChatHistory = async (req, res) => {
  try {
    const messages = await ChatMessage.find({ user: req.user._id })
      .sort({ createdAt: 1 }).limit(50);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/copilot/goals
const setGoals = async (req, res) => {
  try {
    const goal = await CopilotGoal.findOneAndUpdate(
      { user: req.user._id },
      { ...req.body, user: req.user._id },
      { upsert: true, new: true }
    );
    res.json(goal);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/copilot/goals
const getGoals = async (req, res) => {
  try {
    const goal = await CopilotGoal.findOne({ user: req.user._id });
    res.json(goal || { targetRole: 'Software Engineer', timeline: '3 months', companyTier: 'Any' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/copilot/chat/:id/rate
const rateMessage = async (req, res) => {
  try {
    const { rating } = req.body;
    await ChatMessage.findByIdAndUpdate(req.params.id, { rating });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/copilot/score-history
const getScoreHistory = async (req, res) => {
  try {
    const history = await ReadinessScore.find({ user: req.user._id })
      .sort({ createdAt: -1 }).limit(30);
    const data = history.reverse().map((h, i) => ({ day: i + 1, score: h.score }));
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getReadiness, getBriefing, chat, getChatHistory, setGoals, getGoals, rateMessage, getScoreHistory, computeReadinessScore };
