const User = require('../models/User');
const Employer = require('../models/Employer');

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id || req.user._id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    const employer = user.role === 'employer' ? await Employer.findOne({ userId: user._id }) : null;
    res.json({ user, employer });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const updates = { ...req.body };
    if (req.file) {
      const field = req.file.fieldname === 'resume' ? 'resume' : 'avatar';
      updates[field] = `/uploads/${req.file.filename}`;
    }
    delete updates.password;
    delete updates.role;
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-password');
    if (req.user.role === 'employer' && req.body.companyName) {
      await Employer.findOneAndUpdate(
        { userId: req.user._id },
        { ...req.body },
        { upsert: true, new: true }
      );
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getProfile, updateProfile };
