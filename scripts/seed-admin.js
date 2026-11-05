require('dotenv').config();
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const connectDB = require('../src/config/db');
const Account = require('../src/models/Account');
const { emailAddress, passwordValue } = require('../src/services/authService');

async function main() {
  const email = emailAddress(process.env.ADMIN_EMAIL);
  const password = passwordValue(process.env.ADMIN_PASSWORD);
  await connectDB();
  const existing = await Account.findOne({ email });
  if (existing) {
    if (existing.role !== 'admin') throw new Error('ADMIN_EMAIL already belongs to a shop');
    console.log('Admin already exists');
    return;
  }
  const passwordHash = await bcrypt.hash(password, 12);
  await Account.create({ email, passwordHash, role: 'admin', status: 'approved' });
  console.log('Admin created');
}

main().catch((error) => {
  console.error('Admin seed failed:', error);
  process.exitCode = 1;
}).finally(() => mongoose.disconnect());
