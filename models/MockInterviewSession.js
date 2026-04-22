const mongoose = require('mongoose');

const mockInterviewSessionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  mode: { type: String, enum: ['hr', 'technical'], required: true },
  role: { type: String, required: true },
  inputMode: { type: String, enum: ['voice', 'text'], default: 'text' },
  status: { type: String, enum: ['active', 'completed'], default: 'active' },
  questions: [{
    question: String,
    answer: String,
    scores: {
      clarity: { type: Number, default: 0 },
      depth: { type: Number, default: 0 },
      structure: { type: Number, default: 0 },
      correctness: { type: Number, default: 0 }
    },
    feedback: String,
    overall: { type: Number, default: 0 }
  }],
  overallScore: { type: Number, default: 0 },
  report: {
    summary: { type: String, default: '' },
    strengths: [String],
    improvements: [String],
    resources: [{ title: String, type: String, platform: String }]
  },
  completedAt: { type: Date }
}, { timestamps: true });

mockInterviewSessionSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('MockInterviewSession', mockInterviewSessionSchema);
