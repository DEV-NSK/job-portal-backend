const router = require('express').Router();
const { protect, employerOnly } = require('../middleware/authMiddleware');

const funnel = require('../controllers/hiringFunnelController');
const ranking = require('../controllers/candidateRankingController');
const shortlist = require('../controllers/autoShortlistController');
const timeline = require('../controllers/candidateTimelineController');
const blind = require('../controllers/blindHiringController');
const pool = require('../controllers/talentPoolController');
const health = require('../controllers/jobHealthController');
const skillJob = require('../controllers/skillJobPostingController');
const microInternship = require('../controllers/microInternshipController');

// ── F11: Hiring Funnel ───────────────────────────────────────────────────────
router.get('/jobs/:jobId/funnel', protect, funnel.getFunnel);
router.get('/jobs/:jobId/funnel/:stage/candidates', protect, funnel.getStageCandidates);
router.patch('/applications/:id/stage', protect, funnel.updateStage);
router.get('/jobs/:jobId/funnel/export', protect, funnel.exportFunnel);

// ── F12: Candidate Ranking ───────────────────────────────────────────────────
router.get('/jobs/:jobId/applicants/ranked', protect, ranking.getRankedApplicants);
router.post('/pins', protect, ranking.pinCandidate);
router.delete('/pins/:jobId/:candidateId', protect, ranking.unpinCandidate);

// ── F14: Auto Shortlisting ───────────────────────────────────────────────────
router.post('/shortlist', protect, shortlist.autoShortlist);
router.post('/shortlist/approve', protect, shortlist.approveShortlist);

// ── F15: Candidate Timeline ──────────────────────────────────────────────────
router.get('/applications/:appId/timeline', protect, timeline.getTimeline);
router.post('/applications/:appId/timeline/note', protect, timeline.addNote);

// ── F16: Blind Hiring ────────────────────────────────────────────────────────
router.post('/jobs/:jobId/blind-mode', protect, blind.toggleBlindMode);
router.post('/blind/reveal', protect, blind.revealIdentity);

// ── F17: Skill-Based Job Posting ─────────────────────────────────────────────
router.post('/jobs/skill-match', protect, skillJob.findSkillMatches);

// ── F18: Dynamic Job Posts / Health ─────────────────────────────────────────
router.get('/jobs/:jobId/health', protect, health.getJobHealth);
router.patch('/jobs/:jobId/tier', protect, health.overrideTier);
router.get('/jobs/health-overview', protect, health.getHealthOverview);

// ── F20: Talent Pools ────────────────────────────────────────────────────────
router.get('/talent-pools', protect, pool.getPools);
router.post('/talent-pools', protect, pool.createPool);
router.get('/talent-pools/:id/members', protect, pool.getPoolMembers);
router.post('/talent-pools/:id/members', protect, pool.addMember);
router.delete('/talent-pools/:id/members/:candidateId', protect, pool.removeMember);
router.delete('/talent-pools/:id', protect, pool.deletePool);
router.get('/talent-pools/:id/export', protect, pool.exportPool);

module.exports = router;
