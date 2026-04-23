const mongoose = require('mongoose');

const talentPoolSchema = new mongoose.Schema({
  recruiter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  isTeamVisible: { type: Boolean, default: false },
  members: [{
    candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notes: { type: String, default: '' },
    rating: { type: Number, min: 1, max: 5, default: 3 },
    tags: [String],
    addedAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model('TalentPool', talentPoolSchema);
