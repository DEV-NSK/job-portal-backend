const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function findMissingAvatar() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    const users = await User.find({ 
      avatar: { $regex: '1776931831122' } 
    }).select('_id name email avatar role');
    
    console.log('Users with missing avatar:', users);
    
    if (users.length > 0) {
      console.log('\nClearing invalid avatar paths...');
      for (const user of users) {
        user.avatar = '';
        await user.save();
        console.log(`Cleared avatar for ${user.name}`);
      }
    }
    
    await mongoose.disconnect();
    console.log('\n✅ Done!');
  } catch (error) {
    console.error('Error:', error);
  }
}

findMissingAvatar();
