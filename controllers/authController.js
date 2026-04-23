const User = require('../models/User');
const Employer = require('../models/Employer');
const Notification = require('../models/Notification');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

const register = async (req, res) => {
  try {
    const { name, email, password, role, companyName } = req.body;
    if (await User.findOne({ email })) return res.status(400).json({ message: 'Email already exists' });
    const hashed = await bcrypt.hash(password, 10);

    const isEmployer = role === 'employer';
    const user = await User.create({
      name,
      email,
      password: hashed,
      role: role || 'user',
      // Employers start as pending until admin approves
      isApproved: !isEmployer,
      approvalStatus: isEmployer ? 'pending' : 'approved'
    });

    if (isEmployer && companyName) {
      await Employer.create({ userId: user._id, companyName });

      // Notify all admins about new employer registration
      const admins = await User.find({ role: 'admin' }).select('_id');
      const notifs = admins.map(admin => ({
        recipient: admin._id,
        type: 'employer_pending',
        title: 'New Employer Registration',
        message: `${name} (${companyName}) has registered as an employer and is awaiting approval.`,
        link: '/admin/employers',
        relatedUser: user._id
      }));
      if (notifs.length) await Notification.insertMany(notifs);
    }

    const userObj = user.toObject();
    delete userObj.password;
    res.status(201).json({ token: generateToken(user._id), user: userObj });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(400).json({ message: 'Invalid credentials' });

    // Block rejected employers
    if (user.role === 'employer' && user.approvalStatus === 'rejected') {
      return res.status(403).json({ message: 'Your employer account has been rejected. Please contact support.' });
    }

    const userObj = user.toObject();
    delete userObj.password;
    res.json({ token: generateToken(user._id), user: userObj });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getMe = async (req, res) => {
  res.json(req.user);
};

module.exports = { register, login, getMe };
