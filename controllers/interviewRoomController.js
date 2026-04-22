const InterviewRoom = require('../models/InterviewRoom');

// POST /api/interview-rooms
const createRoom = async (req, res) => {
  try {
    const { title, scheduledAt, inviteeEmail, recordingConsent } = req.body;
    const room = await InterviewRoom.create({
      host: req.user._id,
      title,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      inviteeEmail: inviteeEmail || '',
      recordingConsent: recordingConsent || false
    });
    res.status(201).json(room);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/interview-rooms
const getRooms = async (req, res) => {
  try {
    const rooms = await InterviewRoom.find({ host: req.user._id })
      .sort({ createdAt: -1 }).limit(20);
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/interview-rooms/:id
const getRoom = async (req, res) => {
  try {
    const room = await InterviewRoom.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });
    res.json(room);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/interview-rooms/:id/status
const updateStatus = async (req, res) => {
  try {
    const room = await InterviewRoom.findOneAndUpdate(
      { _id: req.params.id, host: req.user._id },
      { status: req.body.status },
      { new: true }
    );
    res.json(room);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/interview-rooms/:id/report
const saveReport = async (req, res) => {
  try {
    const room = await InterviewRoom.findOneAndUpdate(
      { _id: req.params.id, host: req.user._id },
      { postSessionReport: req.body, status: 'completed' },
      { new: true }
    );
    res.json(room);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/interview-rooms/:id/chat
const addChatMessage = async (req, res) => {
  try {
    const room = await InterviewRoom.findByIdAndUpdate(
      req.params.id,
      { $push: { chatLog: { sender: req.user.name, text: req.body.text } } },
      { new: true }
    );
    res.json(room.chatLog[room.chatLog.length - 1]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createRoom, getRooms, getRoom, updateStatus, saveReport, addChatMessage };
