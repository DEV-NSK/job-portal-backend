const User = require('../models/User');
const Employer = require('../models/Employer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

const register = async (req, res) => {
  try {
    const { name, email, password, role, companyName } = req.body;
    if (await User.findOne({ email })) return res.status(400).json({ message: 'Email already exists' });
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed, role: role || 'user' });
    if (role === 'employer' && companyName) {
      await Employer.create({ userId: user._id, companyName });
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
