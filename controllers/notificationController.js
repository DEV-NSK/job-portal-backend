const Notification = require('../models/Notification');
const User = require('../models/User');

// Get notifications for the logged-in user
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get unread count
const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({ recipient: req.user._id, isRead: false });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Mark one as read
const markRead = async (req, res) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { isRead: true }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Mark all as read
const markAllRead = async (req, res) => {
  try {
    await Notification.updateMany({ recipient: req.user._id, isRead: false }, { isRead: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Admin: approve or reject employer
const handleEmployerApproval = async (req, res) => {
  try {
    const { userId, action } = req.body; // action: 'approve' | 'reject'
    const employer = await User.findById(userId);
    if (!employer || employer.role !== 'employer')
      return res.status(404).json({ message: 'Employer not found' });

    employer.approvalStatus = action === 'approve' ? 'approved' : 'rejected';
    employer.isApproved = action === 'approve';
    await employer.save();

    // Notify the employer
    await Notification.create({
      recipient: employer._id,
      type: action === 'approve' ? 'employer_approved' : 'employer_rejected',
      title: action === 'approve' ? 'Account Approved ✅' : 'Account Rejected ❌',
      message: action === 'approve'
        ? 'Your employer account has been approved. You can now post jobs and hire candidates.'
        : 'Your employer account registration was not approved. Please contact support for more information.',
      link: action === 'approve' ? '/employer/dashboard' : '/'
    });

    res.json({ success: true, approvalStatus: employer.approvalStatus });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete a single notification
const deleteNotification = async (req, res) => {
  try {
    await Notification.findOneAndDelete({ _id: req.params.id, recipient: req.user._id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete all read notifications
const deleteAllRead = async (req, res) => {
  try {
    await Notification.deleteMany({ recipient: req.user._id, isRead: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Clear all notifications
const clearAll = async (req, res) => {
  try {
    await Notification.deleteMany({ recipient: req.user._id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Admin: get pending employers
const getPendingEmployers = async (req, res) => {
  try {
    const pending = await User.find({ role: 'employer', approvalStatus: 'pending' })
      .select('-password')
      .sort({ createdAt: -1 });
    res.json(pending);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { 
  getNotifications, 
  getUnreadCount, 
  markRead, 
  markAllRead, 
  deleteNotification,
  deleteAllRead,
  clearAll,
  handleEmployerApproval, 
  getPendingEmployers 
};
