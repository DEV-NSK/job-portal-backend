const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  applicant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  coverLetter: { type: String, default: '' },
  resume: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'reviewed', 'accepted', 'rejected'], default: 'pending' },
  // Hiring Funnel stage (F11)
  funnelStage: {
    type: String,
    enum: ['applied','screened','shortlisted','interview_scheduled','interview_done','offer_extended','selected','rejected'],
    default: 'applied'
  },
  funnelStageEnteredAt: { type: Date, default: Date.now },
  stageHistory: [{ stage: String, enteredAt: Date, exitedAt: Date }],
  // Ranking score cache
  rankingScore: { type: Number, default: 0 },
  // Shortlist
  isShortlisted: { type: Boolean, default: false },
  isVetoed: { type: Boolean, default: false },
  recruiterNotes: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Application', applicationSchema);
