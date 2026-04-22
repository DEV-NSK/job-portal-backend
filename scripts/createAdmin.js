/**
 * Run this script once to create an admin user:
 * node scripts/createAdmin.js
 */
require('dotenv').config()
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const User = require('../models/User')

async function createAdmin() {
  await mongoose.connect(process.env.MONGO_URI)
  const exists = await User.findOne({ email: 'admin@jobportal.com' })
  if (exists) { console.log('Admin already exists'); process.exit(0) }
  const hashed = await bcrypt.hash('admin123', 10)
  await User.create({ name: 'Admin', email: 'admin@jobportal.com', password: hashed, role: 'admin' })
  console.log('Admin created: admin@jobportal.com / admin123')
  process.exit(0)
}

createAdmin().catch(err => { console.error(err); process.exit(1) })
