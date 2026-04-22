const mongoose = require('mongoose');

const codeQualityResultSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  submission: { type: mongoose.Schema.Types.ObjectId, ref: 'CodingSubmission' },
  code: { type: String, required: true },
  language: { type: String, required: true },
  timeComplexity: { type: String, default: '' },
  spaceComplexity: { type: String, default: '' },
  readabilityScore: { type: Number, default: 0 },
  readabilityDimensions: [{
    name: String,
    score: Number
  }],
  edgeCases: [{
    case: String,
    severity: { type: String, enum: ['error', 'warning', 'info'] },
    suggestion: String
  }],
  annotations: [{
    line: Number,
    message: String,
    type: { type: String, enum: ['error', 'warning', 'info'] }
  }],
  optimalComplexity: { type: String, default: '' },
  refactoredCode: { type: String, default: '' }
}, { timestamps: true });

codeQualityResultSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('CodeQualityResult', codeQualityResultSchema);
