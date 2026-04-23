const mongoose = require('mongoose');

const recruiterPinSchema = new mongoose.Schema({
  recruiter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  note: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('RecruiterPin', recruiterPinSchema);
