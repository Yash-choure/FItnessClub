require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/user');
const Plan = require('../models/Plan');

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri || uri.includes('<db_username>')) {
    console.error('Set a real MONGODB_URI in .env (replace username and password).');
    process.exit(1);
  }

  const options = { dbName: process.env.MONGODB_DB || 'fitnessclub', family: 4, serverSelectionTimeoutMS: 20000 };
  try {
    await mongoose.connect(uri, options);
  } catch (err) {
    const fallback = process.env.MONGODB_STANDARD_URI;
    if (!fallback) throw err;
    console.warn('SRV DNS failed, using standard Atlas host list...');
    await mongoose.connect(fallback, options);
  }
  console.log('Connected to MongoDB');

  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'Admin@123';
  const email = process.env.ADMIN_EMAIL || 'admin@fitnessclub.local';

  let admin = await User.findOne({ username });
  if (!admin) {
    admin = await User.create({
      username,
      email,
      password: await bcrypt.hash(password, 10),
      firstName: 'Gym',
      lastName: 'Admin',
      role: 'admin',
    });
    console.log(`Created admin user: ${username} / ${password}`);
  } else {
    admin.role = 'admin';
    await admin.save();
    console.log(`Admin user already exists: ${username}`);
  }

  const defaults = [
    { name: 'Monthly Basic', durationDays: 30, price: 999, features: ['Gym floor', 'Locker'] },
    { name: 'Quarterly Silver', durationDays: 90, price: 2499, features: ['Gym floor', 'Group classes'] },
    { name: 'Annual Gold', durationDays: 365, price: 7999, features: ['All access', 'Sauna', 'Trainer consult'] },
  ];

  for (const plan of defaults) {
    await Plan.updateOne({ name: plan.name }, { $setOnInsert: { ...plan, isActive: true } }, { upsert: true });
  }
  console.log('Default plans ready.');

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
