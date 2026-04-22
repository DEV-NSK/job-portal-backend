const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  employer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  company: { type: String, required: true },
  companyLogo: { type: String, default: '🏢' },
  domain: { type: String, required: true },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
  durationHours: { type: Number, default: 48 },
  reward: { type: String, default: '' },
  techStack: [String],
  description: { type: String, required: true },
  requirements: [String],
  starterCodeUrl: { type: String, default: '' },
  testSuite: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  submissionsCount: { type: Number, default: 0 }
}, { timestamps: true });

projectSchema.index({ domain: 1, difficulty: 1, isActive: 1 });

module.exports = mongoose.model('Project', projectSchema);
