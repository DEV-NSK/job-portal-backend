const mongoose = require('mongoose');

// One document per user per day — aggregated activity count
const activityLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true }, // YYYY-MM-DD
  count: { type: Number, default: 0 },
  breakdown: {
    codingProblems: { type: Number, default: 0 },
    mockInterviews: { type: Number, default: 0 },
    coursesProgressed: { type: Number, default: 0 },
    jobsApplied: { type: Number, default: 0 },
    profileUpdates: { type: Number, default: 0 },
    peerReviews: { type: Number, default: 0 }
  }
}, { timestamps: true });

activityLogSchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
