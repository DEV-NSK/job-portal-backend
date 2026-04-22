const mongoose = require('mongoose');

const interviewRoomSchema = new mongoose.Schema({
  host: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  scheduledAt: { type: Date },
  inviteeEmail: { type: String, default: '' },
  status: { type: String, enum: ['upcoming', 'active', 'completed', 'cancelled'], default: 'upcoming' },
  recordingUrl: { type: String, default: '' },
  recordingConsent: { type: Boolean, default: false },
  duration: { type: Number, default: 0 }, // minutes
  postSessionReport: {
    codeQualityScore: { type: Number, default: 0 },
    communicationNotes: { type: String, default: '' },
    interviewerRating: { type: Number, default: 0 },
    summary: { type: String, default: '' }
  },
  chatLog: [{
    sender: String,
    text: String,
    timestamp: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

interviewRoomSchema.index({ host: 1, status: 1 });

module.exports = mongoose.model('InterviewRoom', interviewRoomSchema);
