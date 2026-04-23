const mongoose = require('mongoose');

const jobHealthSchema = new mongoose.Schema({
  job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true, unique: true },
  healthScore: { type: Number, default: 50 },
  tier: { type: String, enum: ['promoted', 'standard', 'high'], default: 'standard' },
  isUrgent: { type: Boolean, default: false },
  isHot: { type: Boolean, default: false },
  tierLockedUntil: { type: Date },
  scoreHistory: [{
    score: Number,
    date: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model('JobHealth', jobHealthSchema);
