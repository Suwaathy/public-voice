console.log('🚀 COMPLAINTS ROUTE FILE LOADED');
const express = require('express');
const router = express.Router();
router.get('/test', (req, res) => {
  console.log('🔥 TEST ROUTE HIT');
  res.json({ success: true });
});
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');
const Complaint = require('../models/Complaint');
const { sendAuthorityEmail, sendCitizenConfirmationEmail } = require('../utils/emailService');
const User = require('../models/User');

// ── MULTER SETUP ──────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.webm';
    cb(null, `${Date.now()}-${file.fieldname}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  console.log('📁 FILE TYPE:', file.mimetype);

  if (
    file.mimetype.startsWith('audio/') ||
    file.mimetype.startsWith('image/')
  ) {
    cb(null, true);
  } else {
    console.log('❌ FILE REJECTED');
    cb(new Error('Only audio and image files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 25 * 1024 * 1024 },
});

router.use((err, req, res, next) => {
  console.error('🚨 MULTER ERROR:', err.message);
  res.status(500).json({ message: err.message });
});

// ── AUTO PRIORITY ─────────────────────────────────
const getAutoPriority = (text) => {
  if (!text) return 'Low';
  const t = text.toLowerCase();
  if (t.includes('danger') || t.includes('urgent') || t.includes('accident') ||
      t.includes('emergency') || t.includes('fire') || t.includes('flood') ||
      t.includes('அபாயம்') || t.includes('அவசரம்') || t.includes('හදිසි')) return 'Critical';
  if (t.includes('broken') || t.includes('damage') || t.includes('leak') ||
      t.includes('burst') || t.includes('உடைந்த') || t.includes('කැඩුණු')) return 'High';
  if (t.includes('problem') || t.includes('issue') || t.includes('bad') ||
      t.includes('பிரச்சனை') || t.includes('ගැටලුව')) return 'Medium';
  return 'Low';
};

// ── FAKE DETECTION ────────────────────────────────
const calculateVerificationScore = (data) => {
  let score = 100;
  const flags = {
    noImage: false,
    veryShortDescription: false,
    possibleDuplicate: false,
    suspiciousKeywords: false
  };
  const text = (data.description || data.transcription || '').toLowerCase();

  if (!data.imageUrl) { flags.noImage = true; score -= 10; }
  if (text.length < 20) { flags.veryShortDescription = true; score -= 25; }

  const suspiciousWords = ['test', 'fake', 'hello', 'xyz', 'abc', 'asdf', '123'];
  if (suspiciousWords.some(w => text.includes(w))) {
    flags.suspiciousKeywords = true;
    score -= 30;
  }
  if (data.imageUrl) score += 10;
  if (text.length > 100) score += 10;
  if (text.length > 200) score += 5;

  return {
    score: Math.max(0, Math.min(100, score)),
    flags,
    flagCount: Object.values(flags).filter(Boolean).length
  };
};


// ── SUBMIT COMPLAINT ──────────────────────────────
// Allow up to 10 images per complaint
// - frontend should send field name "images" (array)
// - for backward compatibility we also accept single "image"
const uploadMultiple = upload.fields([
  { name: 'images', maxCount: 10 },
  { name: 'image', maxCount: 1 },
]);

router.post('/', auth, uploadMultiple, async (req, res) => {
  try {
    console.log('📩 New complaint:', req.body);

    const { category, location, description, transcription, inputMethod, language } = req.body;

    if (!category || !location) {
      return res.status(400).json({ message: 'Category and location are required.' });
    }

    const images = [];
    if (Array.isArray(req.files?.images) && req.files.images.length) {
      req.files.images.forEach((f) => images.push(`/uploads/${f.filename}`));
    }
    if (req.file && images.length === 0) {
      // backward-compatible single file upload
      images.push(`/uploads/${req.file.filename}`);
    }

    const imageUrl = images[0] || null; // keep current schema compatibility
    const imageUrls = images; // store all images


    const finalText = description || transcription || '';
    const priority = getAutoPriority(finalText);

    const { score, flags, flagCount } = calculateVerificationScore({ description, transcription, imageUrl });

    const complaint = new Complaint({
      user: req.user.id,
      category,
      location,
      description: description || '',
      transcription: transcription || '',
      inputMethod: inputMethod || 'text',
      imageUrl,
      imageUrls,
      language: language || 'en',

      priority,
      status: 'Pending',
      votes: 0,
      voters: [],
      verification: {
        status: 'Unverified',
        confidenceScore: score,
        flags,
        flagCount,
      },
      });

    await complaint.save();
    console.log('✅ Complaint saved:', complaint._id);

    // Send emails in background
    const user = await User.findById(req.user.id);
    if (user) {
      sendAuthorityEmail(complaint, user).catch(err =>
        console.error('Authority email error:', err.message)
      );
      sendCitizenConfirmationEmail(complaint, user).catch(err =>
        console.error('Citizen email error:', err.message)
      );
    }

    res.status(201).json({ message: 'Complaint submitted successfully.', complaint });

  } catch (err) {
    console.error('❌ Error saving complaint:', err.message);
    res.status(500).json({ message: 'Failed to save complaint.', error: err.message });
  }
});

// ── PUBLIC FEED ───────────────────────────────────
router.get('/public', async (req, res) => {
  try {
    const { category, priority, sort } = req.query;
    let query = { 'verification.status': { $ne: 'Fake' } };
    if (category && category !== 'All') query.category = category;
    if (priority && priority !== 'All') query.priority = priority;
    let sortOption = { createdAt: -1 };
    if (sort === 'votes') sortOption = { votes: -1 };
    if (sort === 'critical') sortOption = { priority: 1 };
    const complaints = await Complaint.find(query)
      .populate('user', 'name')
      .sort(sortOption)
      .lean();
    res.json(complaints);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ── MY COMPLAINTS ─────────────────────────────────
router.get('/my', auth, async (req, res) => {
  try {
    const complaints = await Complaint.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .lean();
    res.json(complaints);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ── SINGLE COMPLAINT ──────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('user', 'name email');
    if (!complaint) return res.status(404).json({ message: 'Not found.' });
    res.json(complaint);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;