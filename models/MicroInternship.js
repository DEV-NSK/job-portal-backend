const mongoose = require('mongoose');

const microInternshipSchema = new mongoose.Schema({
  recruiter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  skills: [String],
  durationDays: { type: Number, min: 1, max: 7, default: 3 },
  compensation: { type: String, default: '' },
  maxCandidates: { type: Number, default: 5 },
  deliverable: { type: String, default: '' },
  rubric: { type: String, default: '' },
  status: { type: String, enum: ['active', 'closed', 'draft'], default: 'active' },
  applicants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  accepted: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  deadline: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('MicroInternship', microInternshipSchema);
