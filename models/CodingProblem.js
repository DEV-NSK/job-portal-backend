const mongoose = require('mongoose');

const codingProblemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true },
  topic: { type: String, required: true },
  company: { type: String, default: '' },
  description: { type: String, required: true },
  examples: [{
    input: String,
    output: String,
    explanation: String
  }],
  constraints: [String],
  starterCode: {
    javascript: { type: String, default: '' },
    python: { type: String, default: '' },
    java: { type: String, default: '' },
    cpp: { type: String, default: '' },
    go: { type: String, default: '' }
  },
  testCases: [{
    input: String,
    expectedOutput: String
  }],
  optimalSolution: { type: String, default: '' },
  timeComplexity: { type: String, default: '' },
  spaceComplexity: { type: String, default: '' },
  xp: { type: Number, default: 10 },
  isActive: { type: Boolean, default: true },
  tags: [String]
}, { timestamps: true });

codingProblemSchema.index({ difficulty: 1, topic: 1 });
codingProblemSchema.index({ tags: 1 });

module.exports = mongoose.model('CodingProblem', codingProblemSchema);
