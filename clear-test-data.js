const mongoose = require('mongoose');
const Employer = require('./models/Employer');
require('dotenv').config();

async function clearTestData() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const employerId = '69e8d801b838e3dba97c4fd6';

    // Clear the test data we added, keep only what employer filled
    const updated = await Employer.findOneAndUpdate(
      { userId: employerId },
      {
        description: '',
        culture: '',
        benefits: '',
        website: ''
      },
      { new: true }
    );

    console.log('\n=== CLEARED TEST DATA ===');
    console.log('Company Name:', updated.companyName);
    console.log('Location:', updated.location);
    console.log('Industry:', updated.industry);
    console.log('Founded:', updated.founded);
    console.log('Company Size:', updated.companySize);
    console.log('Description:', updated.description || '(empty)');
    console.log('Culture:', updated.culture || '(empty)');
    console.log('Benefits:', updated.benefits || '(empty)');
    console.log('Website:', updated.website || '(empty)');
    console.log('\n✅ Test data cleared! Now showing only real employer data.');

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

clearTestData();
