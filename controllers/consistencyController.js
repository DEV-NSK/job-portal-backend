const ActivityLog = require('../models/ActivityLog');
const UserStreak = require('../models/UserStreak');

const todayStr = () => new Date().toISOString().split('T')[0];

// Record an activity event (called internally by other controllers)
const recordActivity = async (userId, type) => {
  const today = todayStr();
  const validTypes = ['codingProblems', 'mockInterviews', 'coursesProgressed', 'jobsApplied', 'profileUpdates', 'peerReviews'];
  if (!validTypes.includes(type)) return;

  const inc = { count: 1, [`breakdown.${type}`]: 1 };
  await ActivityLog.findOneAndUpdate(
    { user: userId, date: today },
    { $inc: inc },
    { upsert: true, new: true }
  );

  // Update streak
  await updateStreak(userId, today);
};

const updateStreak = async (userId, today) => {
  let streak = await UserStreak.findOne({ user: userId });
  if (!streak) {
    streak = await UserStreak.create({ user: userId, currentStreak: 1, longestStreak: 1, lastActiveDate: today, totalContributions: 1 });
    return;
  }

  const last = streak.lastActiveDate;
  if (last === today) {
    // Already counted today
    await UserStreak.findOneAndUpdate({ user: userId }, { $inc: { totalContributions: 1 } });
    return;
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  let newStreak;
  if (last === yesterdayStr) {
    newStreak = streak.currentStreak + 1;
  } else {
    newStreak = 1; // streak broken
  }

  await UserStreak.findOneAndUpdate(
    { user: userId },
    {
      currentStreak: newStreak,
      longestStreak: Math.max(streak.longestStreak, newStreak),
      lastActiveDate: today,
      $inc: { totalContributions: 1 }
    }
  );
};

// GET /api/consistency/heatmap
const getHeatmap = async (req, res) => {
  try {
    // Get last 52 weeks of activity
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 364);
    const startStr = startDate.toISOString().split('T')[0];

    const logs = await ActivityLog.find({
      user: req.user._id,
      date: { $gte: startStr }
    }).select('date count');

    const logMap = {};
    logs.forEach(l => { logMap[l.date] = l.count; });

    // Build 52-week grid
    const weeks = [];
    const now = new Date();
    for (let w = 51; w >= 0; w--) {
      const days = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(now);
        date.setDate(date.getDate() - (w * 7 + d));
        const dateStr = date.toISOString().split('T')[0];
        days.push({ date: dateStr, count: logMap[dateStr] || 0 });
      }
      weeks.push(days);
    }

    res.json({ weeks });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/consistency/streak
const getStreak = async (req, res) => {
  try {
    let streak = await UserStreak.findOne({ user: req.user._id });
    if (!streak) {
      streak = { currentStreak: 0, longestStreak: 0, totalContributions: 0, dailyGoal: 2 };
    }

    // Weekly average
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekStr = weekAgo.toISOString().split('T')[0];
    const weekLogs = await ActivityLog.find({ user: req.user._id, date: { $gte: weekStr } });
    const weekTotal = weekLogs.reduce((a, l) => a + l.count, 0);
    const weeklyAvg = Math.round((weekTotal / 7) * 10) / 10;

    // Today's count
    const todayLog = await ActivityLog.findOne({ user: req.user._id, date: todayStr() });

    // Percentile
    const allStreaks = await UserStreak.find({}).select('currentStreak');
    const lower = allStreaks.filter(s => s.currentStreak < streak.currentStreak).length;
    const percentile = allStreaks.length > 1 ? Math.round((lower / allStreaks.length) * 100) : 50;

    res.json({
      currentStreak: streak.currentStreak,
      longestStreak: streak.longestStreak,
      weeklyAvg,
      totalContributions: streak.totalContributions,
      dailyGoal: streak.dailyGoal,
      todayCount: todayLog?.count || 0,
      percentile
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/consistency/goal
const setGoal = async (req, res) => {
  try {
    const { goal } = req.body;
    await UserStreak.findOneAndUpdate(
      { user: req.user._id },
      { dailyGoal: goal },
      { upsert: true, new: true }
    );
    res.json({ success: true, dailyGoal: goal });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getHeatmap, getStreak, setGoal, recordActivity };
