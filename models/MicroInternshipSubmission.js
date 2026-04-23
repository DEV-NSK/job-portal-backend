const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  internship: { type: mongoose.Schema.Types.ObjectId, ref: 'MicroInternship', required: true },
  candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  deliverableUrl: { type: String, default: '' },
  deliverableText: { type: String, default: '' },
  submittedAt: { type: Date },
  evaluation: { type: String, enum: ['excellent', 'good', 'below_expectation', 'pending'], default: 'pending' },
  score: { type: Number, default: 0 },
  recruiterNotes: { type: String, default: '' },
  fastTracked: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('MicroInternshipSubmission', submissionSchema);
