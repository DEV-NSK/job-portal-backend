const mongoose = require('mongoose');

const userStreakSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  currentStreak: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  lastActiveDate: { type: String, default: '' }, // YYYY-MM-DD
  dailyGoal: { type: Number, default: 2 },
  totalContributions: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('UserStreak', userStreakSchema);
