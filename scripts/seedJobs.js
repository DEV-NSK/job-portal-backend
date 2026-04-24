require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Job = require('../models/Job');

const RECRUITER_EMAIL = 'hirex@gmail.com';

const jobPosts = [
  {
    title: 'Senior Full Stack Developer',
    companyName: 'TechCorp Solutions',
    description: 'We are seeking an experienced Full Stack Developer to join our dynamic team. You will be responsible for developing and maintaining web applications using modern technologies. The ideal candidate should have strong problem-solving skills and a passion for creating scalable solutions.',
    requirements: [
      '5+ years of experience in full-stack development',
      'Expert knowledge of React, Node.js, and MongoDB',
      'Experience with cloud platforms (AWS/Azure)',
      'Strong understanding of RESTful APIs and microservices',
      'Excellent communication and teamwork skills'
    ],
    location: 'Bangalore, India',
    type: 'Full-time',
    salary: '₹18-25 LPA',
    experience: '5-8 years',
    skills: ['React', 'Node.js', 'MongoDB', 'AWS', 'TypeScript', 'Docker'],
    category: 'Software Development',
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    isActive: true,
    requiredSkills: [
      { skillName: 'React', isRequired: true, weight: 3 },
      { skillName: 'Node.js', isRequired: true, weight: 3 },
      { skillName: 'MongoDB', isRequired: true, weight: 2 }
    ],
    isSkillBased: true,
    minMatchThreshold: 75
  },
  {
    title: 'Frontend Developer (React)',
    companyName: 'Digital Innovations Ltd',
    description: 'Join our frontend team to build beautiful and responsive user interfaces. We are looking for a talented React developer who can transform designs into pixel-perfect implementations.',
    requirements: [
      '2-3 years of experience with React.js',
      'Strong knowledge of HTML5, CSS3, and JavaScript',
      'Experience with state management (Redux/Context API)',
      'Familiarity with modern build tools (Webpack, Vite)',
      'Understanding of responsive design principles'
    ],
    location: 'Hyderabad, India',
    type: 'Full-time',
    salary: '₹8-12 LPA',
    experience: '2-3 years',
    skills: ['React', 'JavaScript', 'CSS3', 'Redux', 'Tailwind CSS', 'Git'],
    category: 'Frontend Development',
    deadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
    isActive: true,
    isHot: true
  },
  {
    title: 'Backend Developer - Node.js',
    companyName: 'CloudScale Systems',
    description: 'We need a skilled Backend Developer to design and implement robust server-side applications. You will work on building scalable APIs and integrating with various third-party services.',
    requirements: [
      '3-5 years of Node.js development experience',
      'Strong knowledge of Express.js and RESTful API design',
      'Experience with SQL and NoSQL databases',
      'Understanding of authentication and authorization',
      'Knowledge of microservices architecture'
    ],
    location: 'Pune, India',
    type: 'Full-time',
    salary: '₹12-18 LPA',
    experience: '3-5 years',
    skills: ['Node.js', 'Express', 'PostgreSQL', 'MongoDB', 'Redis', 'Docker'],
    category: 'Backend Development',
    deadline: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
    isActive: true
  },
  {
    title: 'Junior Python Developer',
    companyName: 'DataTech Analytics',
    description: 'Great opportunity for freshers or junior developers to start their career in Python development. You will work on data processing pipelines and automation scripts under the guidance of senior developers.',
    requirements: [
      '0-1 year of experience or fresh graduate',
      'Basic knowledge of Python programming',
      'Understanding of OOP concepts',
      'Familiarity with Git version control',
      'Eagerness to learn and grow'
    ],
    location: 'Chennai, India',
    type: 'Full-time',
    salary: '₹4-6 LPA',
    experience: 'Fresher - 1 year',
    skills: ['Python', 'Django', 'Flask', 'SQL', 'Git'],
    category: 'Software Development',
    deadline: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000),
    isActive: true
  },
  {
    title: 'DevOps Engineer',
    companyName: 'InfraCloud Technologies',
    description: 'Looking for a DevOps Engineer to manage our cloud infrastructure and CI/CD pipelines. You will be responsible for automating deployment processes and ensuring high availability of our services.',
    requirements: [
      '3-6 years of DevOps experience',
      'Strong knowledge of AWS/Azure/GCP',
      'Experience with Docker and Kubernetes',
      'Proficiency in scripting (Bash, Python)',
      'Knowledge of CI/CD tools (Jenkins, GitLab CI)'
    ],
    location: 'Mumbai, India',
    type: 'Full-time',
    salary: '₹15-22 LPA',
    experience: '3-6 years',
    skills: ['AWS', 'Docker', 'Kubernetes', 'Jenkins', 'Terraform', 'Linux'],
    category: 'DevOps',
    deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
    isActive: true,
    isUrgent: true
  },
  {
    title: 'Mobile App Developer (React Native)',
    companyName: 'MobileFirst Solutions',
    description: 'We are seeking a React Native developer to build cross-platform mobile applications. You will work on creating smooth and performant mobile experiences for both iOS and Android.',
    requirements: [
      '2-4 years of React Native development',
      'Experience with mobile app deployment (App Store & Play Store)',
      'Knowledge of native modules and bridges',
      'Understanding of mobile UI/UX principles',
      'Experience with push notifications and deep linking'
    ],
    location: 'Noida, India',
    type: 'Full-time',
    salary: '₹10-16 LPA',
    experience: '2-4 years',
    skills: ['React Native', 'JavaScript', 'iOS', 'Android', 'Redux', 'Firebase'],
    category: 'Mobile Development',
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    isActive: true
  },
  {
    title: 'Data Scientist',
    companyName: 'AI Innovations Lab',
    description: 'Join our data science team to work on cutting-edge machine learning projects. You will analyze large datasets, build predictive models, and help drive data-driven decision making.',
    requirements: [
      '3-5 years of data science experience',
      'Strong knowledge of Python and ML libraries (scikit-learn, TensorFlow)',
      'Experience with data visualization tools',
      'Understanding of statistical analysis and modeling',
      'Excellent problem-solving and analytical skills'
    ],
    location: 'Bangalore, India',
    type: 'Full-time',
    salary: '₹16-24 LPA',
    experience: '3-5 years',
    skills: ['Python', 'Machine Learning', 'TensorFlow', 'Pandas', 'SQL', 'Statistics'],
    category: 'Data Science',
    deadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
    isActive: true,
    tier: 'promoted'
  },
  {
    title: 'QA Automation Engineer',
    companyName: 'QualityFirst Tech',
    description: 'We need a QA Automation Engineer to design and implement automated testing frameworks. You will ensure the quality and reliability of our software products through comprehensive testing.',
    requirements: [
      '2-4 years of QA automation experience',
      'Strong knowledge of Selenium, Cypress, or similar tools',
      'Experience with API testing (Postman, REST Assured)',
      'Understanding of CI/CD integration',
      'Knowledge of testing best practices'
    ],
    location: 'Gurgaon, India',
    type: 'Full-time',
    salary: '₹9-14 LPA',
    experience: '2-4 years',
    skills: ['Selenium', 'Cypress', 'JavaScript', 'API Testing', 'Jenkins', 'Git'],
    category: 'Quality Assurance',
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    isActive: true
  },
  {
    title: 'UI/UX Designer',
    companyName: 'DesignHub Studios',
    description: 'Looking for a creative UI/UX Designer to craft intuitive and visually appealing user interfaces. You will work closely with developers to bring designs to life.',
    requirements: [
      '2-3 years of UI/UX design experience',
      'Proficiency in Figma, Adobe XD, or Sketch',
      'Strong portfolio showcasing design work',
      'Understanding of user-centered design principles',
      'Knowledge of responsive and mobile-first design'
    ],
    location: 'Remote',
    type: 'Remote',
    salary: '₹7-12 LPA',
    experience: '2-3 years',
    skills: ['Figma', 'Adobe XD', 'UI Design', 'UX Design', 'Prototyping', 'Wireframing'],
    category: 'Design',
    deadline: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000),
    isActive: true
  },
  {
    title: 'Cybersecurity Analyst',
    companyName: 'SecureNet Solutions',
    description: 'We are hiring a Cybersecurity Analyst to protect our systems and data from security threats. You will monitor security incidents, conduct vulnerability assessments, and implement security measures.',
    requirements: [
      '3-5 years of cybersecurity experience',
      'Knowledge of security frameworks (ISO 27001, NIST)',
      'Experience with security tools (SIEM, IDS/IPS)',
      'Understanding of network security and encryption',
      'Relevant certifications (CEH, CISSP) preferred'
    ],
    location: 'Delhi, India',
    type: 'Full-time',
    salary: '₹14-20 LPA',
    experience: '3-5 years',
    skills: ['Cybersecurity', 'Network Security', 'SIEM', 'Penetration Testing', 'Linux', 'Python'],
    category: 'Security',
    deadline: new Date(Date.now() + 22 * 24 * 60 * 60 * 1000),
    isActive: true,
    isUrgent: true
  }
];

async function seedJobs() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Find the recruiter
    const recruiter = await User.findOne({ email: RECRUITER_EMAIL });
    if (!recruiter) {
      console.error('❌ Recruiter not found with email:', RECRUITER_EMAIL);
      console.log('Please make sure the recruiter account exists first.');
      process.exit(1);
    }

    console.log('✅ Found recruiter:', recruiter.name);

    // Delete existing jobs for this recruiter (optional - comment out if you want to keep existing jobs)
    const deletedCount = await Job.deleteMany({ employer: recruiter._id });
    console.log(`🗑️  Deleted ${deletedCount.deletedCount} existing jobs for this recruiter`);

    // Create job posts
    const jobsToCreate = jobPosts.map(job => ({
      ...job,
      employer: recruiter._id,
      companyLogo: '' // You can add company logos later
    }));

    const createdJobs = await Job.insertMany(jobsToCreate);
    console.log(`✅ Successfully created ${createdJobs.length} job posts!`);

    // Display summary
    console.log('\n📋 Job Posts Summary:');
    createdJobs.forEach((job, index) => {
      console.log(`${index + 1}. ${job.title} - ${job.companyName}`);
      console.log(`   💰 ${job.salary} | 📍 ${job.location} | 🎯 ${job.experience}`);
    });

    console.log('\n✨ All done! You can now login and view these job posts.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding jobs:', error);
    process.exit(1);
  }
}

// Run the seed function
seedJobs();
