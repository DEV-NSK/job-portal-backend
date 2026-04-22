const User = require('../models/User');
const Employer = require('../models/Employer');
const Job = require('../models/Job');
const Application = require('../models/Application');
const Post = require('../models/Post');
const Comment = require('../models/Comment');

const getStats = async (req, res) => {
  try {
    const [users, employers, jobs, applications, posts] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ role: 'employer' }),
      Job.countDocuments(),
      Application.countDocuments(),
      Post.countDocuments()
    ]);
    res.json({ users, employers, jobs, applications, posts });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ role: { $ne: 'admin' } }).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getAllJobs = async (req, res) => {
  try {
    const jobs = await Job.find().populate('employer', 'name email').sort({ createdAt: -1 });
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find().populate('author', 'name email avatar').sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteAdminPost = async (req, res) => {
  try {
    await Post.findByIdAndDelete(req.params.id);
    await Comment.deleteMany({ post: req.params.id });
    res.json({ message: 'Post deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getStats, getAllUsers, deleteUser, getAllJobs, getAllPosts, deleteAdminPost };
