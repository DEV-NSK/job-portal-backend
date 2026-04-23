const Job = require('../models/Job');
const Employer = require('../models/Employer');
const Bookmark = require('../models/Bookmark');

const getJobs = async (req, res) => {
  try {
    const { search, location, type, category, page = 1, limit = 10 } = req.query;
    const query = { isActive: true };
    if (search) query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { companyName: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
    if (location) query.location = { $regex: location, $options: 'i' };
    if (type) query.type = type;
    if (category) query.category = { $regex: category, $options: 'i' };
    const total = await Job.countDocuments(query);
    const jobs = await Job.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit));
    
    // Add bookmark status if user is authenticated
    if (req.user) {
      const bookmarks = await Bookmark.find({ userId: req.user._id, jobId: { $in: jobs.map(j => j._id) } });
      const bookmarkedIds = new Set(bookmarks.map(b => b.jobId.toString()));
      jobs.forEach(job => {
        job._doc.isBookmarked = bookmarkedIds.has(job._id.toString());
      });
    }
    
    res.json({ jobs, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate('employer', 'name email avatar');
    if (!job) return res.status(404).json({ message: 'Job not found' });
    
    // Add bookmark status if user is authenticated
    if (req.user) {
      const bookmark = await Bookmark.findOne({ userId: req.user._id, jobId: job._id });
      job._doc.isBookmarked = !!bookmark;
    }
    
    res.json(job);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createJob = async (req, res) => {
  try {
    const employer = await Employer.findOne({ userId: req.user._id });
    const job = await Job.create({
      ...req.body,
      employer: req.user._id,
      companyName: employer?.companyName || req.user.name,
      companyLogo: employer?.companyLogo || ''
    });
    res.status(201).json(job);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateJob = async (req, res) => {
  try {
    const job = await Job.findOne({ _id: req.params.id, employer: req.user._id });
    if (!job) return res.status(404).json({ message: 'Job not found' });
    Object.assign(job, req.body);
    await job.save();
    res.json(job);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteJob = async (req, res) => {
  try {
    const query = req.user.role === 'admin' ? { _id: req.params.id } : { _id: req.params.id, employer: req.user._id };
    await Job.findOneAndDelete(query);
    res.json({ message: 'Job deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const bookmarkJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    
    await Bookmark.create({ userId: req.user._id, jobId: req.params.id });
    res.json({ message: 'Job bookmarked successfully' });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Job already bookmarked' });
    }
    res.status(500).json({ message: err.message });
  }
};

const unbookmarkJob = async (req, res) => {
  try {
    await Bookmark.findOneAndDelete({ userId: req.user._id, jobId: req.params.id });
    res.json({ message: 'Job unbookmarked successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getBookmarkedJobs = async (req, res) => {
  try {
    const bookmarks = await Bookmark.find({ userId: req.user._id })
      .populate('jobId')
      .sort({ createdAt: -1 });
    
    const jobs = bookmarks.map(b => ({ ...b.jobId._doc, isBookmarked: true }));
    res.json({ jobs, total: jobs.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getJobs, getJobById, createJob, updateJob, deleteJob, bookmarkJob, unbookmarkJob, getBookmarkedJobs };
