const PeerRoom = require('../models/PeerRoom');
const { recordActivity } = require('./consistencyController');

// GET /api/peer-rooms (lobby)
const getLobby = async (req, res) => {
  try {
    const rooms = await PeerRoom.find({ status: 'active', isPublic: true })
      .populate('host', 'name avatar')
      .populate('participants.user', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(20);

    res.json(rooms.map(r => ({
      ...r.toObject(),
      participantCount: r.participants.length,
      isFull: r.participants.length >= r.maxParticipants
    })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/peer-rooms
const createRoom = async (req, res) => {
  try {
    const { name, topic, language, difficulty, isPublic, maxParticipants } = req.body;
    const room = await PeerRoom.create({
      host: req.user._id,
      name,
      topic,
      language: language || 'JavaScript',
      difficulty: difficulty || 'Medium',
      isPublic: isPublic !== false,
      maxParticipants: maxParticipants || 4,
      participants: [{ user: req.user._id, role: 'Driver' }]
    });
    await room.populate('host', 'name avatar');
    res.status(201).json(room);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/peer-rooms/:id/join
const joinRoom = async (req, res) => {
  try {
    const room = await PeerRoom.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });
    if (room.status !== 'active') return res.status(400).json({ message: 'Room is closed' });
    if (room.participants.length >= room.maxParticipants) return res.status(400).json({ message: 'Room is full' });

    const alreadyIn = room.participants.some(p => p.user.toString() === req.user._id.toString());
    if (!alreadyIn) {
      const roles = ['Driver', 'Navigator', 'Observer'];
      const takenRoles = room.participants.map(p => p.role);
      const role = roles.find(r => !takenRoles.includes(r)) || 'Observer';
      room.participants.push({ user: req.user._id, role });
      await room.save();
    }

    await room.populate('host', 'name avatar');
    await room.populate('participants.user', 'name avatar');
    res.json(room);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/peer-rooms/:id/leave
const leaveRoom = async (req, res) => {
  try {
    const room = await PeerRoom.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });

    room.participants = room.participants.filter(p => p.user.toString() !== req.user._id.toString());

    // Close room if host leaves or no participants
    if (room.host.toString() === req.user._id.toString() || room.participants.length === 0) {
      room.status = 'closed';
    }

    await room.save();
    await recordActivity(req.user._id, 'peerReviews');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/peer-rooms/:id/chat
const sendChat = async (req, res) => {
  try {
    const room = await PeerRoom.findByIdAndUpdate(
      req.params.id,
      { $push: { chatLog: { sender: req.user._id, senderName: req.user.name, text: req.body.text } } },
      { new: true }
    );
    const msg = room.chatLog[room.chatLog.length - 1];
    res.json(msg);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/peer-rooms/:id/rate
const rateSession = async (req, res) => {
  try {
    const { ratedUserId, score } = req.body;
    await PeerRoom.findByIdAndUpdate(req.params.id, {
      $push: { ratings: { rater: req.user._id, rated: ratedUserId, score } }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/peer-rooms/:id/role
const switchRole = async (req, res) => {
  try {
    const { role } = req.body;
    const room = await PeerRoom.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });

    const participant = room.participants.find(p => p.user.toString() === req.user._id.toString());
    if (participant) {
      participant.role = role;
      room.markModified('participants');
      await room.save();
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getLobby, createRoom, joinRoom, leaveRoom, sendChat, rateSession, switchRole };
