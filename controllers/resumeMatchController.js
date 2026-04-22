const ResumeMatch = require('../models/ResumeMatch');
const User = require('../models/User');

// Simple keyword-based matching (no OpenAI required)
const extractKeywords = (text) => {
  const techKeywords = [
    'react', 'node.js', 'nodejs', 'javascript', 'typescript', 'python', 'java', 'c++', 'go',
    'aws', 'docker', 'kubernetes', 'mongodb', 'postgresql', 'redis', 'graphql', 'rest api',
    'git', 'agile', 'scrum', 'ci/cd', 'microservices', 'sql', 'nosql', 'html', 'css',
    'vue', 'angular', 'next.js', 'express', 'django', 'flask', 'spring', 'kafka', 'rabbitmq',
    'terraform', 'jenkins', 'github actions', 'linux', 'bash', 'system design', 'machine learning',
    'data structures', 'algorithms', 'oop', 'functional programming', 'testing', 'jest', 'cypress'
  ];
  const lower = text.toLowerCase();
  return techKeywords.filter(k => lower.includes(k));
};

const computeMatchScore = (resumeKeywords, jdKeywords) => {
  if (jdKeywords.length === 0) return 70;
  const matches = resumeKeywords.filter(k => jdKeywords.includes(k));
  return Math.min(99, Math.round(50 + (matches.length / jdKeywords.length) * 50));
};

const generateSuggestions = (resumeText, jdText, missingKeywords) => {
  const suggestions = [];
  if (missingKeywords.length > 0) {
    suggestions.push({
      original: 'Generic experience description',
      improved: `Highlight experience with ${missingKeywords.slice(0, 3).join(', ')} — these are explicitly required in the job description`
    });
  }
  suggestions.push({
    original: 'Worked on various projects',
    improved: 'Led development of 3 production features serving 50k+ users, reducing load time by 40% through code splitting and lazy loading'
  });
  suggestions.push({
    original: 'Collaborated with team members',
    improved: 'Partnered with cross-functional teams of 8+ engineers to deliver 4 major product milestones on schedule, reducing sprint carryover by 60%'
  });
  return suggestions;
};

// POST /api/resume-match/analyze
const analyze = async (req, res) => {
  try {
    const { jobDescription, jobUrl, jobTitle } = req.body;
    const user = await User.findById(req.user._id);

    if (!jobDescription && !jobUrl) {
      return res.status(400).json({ message: 'Job description or URL required' });
    }

    const jdText = jobDescription || '';
    const resumeText = [
      user.bio || '',
      (user.skills || []).join(' '),
      (user.experience || []).map(e => `${e.title} ${e.company} ${e.description}`).join(' ')
    ].join(' ');

    const jdKeywords = extractKeywords(jdText);
    const resumeKeywords = extractKeywords(resumeText);

    const matchScore = computeMatchScore(resumeKeywords, jdKeywords);
    const keywordMatches = resumeKeywords.filter(k => jdKeywords.includes(k));
    const keywordMissing = jdKeywords.filter(k => !resumeKeywords.includes(k));
    const hardSkillsMissing = keywordMissing.slice(0, 5).map(k =>
      k.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    );

    // ATS probability: based on keyword density
    const atsProbability = Math.min(95, Math.round(matchScore * 0.9 + Math.random() * 5));
    const domainOverlap = Math.min(99, matchScore + 5);

    const suggestions = generateSuggestions(resumeText, jdText, keywordMissing);

    // Use OpenAI for better suggestions if available
    if (process.env.OPENAI_API_KEY && jdText.length > 100) {
      try {
        const { OpenAI } = require('openai');
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const completion = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [{
            role: 'system',
            content: 'You are a resume expert. Given a job description and candidate skills, provide 3 specific resume bullet improvements. Return JSON array: [{original, improved}]'
          }, {
            role: 'user',
            content: `Job Description: ${jdText.slice(0, 500)}\nCandidate Skills: ${user.skills?.join(', ')}\nMissing Keywords: ${keywordMissing.join(', ')}`
          }],
          max_tokens: 400,
          response_format: { type: 'json_object' }
        });
        const parsed = JSON.parse(completion.choices[0].message.content);
        if (parsed.suggestions || parsed.improvements) {
          suggestions.splice(0, suggestions.length, ...(parsed.suggestions || parsed.improvements || suggestions));
        }
      } catch (aiErr) {
        console.error('OpenAI resume match error:', aiErr.message);
      }
    }

    const saved = await ResumeMatch.create({
      user: req.user._id,
      jobTitle: jobTitle || 'Job Position',
      jobDescription: jdText.slice(0, 2000),
      jobUrl: jobUrl || '',
      matchScore,
      atsProbability,
      domainOverlap,
      hardSkillsMissing,
      softSkillsMissing: ['Cross-functional collaboration'],
      experienceDelta: 'Verify experience requirements match your background',
      keywordMatches: keywordMatches.map(k => k.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')),
      keywordMissing: keywordMissing.map(k => k.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')),
      resumeSuggestions: suggestions
    });

    res.json(saved);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/resume-match/saved
const getSaved = async (req, res) => {
  try {
    const analyses = await ResumeMatch.find({ user: req.user._id })
      .sort({ createdAt: -1 }).limit(20)
      .select('jobTitle matchScore createdAt jobUrl');
    res.json(analyses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/resume-match/:id/notes
const updateNotes = async (req, res) => {
  try {
    const match = await ResumeMatch.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { notes: req.body.notes },
      { new: true }
    );
    res.json(match);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/resume-match/:id
const deleteAnalysis = async (req, res) => {
  try {
    await ResumeMatch.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { analyze, getSaved, updateNotes, deleteAnalysis };
