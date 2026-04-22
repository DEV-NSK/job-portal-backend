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
  applicantsCount: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Job', jobSchema);
