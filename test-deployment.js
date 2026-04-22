// Test script to verify deployment configuration
const mongoose = require('mongoose');
require('dotenv').config();

const testDeployment = async () => {
  console.log('🔍 Testing Deployment Configuration...\n');
  
  // Check environment variables
  console.log('📋 Environment Variables:');
  console.log('- NODE_ENV:', process.env.NODE_ENV || 'not set');
  console.log('- MONGO_URI:', process.env.MONGO_URI ? '✅ Set' : '❌ Missing');
  console.log('- JWT_SECRET:', process.env.JWT_SECRET ? '✅ Set' : '❌ Missing');
  
  if (!process.env.MONGO_URI) {
    console.log('\n❌ MONGO_URI is required for deployment');
    return;
  }
  
  if (!process.env.JWT_SECRET) {
    console.log('\n❌ JWT_SECRET is required for deployment');
    return;
  }
  
  // Test MongoDB connection
  console.log('\n🔗 Testing MongoDB Connection...');
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ MongoDB connection successful');
    await mongoose.disconnect();
  } catch (error) {
    console.log('❌ MongoDB connection failed:', error.message);
    return;
  }
  
  console.log('\n✅ All deployment checks passed!');
  console.log('\n📝 Next steps:');
  console.log('1. Commit and push your changes to GitHub');
  console.log('2. Set environment variables in Vercel dashboard');
  console.log('3. Deploy to Vercel');
};

testDeployment().catch(console.error);