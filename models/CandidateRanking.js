const mongoose = require('mongoose');

const candidateRankingSchema = new mongoose.Schema({
  job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  skillMatch: { type: Number, default: 0 },
  codingScore: { type: Number, default: 0 },
  consistency: { type: Number, default: 0 },
  profileStrength: { type: Number, default: 0 },
  reputationScore: { type: Number, default: 0 },
  overallScore: { type: Number, default: 0 },
  computedAt: { type: Date, default: Date.now }
}, { timestamps: true });

candidateRankingSchema.index({ job: 1, candidate: 1 }, { unique: true });

module.exports = mongoose.model('CandidateRanking', candidateRankingSchema);
