const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  employer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  companyName: { type: String, required: true },
  companyLogo: { type: String, default: '' },
  title: { type: String, required: true },
  description: { type: String, required: true },
  requirements: [String],
  location: { type: String, required: true },
  type: { type: String, enum: ['Full-time', 'Part-time', 'Remote', 'Contract', 'Internship'], default: 'Full-time' },
  salary: { type: String, default: '' },
  experience: { type: String, default: '' },
  skills: [String],
  category: { type: String, default: '' },
  deadline: { type: Date },
  isActive: { type: Boolean, default: true },
  applicantsCount: { type: Number, default: 0 },
  // Blind Hiring (F16)
  blindMode: { type: Boolean, default: false },
  blindModeLocked: { type: Boolean, default: false },
  // Skill-Based Posting (F17)
  requiredSkills: [{ skillName: String, isRequired: { type: Boolean, default: true }, weight: { type: Number, default: 1 } }],
  isSkillBased: { type: Boolean, default: false },
  minMatchThreshold: { type: Number, default: 70 },
  // Dynamic Job Posts (F18)
  healthScore: { type: Number, default: 50 },
  tier: { type: String, enum: ['promoted', 'standard', 'high'], default: 'standard' },
  isUrgent: { type: Boolean, default: false },
  isHot: { type: Boolean, default: false },
  tierLockedUntil: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Job', jobSchema);
