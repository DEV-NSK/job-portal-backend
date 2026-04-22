const MockInterviewSession = require('../models/MockInterviewSession');
const { recordActivity } = require('./consistencyController');

const HR_QUESTIONS = [
  'Tell me about yourself and your background.',
  'Why are you interested in this role?',
  'Describe a challenging project you worked on and how you overcame obstacles.',
  'How do you handle tight deadlines and competing priorities?',
  'Tell me about a time you disagreed with a team member. How did you resolve it?',
  'Where do you see yourself in 5 years?',
  'What is your greatest professional achievement?',
  'How do you stay updated with industry trends?',
  'Describe your ideal work environment.',
  'Why are you leaving your current role?'
];

const TECHNICAL_QUESTIONS = {
  Frontend: [
    'Explain the difference between var, let, and const in JavaScript.',
    'What is the virtual DOM and how does React use it?',
    'How would you optimize a slow React application?',
    'Explain CSS specificity and how it works.',
    'What are React hooks and why were they introduced?',
    'How does event delegation work in JavaScript?',
    'Explain the difference between synchronous and asynchronous JavaScript.',
    'What is CORS and how do you handle it?'
  ],
  Backend: [
    'Explain RESTful API design principles.',
    'What is the difference between SQL and NoSQL databases?',
    'How does indexing work in databases?',
    'Explain the concept of middleware in Express.js.',
    'What is JWT and how does it work?',
    'How would you handle database transactions?',
    'Explain the difference between authentication and authorization.',
    'What is connection pooling and why is it important?'
  ],
  'Data Engineering': [
    'What is the difference between OLTP and OLAP?',
    'Explain ETL vs ELT pipelines.',
    'How would you design a data warehouse schema?',
    'What is Apache Kafka and when would you use it?',
    'Explain partitioning in distributed databases.',
    'What is data normalization?',
    'How do you handle data quality issues in a pipeline?',
    'Explain the CAP theorem.'
  ],
  DevOps: [
    'What is the difference between Docker and a virtual machine?',
    'Explain CI/CD pipeline design.',
    'What is Kubernetes and what problems does it solve?',
    'How would you monitor a production application?',
    'Explain blue-green deployment.',
    'What is infrastructure as code?',
    'How do you handle secrets management?',
    'Explain the 12-factor app methodology.'
  ],
  'Product Management': [
    'How do you prioritize features in a product backlog?',
    'Describe your approach to user research.',
    'How do you measure product success?',
    'Tell me about a product you admire and why.',
    'How do you handle conflicting stakeholder requirements?',
    'Describe your experience with A/B testing.',
    'How do you work with engineering teams?',
    'What metrics would you track for a new feature launch?'
  ]
};

const scoreAnswer = async (question, answer, mode) => {
  if (process.env.OPENAI_API_KEY && answer && answer.length > 20) {
    try {
      const { OpenAI } = require('openai');
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{
          role: 'system',
          content: `You are an expert interviewer. Score this ${mode === 'hr' ? 'behavioural' : 'technical'} interview answer on a scale of 1-10 for: clarity, depth, structure${mode === 'technical' ? ', correctness' : ''}. Also provide brief feedback (1-2 sentences). Return JSON: {clarity, depth, structure${mode === 'technical' ? ', correctness' : ''}, overall, feedback}`
        }, {
          role: 'user',
          content: `Question: ${question}\nAnswer: ${answer}`
        }],
        max_tokens: 200,
        response_format: { type: 'json_object' }
      });
      return JSON.parse(completion.choices[0].message.content);
    } catch (err) {
      console.error('OpenAI scoring error:', err.message);
    }
  }

  // Fallback scoring based on answer length and keywords
  const wordCount = (answer || '').split(' ').length;
  const clarity = Math.min(10, Math.max(4, Math.round(wordCount / 15)));
  const depth = Math.min(10, Math.max(4, Math.round(wordCount / 20)));
  const structure = answer.includes('first') || answer.includes('then') || answer.includes('finally') ? 8 : 6;
  const overall = Math.round((clarity + depth + structure) / 3 * 10) / 10;
  return {
    clarity, depth, structure,
    ...(mode === 'technical' ? { correctness: 7 } : {}),
    overall,
    feedback: 'Good answer. Consider adding more specific examples and quantifiable results to strengthen your response.'
  };
};

// POST /api/mock-interview/start
const startSession = async (req, res) => {
  try {
    const { mode, role, inputMode } = req.body;
    const session = await MockInterviewSession.create({
      user: req.user._id,
      mode: mode || 'hr',
      role: role || 'Frontend',
      inputMode: inputMode || 'text',
      status: 'active'
    });

    const questions = mode === 'hr'
      ? HR_QUESTIONS
      : (TECHNICAL_QUESTIONS[role] || TECHNICAL_QUESTIONS.Frontend);

    res.status(201).json({
      sessionId: session._id,
      firstQuestion: questions[0],
      totalQuestions: questions.length
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/mock-interview/:sessionId/answer
const submitAnswer = async (req, res) => {
  try {
    const { answer } = req.body;
    const session = await MockInterviewSession.findOne({ _id: req.params.sessionId, user: req.user._id });
    if (!session) return res.status(404).json({ message: 'Session not found' });

    const questions = session.mode === 'hr'
      ? HR_QUESTIONS
      : (TECHNICAL_QUESTIONS[session.role] || TECHNICAL_QUESTIONS.Frontend);

    const currentIndex = session.questions.length;
    const currentQuestion = questions[currentIndex];

    // Score the answer
    const scores = await scoreAnswer(currentQuestion, answer, session.mode);

    session.questions.push({
      question: currentQuestion,
      answer: answer || '',
      scores: {
        clarity: scores.clarity || 7,
        depth: scores.depth || 7,
        structure: scores.structure || 7,
        correctness: scores.correctness || 7
      },
      feedback: scores.feedback || '',
      overall: scores.overall || 7
    });
    await session.save();

    const nextIndex = currentIndex + 1;
    const hasMore = nextIndex < questions.length;

    res.json({
      scores,
      nextQuestion: hasMore ? questions[nextIndex] : null,
      questionNumber: nextIndex + 1,
      totalQuestions: questions.length,
      isComplete: !hasMore
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/mock-interview/:sessionId/end
const endSession = async (req, res) => {
  try {
    const session = await MockInterviewSession.findOne({ _id: req.params.sessionId, user: req.user._id });
    if (!session) return res.status(404).json({ message: 'Session not found' });

    const overallScore = session.questions.length > 0
      ? Math.round((session.questions.reduce((a, q) => a + q.overall, 0) / session.questions.length) * 10) / 10
      : 0;

    session.status = 'completed';
    session.overallScore = overallScore;
    session.completedAt = new Date();
    session.report = {
      summary: `You completed a ${session.mode === 'hr' ? 'HR' : 'Technical'} interview for ${session.role} role with an overall score of ${overallScore}/10.`,
      strengths: ['Clear communication', 'Relevant examples'],
      improvements: ['Add more quantifiable results', 'Structure answers using STAR method'],
      resources: [
        { title: 'STAR Method Guide', type: 'Article', platform: 'Platform' },
        { title: 'Behavioural Interview Prep', type: 'Course', platform: 'Coursera' }
      ]
    };
    await session.save();

    await recordActivity(req.user._id, 'mockInterviews');

    res.json({ success: true, overallScore, sessionId: session._id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/mock-interview/:sessionId/report
const getReport = async (req, res) => {
  try {
    const session = await MockInterviewSession.findOne({ _id: req.params.sessionId, user: req.user._id });
    if (!session) return res.status(404).json({ message: 'Session not found' });
    res.json(session);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/mock-interview/sessions
const getSessions = async (req, res) => {
  try {
    const sessions = await MockInterviewSession.find({ user: req.user._id, status: 'completed' })
      .sort({ createdAt: -1 }).limit(10)
      .select('mode role overallScore completedAt createdAt');
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { startSession, submitAnswer, endSession, getReport, getSessions };
