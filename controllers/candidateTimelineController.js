const CandidateTimeline = require('../models/CandidateTimeline');
const Application = require('../models/Application');

// GET /api/recruiter/applications/:appId/timeline
const getTimeline = async (req, res) => {
  try {
    const { appId } = req.params;
    const isRecruiter = req.user.role === 'employer' || req.user.role === 'admin';
    const query = { application: appId };
    if (!isRecruiter) query.isRecruiterOnly = false;

    const events = await CandidateTimeline.find(query)
      .populate('actor', 'name role avatar')
      .sort({ createdAt: 1 });
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/recruiter/applications/:appId/timeline/note
const addNote = async (req, res) => {
  try {
    const { content } = req.body;
    const event = await CandidateTimeline.create({
      application: req.params.appId,
      eventType: 'recruiter_note',
      actor: req.user._id,
      actorRole: 'recruiter',
      details: { content },
      isRecruiterOnly: true
    });
    res.json(event);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Helper to log timeline events from other controllers
const logEvent = async (applicationId, eventType, actorId, actorRole, details, isRecruiterOnly = false) => {
  try {
    await CandidateTimeline.create({ application: applicationId, eventType, actor: actorId, actorRole, details, isRecruiterOnly });
  } catch (e) { /* silent */ }
};

module.exports = { getTimeline, addNote, logEvent };
