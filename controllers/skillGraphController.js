const User = require('../models/User');
const Job = require('../models/Job');

// Static skill relationship graph (prerequisite + co-occurrence edges)
const SKILL_EDGES = [
  { source: 'React', target: 'TypeScript', type: 'co-occurrence' },
  { source: 'React', target: 'Next.js', type: 'prerequisite' },
  { source: 'React', target: 'GraphQL', type: 'co-occurrence' },
  { source: 'Node.js', target: 'MongoDB', type: 'co-occurrence' },
  { source: 'Node.js', target: 'Redis', type: 'co-occurrence' },
  { source: 'Node.js', target: 'GraphQL', type: 'co-occurrence' },
  { source: 'Docker', target: 'Kubernetes', type: 'prerequisite' },
  { source: 'Docker', target: 'AWS', type: 'co-occurrence' },
  { source: 'AWS', target: 'Redis', type: 'co-occurrence' },
  { source: 'Python', target: 'MongoDB', type: 'co-occurrence' },
  { source: 'TypeScript', target: 'Next.js', type: 'co-occurrence' },
  { source: 'PostgreSQL', target: 'Node.js', type: 'co-occurrence' },
  { source: 'JavaScript', target: 'React', type: 'prerequisite' },
  { source: 'JavaScript', target: 'Node.js', type: 'prerequisite' },
  { source: 'CSS', target: 'React', type: 'co-occurrence' },
  { source: 'HTML', target: 'CSS', type: 'prerequisite' },
  { source: 'Git', target: 'Docker', type: 'co-occurrence' },
  { source: 'Python', target: 'AWS', type: 'co-occurrence' }
];

// Market demand scores (based on job posting frequency)
const SKILL_DEMAND = {
  'React': 95, 'Node.js': 88, 'TypeScript': 92, 'GraphQL': 72, 'Docker': 80,
  'AWS': 85, 'Python': 90, 'MongoDB': 70, 'Redis': 65, 'Kubernetes': 75,
  'Next.js': 88, 'PostgreSQL': 78, 'JavaScript': 98, 'CSS': 85, 'HTML': 80,
  'Git': 95, 'Java': 82, 'Go': 70, 'Vue': 65, 'Angular': 60,
  'Django': 55, 'Flask': 50, 'Spring': 65, 'Kafka': 60, 'Terraform': 68
};

const SKILL_RESOURCES = {
  'React': ['React Docs', 'Epic React by Kent C. Dodds', 'React Patterns'],
  'Node.js': ['Node.js Docs', 'Node.js Design Patterns', 'The Complete Node.js Developer'],
  'TypeScript': ['TypeScript Handbook', 'Total TypeScript', 'TypeScript Deep Dive'],
  'GraphQL': ['GraphQL.org', 'How to GraphQL', 'Apollo Docs'],
  'Docker': ['Docker Docs', 'Docker & Kubernetes: The Complete Guide', 'Play with Docker'],
  'AWS': ['AWS Free Tier', 'AWS Certified Solutions Architect', 'A Cloud Guru'],
  'Python': ['Python.org', 'Automate the Boring Stuff', 'Real Python'],
  'MongoDB': ['MongoDB University', 'MongoDB Docs', 'Mongoose Docs'],
  'Redis': ['Redis Docs', 'Redis University', 'Redis in Action'],
  'Kubernetes': ['Kubernetes Docs', 'CKA Course', 'Kubernetes in Action'],
  'Next.js': ['Next.js Docs', 'Next.js by Vercel', 'Lee Robinson Blog'],
  'PostgreSQL': ['PostgreSQL Docs', 'Use The Index, Luke', 'Postgres Weekly']
};

// GET /api/skill-graph
const getGraph = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const userSkills = (user.skills || []).map(s => s.trim());

    // Get top skills from job postings
    const jobSkillAgg = await Job.aggregate([
      { $match: { isActive: true } },
      { $unwind: '$skills' },
      { $group: { _id: '$skills', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 30 }
    ]);
    const marketSkills = jobSkillAgg.map(s => s._id);

    // Build node list: user skills + market skills
    const allSkillNames = [...new Set([...userSkills, ...marketSkills.slice(0, 15)])];

    // Assign positions in a circular layout
    const nodes = allSkillNames.map((skill, i) => {
      const angle = (i / allSkillNames.length) * 2 * Math.PI;
      const radius = 200;
      const cx = 400, cy = 280;

      let status = 'gap';
      if (userSkills.some(us => us.toLowerCase() === skill.toLowerCase())) status = 'known';

      return {
        id: skill.toLowerCase().replace(/[^a-z0-9]/g, ''),
        label: skill,
        status,
        demand: SKILL_DEMAND[skill] || Math.floor(Math.random() * 30 + 50),
        x: Math.round(cx + radius * Math.cos(angle)),
        y: Math.round(cy + radius * Math.sin(angle))
      };
    });

    // Filter edges to only include nodes in our set
    const nodeIds = new Set(nodes.map(n => n.label));
    const edges = SKILL_EDGES.filter(e => nodeIds.has(e.source) && nodeIds.has(e.target));

    res.json({ nodes, edges });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/skill-graph/:skillId
const getSkillDetail = async (req, res) => {
  try {
    const skillName = req.params.skillId;

    // Count jobs requiring this skill
    const jobCount = await Job.countDocuments({
      isActive: true,
      skills: { $regex: skillName, $options: 'i' }
    });

    // Count users with this skill
    const userCount = await User.countDocuments({
      skills: { $regex: skillName, $options: 'i' }
    });

    const demand = SKILL_DEMAND[skillName] || 65;
    const resources = SKILL_RESOURCES[skillName] || ['Official Documentation', 'Online Tutorials', 'Practice Projects'];

    res.json({
      skill: skillName,
      demand,
      trend: `+${Math.floor(demand / 5)}%`,
      salaryImpact: `+$${Math.floor(demand / 10)}k`,
      resources,
      jobCount,
      userCount,
      relatedSkills: SKILL_EDGES
        .filter(e => e.source === skillName || e.target === skillName)
        .map(e => e.source === skillName ? e.target : e.source)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getGraph, getSkillDetail };
