const router = require('express').Router();
const {
  getNotifications, getUnreadCount, markRead, markAllRead,
  deleteNotification, deleteAllRead, clearAll,
  handleEmployerApproval, getPendingEmployers
} = require('../controllers/notificationController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.put('/:id/read', markRead);
router.put('/mark-all-read', markAllRead);
router.delete('/:id', deleteNotification);
router.delete('/read', deleteAllRead);
router.delete('/', clearAll);

// Admin only
router.get('/admin/pending-employers', adminOnly, getPendingEmployers);
router.post('/admin/employer-approval', adminOnly, handleEmployerApproval);

module.exports = router;
