const mongoose = require('mongoose');

const peerRoomSchema = new mongoose.Schema({
  host: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  topic: { type: String, required: true },
  language: { type: String, default: 'JavaScript' },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
  isPublic: { type: Boolean, default: true },
  maxParticipants: { type: Number, default: 4 },
  status: { type: String, enum: ['active', 'closed'], default: 'active' },
  participants: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { type: String, enum: ['Driver', 'Navigator', 'Observer'], default: 'Observer' },
    joinedAt: { type: Date, default: Date.now }
  }],
  chatLog: [{
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    senderName: String,
    text: String,
    timestamp: { type: Date, default: Date.now }
  }],
  sessionSummary: {
    duration: Number,
    problemsAttempted: Number,
    contributions: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      linesTyped: Number
    }]
  },
  ratings: [{
    rater: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rated: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    score: Number
  }]
}, { timestamps: true });

peerRoomSchema.index({ status: 1, isPublic: 1 });

module.exports = mongoose.model('PeerRoom', peerRoomSchema);
