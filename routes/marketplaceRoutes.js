const router = require('express').Router();
const { protect } = require('../middleware/authMiddleware');
const micro = require('../controllers/microInternshipController');
const skillJob = require('../controllers/skillJobPostingController');

// ── F19: Micro-Internships ───────────────────────────────────────────────────
router.get('/micro-internships', micro.getMarketplace);
router.post('/micro-internships', protect, micro.createInternship);
router.get('/micro-internships/my', protect, micro.getMyInternships);
router.post('/micro-internships/:id/apply', protect, micro.applyToInternship);
router.post('/micro-internships/:id/accept/:candidateId', protect, micro.acceptCandidate);
router.post('/micro-internships/:id/submit', protect, micro.submitWork);
router.get('/micro-internships/:id/submissions', protect, micro.getSubmissions);
router.post('/micro-internships/:id/evaluate/:submissionId', protect, micro.evaluateSubmission);
router.post('/micro-internships/:id/fast-track/:candidateId', protect, micro.fastTrack);

// ── F17: Quick Apply ─────────────────────────────────────────────────────────
router.post('/quick-apply', protect, skillJob.quickApply);

module.exports = router;
