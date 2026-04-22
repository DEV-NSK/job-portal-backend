const mongoose = require('mongoose');

const copilotGoalSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  targetRole: { type: String, default: 'Software Engineer' },
  timeline: { type: String, default: '3 months' },
  companyTier: { type: String, default: 'Any' },
  targetCompany: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('CopilotGoal', copilotGoalSchema);
