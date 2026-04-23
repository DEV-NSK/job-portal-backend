const TalentPool = require('../models/TalentPool');
const User = require('../models/User');

// GET /api/recruiter/talent-pools
const getPools = async (req, res) => {
  try {
    const pools = await TalentPool.find({ recruiter: req.user._id }).sort({ createdAt: -1 });
    res.json(pools);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/recruiter/talent-pools
const createPool = async (req, res) => {
  try {
    const { name, description, isTeamVisible } = req.body;
    const pool = await TalentPool.create({ recruiter: req.user._id, name, description, isTeamVisible });
    res.status(201).json(pool);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/recruiter/talent-pools/:id/members
const getPoolMembers = async (req, res) => {
  try {
    const pool = await TalentPool.findById(req.params.id).populate('members.candidate', 'name email avatar skills');
    if (!pool) return res.status(404).json({ message: 'Pool not found' });
    res.json(pool.members);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/recruiter/talent-pools/:id/members
const addMember = async (req, res) => {
  try {
    const { candidateId, notes, rating, tags } = req.body;
    const pool = await TalentPool.findById(req.params.id);
    if (!pool) return res.status(404).json({ message: 'Pool not found' });

    const exists = pool.members.find(m => m.candidate.toString() === candidateId);
    if (exists) return res.status(400).json({ message: 'Candidate already in pool' });

    pool.members.push({ candidate: candidateId, notes: notes || '', rating: rating || 3, tags: tags || [] });
    await pool.save();
    res.json(pool);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/recruiter/talent-pools/:id/members/:candidateId
const removeMember = async (req, res) => {
  try {
    const pool = await TalentPool.findById(req.params.id);
    if (!pool) return res.status(404).json({ message: 'Pool not found' });
    pool.members = pool.members.filter(m => m.candidate.toString() !== req.params.candidateId);
    await pool.save();
    res.json({ message: 'Removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/recruiter/talent-pools/:id
const deletePool = async (req, res) => {
  try {
    await TalentPool.findByIdAndDelete(req.params.id);
    res.json({ message: 'Pool deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/recruiter/talent-pools/:id/export
const exportPool = async (req, res) => {
  try {
    const pool = await TalentPool.findById(req.params.id).populate('members.candidate', 'name email skills');
    if (!pool) return res.status(404).json({ message: 'Pool not found' });
    const rows = pool.members.map(m =>
      `${m.candidate?.name},${m.candidate?.email},"${m.candidate?.skills?.join(';')}",${m.rating},"${m.notes}",${m.addedAt}`
    );
    const csv = ['Name,Email,Skills,Rating,Notes,Added At', ...rows].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=pool-${req.params.id}.csv`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getPools, createPool, getPoolMembers, addMember, removeMember, deletePool, exportPool };
