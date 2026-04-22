const router = require('express').Router();
const { getStats, getAllUsers, deleteUser, getAllJobs, getAllPosts, deleteAdminPost } = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.use(protect, adminOnly);
router.get('/stats', getStats);
router.get('/users', getAllUsers);
router.delete('/users/:id', deleteUser);
router.get('/jobs', getAllJobs);
router.get('/posts', getAllPosts);
router.delete('/post/:id', deleteAdminPost);

module.exports = router;
