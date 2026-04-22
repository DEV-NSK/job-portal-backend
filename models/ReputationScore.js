const mongoose = require('mongoose');

const reputationScoreSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  totalScore: { type: Number, default: 0 },
  tier: { type: String, enum: ['Bronze', 'Silver', 'Gold', 'Platinum'], default: 'Bronze' },
  percentile: { type: Number, default: 0 },
  signals: {
    githubActivity: { score: { type: Number, default: 0 }, max: { type: Number, default: 200 }, trend: { type: Number, default: 0 } },
    leetcodeRank: { score: { type: Number, default: 0 }, max: { type: Number, default: 200 }, trend: { type: Number, default: 0 } },
    platformXP: { score: { type: Number, default: 0 }, max: { type: Number, default: 200 }, trend: { type: Number, default: 0 } },
    peerRatings: { score: { type: Number, default: 0 }, max: { type: Number, default: 200 }, trend: { type: Number, default: 0 } },
    employerEndorsements: { score: { type: Number, default: 0 }, max: { type: Number, default: 200 }, trend: { type: Number, default: 0 } }
  },
  githubConnected: { type: Boolean, default: false },
  githubUsername: { type: String, default: '' },
  githubToken: { type: String, default: '' },
  leetcodeConnected: { type: Boolean, default: false },
  leetcodeUsername: { type: String, default: '' },
  history: [{
    month: String,
    score: Number,
    recordedAt: { type: Date, default: Date.now }
  }],
  employerEndorsements: [{
    employer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    companyName: String,
    message: String,
    verified: { type: Boolean, default: false },
    verifiedAt: Date
  }]
}, { timestamps: true });

module.exports = mongoose.model('ReputationScore', reputationScoreSchema);
