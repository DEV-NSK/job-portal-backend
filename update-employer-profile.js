const mongoose = require('mongoose');
const Employer = require('./models/Employer');
require('dotenv').config();

async function updateEmployerProfile() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const employerId = '69e8d801b838e3dba97c4fd6';

    const updated = await Employer.findOneAndUpdate(
      { userId: employerId },
      {
        description: 'HIREX is a leading technology company specializing in innovative software solutions. We are committed to building cutting-edge products that transform businesses and improve lives. Our team of talented engineers and designers work collaboratively to deliver exceptional results.',
        culture: 'At HIREX, we foster a culture of innovation, collaboration, and continuous learning. We believe in work-life balance, open communication, and empowering our team members to take ownership of their work. We celebrate diversity and create an inclusive environment where everyone can thrive.',
        benefits: '• Competitive salary and equity options\n• Comprehensive health insurance\n• Flexible work hours and remote work options\n• Professional development budget\n• Modern office with free snacks and beverages\n• Team building activities and events\n• Generous vacation policy\n• Latest technology and tools',
        website: 'https://hirex.com'
      },
      { new: true }
    );

    console.log('\n=== UPDATED EMPLOYER PROFILE ===');
    console.log('Company Name:', updated.companyName);
    console.log('Location:', updated.location);
    console.log('Industry:', updated.industry);
    console.log('Founded:', updated.founded);
    console.log('Description:', updated.description.substring(0, 100) + '...');
    console.log('Culture:', updated.culture.substring(0, 100) + '...');
    console.log('Benefits:', updated.benefits.substring(0, 100) + '...');
    console.log('\n✅ Profile updated successfully!');

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

updateEmployerProfile();
