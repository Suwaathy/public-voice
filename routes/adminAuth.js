const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

const router = express.Router();

// Register admin
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, language } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required.' });
    }

    const exists = await Admin.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already registered.' });

    const hashed = await bcrypt.hash(password, 10);
    const admin = new Admin({
      name,
      email,
      password: hashed,
      language: language || 'en',
    });
    await admin.save();

    const token = jwt.sign(
      { id: admin._id },
      process.env.ADMIN_JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        language: admin.language,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Login admin
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(400).json({ message: 'Invalid credentials.' });

    const match = await bcrypt.compare(password, admin.password);
    if (!match) return res.status(400).json({ message: 'Invalid credentials.' });

    const token = jwt.sign(
      { id: admin._id },
      process.env.ADMIN_JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        language: admin.language,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Logout (client-side token removal)
router.post('/logout', async (req, res) => {
  // Stateless JWT: no server-side revoke list implemented.
  return res.json({ message: 'Logged out.' });
});

// Get current admin profile
router.put('/profile', require('../middleware/adminAuth'), async (req, res) => {
  try {
    const { name, language, authorityEmail } = req.body;
    const updated = await Admin.findByIdAndUpdate(
      req.admin.id,
      {
        ...(name ? { name } : {}),
        ...(language ? { language } : {}),
        ...(authorityEmail !== undefined ? { authorityEmail } : {}),
      },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: 'Admin not found.' });

    return res.json({
      admin: {
        id: updated._id,
        name: updated.name,
        email: updated.email,
        language: updated.language,
        authorityEmail: updated.authorityEmail,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.put('/change-password', require('../middleware/adminAuth'), async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'currentPassword and newPassword are required.' });
    }

    const admin = await Admin.findById(req.admin.id);
    if (!admin) return res.status(404).json({ message: 'Admin not found.' });

    const match = await bcrypt.compare(currentPassword, admin.password);
    if (!match) return res.status(400).json({ message: 'Current password is incorrect.' });

    admin.password = await bcrypt.hash(newPassword, 10);
    await admin.save();

    return res.json({ message: 'Password changed successfully.' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.get('/me', require('../middleware/adminAuth'), async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id).select('-password');
    if (!admin) return res.status(404).json({ message: 'Admin not found.' });

    return res.json({ admin });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;

