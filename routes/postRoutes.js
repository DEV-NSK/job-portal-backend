const router = require('express').Router();
const upload = require('../middleware/upload');
const {
  createPost, getPosts, deletePost, likePost,
  addComment, getComments, deleteComment
} = require('../controllers/postController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getPosts);
router.post('/', protect, upload.single('image'), createPost);
router.delete('/:id', protect, deletePost);
router.post('/:id/like', protect, likePost);
router.post('/:id/comment', protect, addComment);
router.get('/:id/comments', protect, getComments);
router.delete('/comments/:id', protect, deleteComment);

module.exports = router;
