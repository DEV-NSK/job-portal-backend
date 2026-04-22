const mongoose = require('mongoose');

const learningPathSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  targetRole: { type: String, required: true },
  totalDays: { type: Number, default: 60 },
  currentDay: { type: Number, default: 1 },
  estimatedReadyDate: { type: String, default: '' },
  isFastTrack: { type: Boolean, default: false },
  weeks: [{
    week: Number,
    title: String,
    completed: { type: Boolean, default: false },
    current: { type: Boolean, default: false },
    objectives: [String],
    resources: [{
      title: String,
      platform: String,
      time: String,
      type: { type: String, enum: ['video', 'course', 'docs', 'practice', 'reading'] },
      url: { type: String, default: '' },
      done: { type: Boolean, default: false }
    }]
  }]
}, { timestamps: true });

module.exports = mongoose.model('LearningPath', learningPathSchema);
