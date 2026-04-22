const Post = require('../models/Post');
const Comment = require('../models/Comment');

const createPost = async (req, res) => {
  try {
    const post = await Post.create({
      author: req.user._id,
      content: req.body.content,
      image: req.file ? `/uploads/${req.file.filename}` : ''
    });
    await post.populate('author', 'name avatar role');
    res.status(201).json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getPosts = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const posts = await Post.find()
      .populate('author', 'name avatar role')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await Post.countDocuments();
    res.json({ posts, total });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deletePost = async (req, res) => {
  try {
    const query = req.user.role === 'admin' ? { _id: req.params.id } : { _id: req.params.id, author: req.user._id };
    await Post.findOneAndDelete(query);
    await Comment.deleteMany({ post: req.params.id });
    res.json({ message: 'Post deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    const liked = post.likes.includes(req.user._id);
    if (liked) post.likes.pull(req.user._id);
    else post.likes.push(req.user._id);
    await post.save();
    res.json({ likes: post.likes.length, liked: !liked });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const addComment = async (req, res) => {
  try {
    const comment = await Comment.create({
      post: req.params.id,
      author: req.user._id,
      content: req.body.content
    });
    await Post.findByIdAndUpdate(req.params.id, { $inc: { commentsCount: 1 } });
    await comment.populate('author', 'name avatar');
    res.status(201).json(comment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getComments = async (req, res) => {
  try {
    const comments = await Comment.find({ post: req.params.id })
      .populate('author', 'name avatar')
      .sort({ createdAt: 1 });
    res.json(comments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteComment = async (req, res) => {
  try {
    const query = req.user.role === 'admin' ? { _id: req.params.id } : { _id: req.params.id, author: req.user._id };
    const comment = await Comment.findOneAndDelete(query);
    if (comment) await Post.findByIdAndUpdate(comment.post, { $inc: { commentsCount: -1 } });
    res.json({ message: 'Comment deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createPost, getPosts, deletePost, likePost, addComment, getComments, deleteComment };
