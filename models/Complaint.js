const mongoose = require('mongoose');

const ComplaintSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category: {
    type: String,
    enum: ['Roads', 'Water', 'Safety', 'Environment', 'Corruption', 'Other'],
    required: true,
  },
  location: { type: String, required: true },
  description: { type: String, default: '' },
  transcription: { type: String, default: '' },
  inputMethod: { type: String, enum: ['text', 'voice', 'image'], default: 'text' },
  imageUrl: { type: String, default: null },
  imageUrls: { type: [String], default: [] },
  language: { type: String, enum: ['en', 'ta', 'si'], default: 'en' },

  // AI Priority
  priority: {
    type: String,
    enum: ['Critical', 'High', 'Medium', 'Low'],
    default: 'Low',
  },

  // Status
  status: {
    type: String,
    enum: ['Pending', 'Under Review', 'In Progress', 'Resolved', 'Rejected'],
    default: 'Pending',
  },

  // Votes
  votes: { type: Number, default: 0 },
  voters: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  // ── VERIFICATION SYSTEM ──────────────────────────
  verification: {
    status: {
      type: String,
      enum: ['Unverified', 'Verified', 'Fake', 'Under Investigation'],
      default: 'Unverified',
    },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    verifiedAt: { type: Date, default: null },
    fakeReason: { type: String, default: '' },
    confidenceScore: { type: Number, default: 0 }, // 0-100
    flags: {
      noImage: { type: Boolean, default: false },
      veryShortDescription: { type: Boolean, default: false },
      possibleDuplicate: { type: Boolean, default: false },
      suspiciousKeywords: { type: Boolean, default: false },
    },
    flagCount: { type: Number, default: 0 },
    adminNotes: { type: String, default: '' },
  },

  // Status timeline
  timeline: [{
    status: String,
    verificationStatus: String,
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    note: String,
    date: { type: Date, default: Date.now },
  }],

  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Complaint', ComplaintSchema);