const mongoose = require('mongoose');

const resumeMatchSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  jobTitle: { type: String, default: '' },
  jobDescription: { type: String, default: '' },
  jobUrl: { type: String, default: '' },
  matchScore: { type: Number, default: 0 },
  atsProbability: { type: Number, default: 0 },
  domainOverlap: { type: Number, default: 0 },
  hardSkillsMissing: [String],
  softSkillsMissing: [String],
  experienceDelta: { type: String, default: '' },
  keywordMatches: [String],
  keywordMissing: [String],
  resumeSuggestions: [{
    original: String,
    improved: String
  }],
  notes: { type: String, default: '' }
}, { timestamps: true });

resumeMatchSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('ResumeMatch', resumeMatchSchema);
