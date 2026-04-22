/**
 * All 14 Feature Routes — fully wired to real controllers + MongoDB
 */
const router = require('express').Router();
const { protect } = require('../middleware/authMiddleware');

// Controllers
const copilot = require('../controllers/copilotController');
const profileScore = require('../controllers/profileScoreController');
const skillGraph = require('../controllers/skillGraphController');
const resumeMatch = require('../controllers/resumeMatchController');
const consistency = require('../controllers/consistencyController');
const coding = require('../controllers/codingController');
const interviewRoom = require('../controllers/interviewRoomController');
const codeQuality = require('../controllers/codeQualityController');
const project = require('../controllers/projectController');
const mockInterview = require('../controllers/mockInterviewController');
const learningPath = require('../controllers/learningPathController');
const opportunity = require('../controllers/opportunityController');
const peerRoom = require('../controllers/peerRoomController');
const reputation = require('../controllers/reputationController');

// ── F1: AI Career Copilot ────────────────────────────────────────────────────
router.get('/copilot/readiness', protect, copilot.getReadiness);
router.get('/copilot/briefing', protect, copilot.getBriefing);
router.get('/copilot/goals', protect, copilot.getGoals);
router.put('/copilot/goals', protect, copilot.setGoals);
router.get('/copilot/chat/history', protect, copilot.getChatHistory);
router.post('/copilot/chat', protect, copilot.chat);
router.post('/copilot/chat/:id/rate', protect, copilot.rateMessage);
router.get('/copilot/score-history', protect, copilot.getScoreHistory);

// ── F2: Profile Strength Score ───────────────────────────────────────────────
router.get('/profile-score', protect, profileScore.getScore);
router.get('/profile-score/history', protect, profileScore.getHistory);
router.get('/profile-score/improvements', protect, profileScore.getImprovements);

// ── F3: Skill Graph ──────────────────────────────────────────────────────────
router.get('/skill-graph', protect, skillGraph.getGraph);
router.get('/skill-graph/:skillId', protect, skillGraph.getSkillDetail);

// ── F4: Resume Match ─────────────────────────────────────────────────────────
router.post('/resume-match/analyze', protect, resumeMatch.analyze);
router.get('/resume-match/saved', protect, resumeMatch.getSaved);
router.put('/resume-match/:id/notes', protect, resumeMatch.updateNotes);
router.delete('/resume-match/:id', protect, resumeMatch.deleteAnalysis);

// ── F5: Consistency Tracker ──────────────────────────────────────────────────
router.get('/consistency/heatmap', protect, consistency.getHeatmap);
router.get('/consistency/streak', protect, consistency.getStreak);
router.put('/consistency/goal', protect, consistency.setGoal);

// ── F6: Daily Coding Practice ────────────────────────────────────────────────
router.get('/coding/daily', protect, coding.getDailyProblems);
router.get('/coding/problems', protect, coding.getProblems);
router.get('/coding/problems/:id', protect, coding.getProblem);
router.post('/coding/problems/:id/submit', protect, coding.submitSolution);
router.get('/coding/leaderboard', protect, coding.getLeaderboard);
router.get('/coding/xp', protect, coding.getXP);
router.get('/coding/stats', protect, coding.getStats);

// ── F7: Interview Rooms ──────────────────────────────────────────────────────
router.get('/interview-rooms', protect, interviewRoom.getRooms);
router.post('/interview-rooms', protect, interviewRoom.createRoom);
router.get('/interview-rooms/:id', protect, interviewRoom.getRoom);
router.put('/interview-rooms/:id/status', protect, interviewRoom.updateStatus);
router.post('/interview-rooms/:id/report', protect, interviewRoom.saveReport);
router.post('/interview-rooms/:id/chat', protect, interviewRoom.addChatMessage);

// ── F8: Code Quality Analyzer ────────────────────────────────────────────────
router.post('/code-quality/analyze', protect, codeQuality.analyze);
router.get('/code-quality/history', protect, codeQuality.getHistory);

// ── F9: Project-Based Hiring ─────────────────────────────────────────────────
router.get('/projects', protect, project.getProjects);
router.post('/projects', protect, project.createProject);
router.get('/projects/my-submissions', protect, project.getMySubmissions);
router.get('/projects/:id', protect, project.getProject);
router.post('/projects/:id/accept', protect, project.acceptProject);
router.post('/projects/:id/submit', protect, project.submitProject);

// ── F10: Mock Interview Bot ──────────────────────────────────────────────────
router.get('/mock-interview/sessions', protect, mockInterview.getSessions);
router.post('/mock-interview/start', protect, mockInterview.startSession);
router.post('/mock-interview/:sessionId/answer', protect, mockInterview.submitAnswer);
router.post('/mock-interview/:sessionId/end', protect, mockInterview.endSession);
router.get('/mock-interview/:sessionId/report', protect, mockInterview.getReport);

// ── F11: Learning Path ───────────────────────────────────────────────────────
router.get('/learning-path', protect, learningPath.getPath);
router.post('/learning-path/generate', protect, learningPath.generatePath);
router.put('/learning-path/resources/:weekIndex/:resourceIndex/complete', protect, learningPath.markResourceComplete);

// ── F12: Opportunity Score ───────────────────────────────────────────────────
router.get('/opportunity/jobs', protect, opportunity.getOpportunityJobs);
router.get('/opportunity/jobs/:jobId/score', protect, opportunity.getJobScore);

// ── F13: Peer Coding Rooms ───────────────────────────────────────────────────
router.get('/peer-rooms', protect, peerRoom.getLobby);
router.post('/peer-rooms', protect, peerRoom.createRoom);
router.post('/peer-rooms/:id/join', protect, peerRoom.joinRoom);
router.post('/peer-rooms/:id/leave', protect, peerRoom.leaveRoom);
router.post('/peer-rooms/:id/chat', protect, peerRoom.sendChat);
router.post('/peer-rooms/:id/rate', protect, peerRoom.rateSession);
router.put('/peer-rooms/:id/role', protect, peerRoom.switchRole);

// ── F14: Reputation System ───────────────────────────────────────────────────
router.get('/reputation', protect, reputation.getReputation);
router.get('/reputation/profile/:username', reputation.getPublicProfile);
router.post('/reputation/connect/github', protect, reputation.connectGitHub);
router.post('/reputation/connect/leetcode', protect, reputation.connectLeetCode);
router.post('/reputation/endorse', protect, reputation.requestEndorsement);

module.exports = router;
