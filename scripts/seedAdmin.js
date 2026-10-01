const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

dotenvFix();

function dotenvFix() {
  // Avoid crashing if dotenv not installed; server.js already uses it but scripts may not.
  try {
    // eslint-disable-next-line import/no-extraneous-dependencies
    require('dotenv').config();
  } catch (e) {
    // ignore
  }
}

const Admin = require('../models/Admin');

async function main() {
  const { MONGO_URI } = process.env;
  if (!MONGO_URI) {
    console.error('Missing MONGO_URI in environment');
    process.exit(1);
  }

  const DEFAULT_ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'suwaathy@gmail.com';
  const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@123';
  const DEFAULT_ADMIN_NAME = process.env.ADMIN_NAME || 'Admin SUWA';

  await mongoose.connect(MONGO_URI);
  console.log('MongoDB connected');

  const existing = await Admin.findOne({ email: DEFAULT_ADMIN_EMAIL });
  if (existing) {
    console.log('Admin already exists:', existing.email);
    process.exit(0);
  }

  const hashed = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10);

  const admin = new Admin({
    name: DEFAULT_ADMIN_NAME,
    email: DEFAULT_ADMIN_EMAIL,
    password: hashed,
    language: 'en',
    authorityEmail: process.env.ADMIN_AUTHORITY_EMAIL || '',
  });

  await admin.save();

  console.log('Seeded default admin user:', {
    email: DEFAULT_ADMIN_EMAIL,
    password: DEFAULT_ADMIN_PASSWORD,
    name: DEFAULT_ADMIN_NAME,
  });

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

