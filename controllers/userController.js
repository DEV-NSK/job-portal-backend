const User = require('../models/User');
const Employer = require('../models/Employer');

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id || req.user._id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    const employer = user.role === 'employer' ? await Employer.findOne({ userId: user._id }) : null;
    res.json({ user, employer });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const updates = { ...req.body };
    
    // Handle file upload
    if (req.file) {
      const field = req.file.fieldname === 'resume' ? 'resume' : 'avatar';
      updates[field] = `/uploads/${req.file.filename}`;
    }
    
    // Parse JSON fields
    if (updates.experience && typeof updates.experience === 'string') {
      try {
        updates.experience = JSON.parse(updates.experience);
      } catch (e) {
        updates.experience = [];
      }
    }
    
    if (updates.education && typeof updates.education === 'string') {
      try {
        updates.education = JSON.parse(updates.education);
      } catch (e) {
        updates.education = [];
      }
    }
    
    // Handle skills array
    if (updates.skills && typeof updates.skills === 'string') {
      updates.skills = updates.skills.split(',').map(s => s.trim()).filter(Boolean);
    }
    
    // Separate employer-specific fields from user fields
    const employerFields = [
      'companyName', 'companyLogo', 'industry', 'companySize', 'website', 'description', 
      'culture', 'benefits', 'founded'
    ];
    
    const employerData = {};
    const userData = {};
    
    // Split the updates into user and employer data
    Object.keys(updates).forEach(key => {
      if (employerFields.includes(key)) {
        employerData[key] = updates[key];
      } else {
        userData[key] = updates[key];
      }
    });
    
    // Remove sensitive and immutable fields from user data
    delete userData.password;
    delete userData.role;
    delete userData._id;
    delete userData.userId;
    delete userData.__v;
    delete userData.createdAt;
    delete userData.updatedAt;
    
    // Update user data
    const user = await User.findByIdAndUpdate(req.user._id, userData, { new: true }).select('-password');
    
    // Handle employer data if user is employer and has employer fields
    if (req.user.role === 'employer' && Object.keys(employerData).length > 0) {
      // Add location to employer data if it exists in user data
      if (userData.location) {
        employerData.location = userData.location;
      }
      
      // Sync avatar to companyLogo for employers
      if (userData.avatar) {
        employerData.companyLogo = userData.avatar;
      }
      
      try {
        await Employer.findOneAndUpdate(
          { userId: req.user._id },
          employerData,
          { upsert: true, new: true }
        );
      } catch (employerError) {
        // Don't fail the entire request if employer update fails
      }
    } else if (req.user.role === 'employer' && userData.avatar) {
      // If only avatar was updated (no other employer fields), still sync it to companyLogo
      try {
        await Employer.findOneAndUpdate(
          { userId: req.user._id },
          { companyLogo: userData.avatar },
          { upsert: true, new: true }
        );
      } catch (employerError) {
        // Don't fail the entire request if employer update fails
      }
    }
    
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getProfile, updateProfile };
