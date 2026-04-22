const mongoose = require('mongoose');

const codingSubmissionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  problem: { type: mongoose.Schema.Types.ObjectId, ref: 'CodingProblem', required: true },
  code: { type: String, required: true },
  language: { type: String, required: true },
  status: { type: String, enum: ['accepted', 'wrong_answer', 'time_limit', 'error'], default: 'wrong_answer' },
  runtime: { type: String, default: '' },
  memory: { type: String, default: '' },
  xpEarned: { type: Number, default: 0 },
  testResults: [{
    input: String,
    expected: String,
    output: String,
    passed: Boolean
  }],
  qualityScore: { type: Number, default: 0 },
  timeComplexity: { type: String, default: '' },
  spaceComplexity: { type: String, default: '' },
  readabilityScore: { type: Number, default: 0 }
}, { timestamps: true });

codingSubmissionSchema.index({ user: 1, problem: 1 });
codingSubmissionSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('CodingSubmission', codingSubmissionSchema);
