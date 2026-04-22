const mongoose = require('mongoose');

const userXPSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  totalXP: { type: Number, default: 0 },
  todayXP: { type: Number, default: 0 },
  lastResetDate: { type: String, default: '' }, // YYYY-MM-DD
  log: [{
    amount: Number,
    reason: String,
    date: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model('UserXP', userXPSchema);
