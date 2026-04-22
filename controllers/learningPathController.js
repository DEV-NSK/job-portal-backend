const LearningPath = require('../models/LearningPath');
const { recordActivity } = require('./consistencyController');

const DEFAULT_PATHS = {
  'Frontend Engineer': [
    { week: 1, title: 'JavaScript Fundamentals', objectives: ['Closures & Scope', 'Promises & Async/Await', 'ES6+ Features'], resources: [
      { title: 'JavaScript: The Hard Parts', platform: 'Frontend Masters', time: '4h', type: 'video', url: 'https://frontendmasters.com' },
      { title: 'Async JavaScript Deep Dive', platform: 'YouTube', time: '2h', type: 'video', url: 'https://youtube.com' },
      { title: 'JS30 Challenge', platform: 'Wes Bos', time: '3h', type: 'practice', url: 'https://javascript30.com' }
    ]},
    { week: 2, title: 'React Advanced Patterns', objectives: ['Custom Hooks', 'Context & State Management', 'Performance Optimization'], resources: [
      { title: 'Advanced React Patterns', platform: 'Kent C. Dodds', time: '5h', type: 'course', url: 'https://epicreact.dev' },
      { title: 'React Performance', platform: 'YouTube', time: '1.5h', type: 'video', url: 'https://youtube.com' },
      { title: 'Build a Custom Hook Library', platform: 'Platform', time: '2h', type: 'practice', url: '#' }
    ]},
    { week: 3, title: 'TypeScript Mastery', objectives: ['Generics', 'Utility Types', 'Type Guards'], resources: [
      { title: 'TypeScript Handbook', platform: 'Official Docs', time: '3h', type: 'docs', url: 'https://typescriptlang.org' },
      { title: 'TypeScript with React', platform: 'Udemy', time: '4h', type: 'course', url: 'https://udemy.com' },
      { title: 'TS Coding Challenge', platform: 'Platform', time: '1h', type: 'practice', url: '#' }
    ]},
    { week: 4, title: 'System Design Basics', objectives: ['Scalability Concepts', 'Database Design', 'API Design'], resources: [
      { title: 'System Design Primer', platform: 'GitHub', time: '6h', type: 'docs', url: 'https://github.com/donnemartin/system-design-primer' },
      { title: 'Designing Data-Intensive Apps', platform: 'Book', time: '8h', type: 'reading', url: '#' }
    ]},
    { week: 5, title: 'Testing & Quality', objectives: ['Unit Testing', 'Integration Testing', 'E2E Testing'], resources: [
      { title: 'Testing JavaScript', platform: 'Kent C. Dodds', time: '4h', type: 'course', url: 'https://testingjavascript.com' },
      { title: 'Cypress Documentation', platform: 'Official Docs', time: '2h', type: 'docs', url: 'https://cypress.io' }
    ]},
    { week: 6, title: 'Performance & Optimization', objectives: ['Core Web Vitals', 'Bundle Optimization', 'Caching'], resources: [
      { title: 'Web Performance Fundamentals', platform: 'Frontend Masters', time: '3h', type: 'video', url: 'https://frontendmasters.com' },
      { title: 'Lighthouse CI Setup', platform: 'Official Docs', time: '1h', type: 'docs', url: 'https://developers.google.com' }
    ]},
    { week: 7, title: 'Interview Preparation', objectives: ['LeetCode Practice', 'System Design Mock', 'Behavioural Questions'], resources: [
      { title: 'LeetCode Top 150', platform: 'LeetCode', time: '10h', type: 'practice', url: 'https://leetcode.com' },
      { title: 'Mock Interview Practice', platform: 'Platform', time: '3h', type: 'practice', url: '#' }
    ]},
    { week: 8, title: 'Final Review & Applications', objectives: ['Portfolio Polish', 'Resume Update', 'Apply to Target Roles'], resources: [
      { title: 'Portfolio Review Checklist', platform: 'Platform', time: '2h', type: 'docs', url: '#' },
      { title: 'Resume Optimization', platform: 'Platform', time: '1h', type: 'practice', url: '#' }
    ]}
  ],
  'Backend Engineer': [
    { week: 1, title: 'Node.js Deep Dive', objectives: ['Event Loop', 'Streams', 'Cluster Module'], resources: [
      { title: 'Node.js Documentation', platform: 'Official Docs', time: '4h', type: 'docs', url: 'https://nodejs.org' },
      { title: 'Node.js Design Patterns', platform: 'Book', time: '6h', type: 'reading', url: '#' }
    ]},
    { week: 2, title: 'Database Design', objectives: ['SQL Optimization', 'Indexing', 'Transactions'], resources: [
      { title: 'Use The Index, Luke', platform: 'Online', time: '4h', type: 'docs', url: 'https://use-the-index-luke.com' },
      { title: 'PostgreSQL Tutorial', platform: 'Official Docs', time: '3h', type: 'docs', url: 'https://postgresql.org' }
    ]},
    { week: 3, title: 'API Design & Security', objectives: ['REST Best Practices', 'Authentication', 'Rate Limiting'], resources: [
      { title: 'API Design Patterns', platform: 'Book', time: '5h', type: 'reading', url: '#' },
      { title: 'OWASP Security Guide', platform: 'OWASP', time: '3h', type: 'docs', url: 'https://owasp.org' }
    ]},
    { week: 4, title: 'Microservices & Messaging', objectives: ['Service Design', 'Kafka Basics', 'Docker'], resources: [
      { title: 'Microservices Patterns', platform: 'Book', time: '6h', type: 'reading', url: '#' },
      { title: 'Docker Getting Started', platform: 'Official Docs', time: '2h', type: 'docs', url: 'https://docker.com' }
    ]},
    { week: 5, title: 'System Design', objectives: ['Scalability', 'Caching', 'Load Balancing'], resources: [
      { title: 'System Design Interview', platform: 'Book', time: '8h', type: 'reading', url: '#' },
      { title: 'High Scalability Blog', platform: 'Blog', time: '3h', type: 'reading', url: 'http://highscalability.com' }
    ]},
    { week: 6, title: 'Cloud & DevOps', objectives: ['AWS Basics', 'CI/CD', 'Monitoring'], resources: [
      { title: 'AWS Free Tier', platform: 'AWS', time: '5h', type: 'practice', url: 'https://aws.amazon.com' },
      { title: 'GitHub Actions', platform: 'GitHub', time: '2h', type: 'docs', url: 'https://github.com' }
    ]},
    { week: 7, title: 'Interview Preparation', objectives: ['System Design Practice', 'Coding Challenges', 'Behavioural'], resources: [
      { title: 'LeetCode Top 150', platform: 'LeetCode', time: '10h', type: 'practice', url: 'https://leetcode.com' },
      { title: 'System Design Mock', platform: 'Platform', time: '3h', type: 'practice', url: '#' }
    ]},
    { week: 8, title: 'Final Review', objectives: ['Portfolio', 'Resume', 'Applications'], resources: [
      { title: 'Resume Optimization', platform: 'Platform', time: '1h', type: 'practice', url: '#' }
    ]}
  ]
};

const getDefaultPath = (targetRole) => {
  if (targetRole.toLowerCase().includes('frontend')) return DEFAULT_PATHS['Frontend Engineer'];
  if (targetRole.toLowerCase().includes('backend')) return DEFAULT_PATHS['Backend Engineer'];
  return DEFAULT_PATHS['Frontend Engineer']; // default
};

const estimateReadyDate = (totalDays) => {
  const date = new Date();
  date.setDate(date.getDate() + totalDays);
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};

// GET /api/learning-path
const getPath = async (req, res) => {
  try {
    const path = await LearningPath.findOne({ user: req.user._id });
    res.json(path || null);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/learning-path/generate
const generatePath = async (req, res) => {
  try {
    const { targetRole, isFastTrack } = req.body;
    if (!targetRole) return res.status(400).json({ message: 'Target role required' });

    const totalDays = isFastTrack ? 30 : 60;
    let weeks = getDefaultPath(targetRole);

    // Use OpenAI for custom path if available
    if (process.env.OPENAI_API_KEY) {
      try {
        const { OpenAI } = require('openai');
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const completion = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [{
            role: 'system',
            content: `Create a ${totalDays}-day learning path for a ${targetRole} role. Return JSON with weeks array: [{week, title, objectives: [], resources: [{title, platform, time, type, url}]}]. Include 8 weeks with 2-4 resources each. Focus on practical skills.`
          }, {
            role: 'user',
            content: `Generate a ${isFastTrack ? '30-day fast track' : '60-day'} learning path for: ${targetRole}`
          }],
          max_tokens: 1500,
          response_format: { type: 'json_object' }
        });
        const parsed = JSON.parse(completion.choices[0].message.content);
        if (parsed.weeks && Array.isArray(parsed.weeks)) {
          weeks = parsed.weeks;
        }
      } catch (aiErr) {
        console.error('OpenAI learning path error:', aiErr.message);
      }
    }

    // Mark first week as current
    if (weeks.length > 0) {
      weeks[0].current = true;
      weeks[0].completed = false;
    }

    const path = await LearningPath.findOneAndUpdate(
      { user: req.user._id },
      {
        user: req.user._id,
        targetRole,
        totalDays,
        currentDay: 1,
        isFastTrack: isFastTrack || false,
        estimatedReadyDate: estimateReadyDate(totalDays),
        weeks
      },
      { upsert: true, new: true }
    );

    res.json(path);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/learning-path/resources/:weekIndex/:resourceIndex/complete
const markResourceComplete = async (req, res) => {
  try {
    const { weekIndex, resourceIndex } = req.params;
    const path = await LearningPath.findOne({ user: req.user._id });
    if (!path) return res.status(404).json({ message: 'No learning path found' });

    const wi = parseInt(weekIndex);
    const ri = parseInt(resourceIndex);

    if (path.weeks[wi] && path.weeks[wi].resources[ri]) {
      path.weeks[wi].resources[ri].done = !path.weeks[wi].resources[ri].done;

      // Check if week is complete
      const allDone = path.weeks[wi].resources.every(r => r.done);
      if (allDone) {
        path.weeks[wi].completed = true;
        if (path.weeks[wi + 1]) {
          path.weeks[wi].current = false;
          path.weeks[wi + 1].current = true;
        }
      }

      path.markModified('weeks');
      await path.save();
      await recordActivity(req.user._id, 'coursesProgressed');
    }

    res.json(path);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getPath, generatePath, markResourceComplete };
