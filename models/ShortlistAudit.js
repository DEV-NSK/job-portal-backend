const mongoose = require('mongoose');

const shortlistAuditSchema = new mongoose.Schema({
  job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  recruiter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, enum: ['accepted', 'swapped', 'vetoed'], required: true },
  rationale: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('ShortlistAudit', shortlistAuditSchema);
