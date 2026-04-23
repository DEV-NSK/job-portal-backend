const mongoose = require('mongoose');

const employerSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  companyName: { type: String, default: '' },
  companyLogo: { type: String, default: '' },
  industry: { type: String, default: '' },
  companySize: { type: String, default: '' },
  website: { type: String, default: '' },
  description: { type: String, default: '' },
  culture: { type: String, default: '' },
  benefits: { type: String, default: '' },
  location: { type: String, default: '' },
  founded: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Employer', employerSchema);
