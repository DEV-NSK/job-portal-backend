const mongoose = require('mongoose');

const projectSubmissionSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['accepted', 'in_progress', 'submitted', 'evaluated'], default: 'accepted' },
  acceptedAt: { type: Date, default: Date.now },
  deadline: { type: Date, required: true },
  submittedAt: { type: Date },
  codeUrl: { type: String, default: '' },
  testPassRate: { type: Number, default: 0 },
  qualityScore: { type: Number, default: 0 },
  timeUsed: { type: String, default: '' },
  percentileRank: { type: Number, default: 0 },
  employerFeedback: { type: String, default: '' },
  employerComments: [{
    line: Number,
    file: String,
    comment: String,
    timestamp: { type: Date, default: Date.now }
  }],
  aiSummary: { type: String, default: '' }
}, { timestamps: true });

projectSubmissionSchema.index({ project: 1, user: 1 }, { unique: true });
projectSubmissionSchema.index({ user: 1, status: 1 });

module.exports = mongoose.model('ProjectSubmission', projectSubmissionSchema);
