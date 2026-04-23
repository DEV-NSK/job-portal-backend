const mongoose = require('mongoose');

const timelineEventSchema = new mongoose.Schema({
  application: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', required: true },
  eventType: {
    type: String,
    enum: ['application_submitted','profile_viewed','assessment_assigned','assessment_completed',
           'interview_scheduled','interview_completed','feedback_given','offer_extended',
           'offer_accepted','offer_declined','hired','rejected','recruiter_note','stage_changed'],
    required: true
  },
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  actorRole: { type: String, enum: ['candidate', 'recruiter', 'system'], default: 'system' },
  details: { type: mongoose.Schema.Types.Mixed, default: {} },
  isRecruiterOnly: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('CandidateTimeline', timelineEventSchema);
