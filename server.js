const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config();
console.log('OPENAI KEY EXISTS:', !!process.env.OPENAI_API_KEY);
console.log('OPENAI KEY PREFIX:', process.env.OPENAI_API_KEY?.substring(0, 10));

const app = express();
app.use((req, res, next) => {
  console.log('🌐 REQUEST:', req.method, req.url);
  next();
});

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api/auth', require('./routes/auth'));
const complaintsRoute = require('./routes/complaints');
console.log('USING ROUTE FILE:', require.resolve('./routes/complaints'));

app.use('/api/complaints', complaintsRoute);
app.use('/api/votes', require('./routes/votes'));

// Separate admin auth system
app.use('/api/admin', require('./routes/adminAuth'));

// Admin complaint/user management endpoints
app.use('/api/admin', require('./routes/admin'));

// ---- Startup validation + MongoDB connection ----
const requiredEnv = [
  'MONGO_URI',
  'PORT',
  'OPENAI_API_KEY',
  'ADMIN_JWT_SECRET',
  'JWT_SECRET'
];
const missingEnv = requiredEnv.filter((k) => !process.env[k]);
if (missingEnv.length) {
  console.error('❌ Missing required env vars:', missingEnv.join(', '));
  process.exit(1);
}

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');

    const server = app.listen(process.env.PORT, () => {
      console.log(`✅ Server running on port ${process.env.PORT}`);
    });

    // Avoid silent crashes
    process.on('unhandledRejection', (reason) => {
      console.error('❌ UnhandledRejection:', reason);
    });

    process.on('uncaughtException', (err) => {
      console.error('❌ UncaughtException:', err);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB error:', err);
    process.exit(1);
  });

// ---- Express error handler (prevents crashes per-request) ----
app.use((err, req, res, next) => {
  console.error('Request error:', err);
  if (res.headersSent) return next(err);
  res.status(500).json({ message: 'Server error', error: err.message });
});


