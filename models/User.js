const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'employer', 'admin'], default: 'user' },
  avatar: { type: String, default: '' },
  bio: { type: String, default: '' },
  location: { type: String, default: '' },
  skills: [String],
  resume: { type: String, default: '' },
  phone: { type: String, default: '' },
  linkedin: { type: String, default: '' },
  github: { type: String, default: '' },
  experience: [{
    title: String,
    company: String,
    duration: String,
    description: String
  }],
  education: [{
    degree: String,
    institution: String,
    year: String
  }]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
