const mongoose = require('mongoose');

const readinessScoreSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  score: { type: Number, default: 0 },
  dimensions: [{
    name: String,
    score: Number,
    weight: Number
  }],
  percentile: { type: Number, default: 0 },
  badge: { type: String, enum: ['Bronze', 'Silver', 'Gold', 'Platinum'], default: 'Bronze' }
}, { timestamps: true });

readinessScoreSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('ReadinessScore', readinessScoreSchema);
