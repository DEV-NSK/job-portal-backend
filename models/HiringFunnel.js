const mongoose = require('mongoose');

const funnelStageSchema = new mongoose.Schema({
  job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  applicant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  stage: {
    type: String,
    enum: ['applied', 'screened', 'shortlisted', 'interview_scheduled', 'interview_done', 'offer_extended', 'selected', 'rejected'],
    default: 'applied'
  },
  stageEnteredAt: { type: Date, default: Date.now },
  stageHistory: [{
    stage: String,
    enteredAt: Date,
    exitedAt: Date
  }]
}, { timestamps: true });

module.exports = mongoose.model('HiringFunnel', funnelStageSchema);
