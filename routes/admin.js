const express = require('express');
const router = express.Router();

const Complaint = require('../models/Complaint');
const User = require('../models/User');
const { sendCitizenConfirmationEmail } = require('../utils/emailService');

// All admin routes require adminAuth JWT (citizen JWT must not work)
const adminAuth = require('../middleware/adminAuth');
router.use(adminAuth);

// Helper helper to enforce administrative hierarchy
const requireSuperAdmin = (req, res, next) => {
  if (req.admin && req.admin.role === 'SuperAdmin') {
    return next();
  }
  return res.status(403).json({ message: 'Access denied. SuperAdmin privileges required.' });
};

// GET /api/admin/complaints — Paginated complaints with verification info
router.get('/complaints', async (req, res) => {
  try {
    const { priority, status, verification, page = 1, limit = 20 } = req.query;
    let query = {};

    if (priority && priority !== 'All') query.priority = priority;
    if (status && status !== 'All') query.status = status;
    if (verification && verification !== 'All') query['verification.status'] = verification;

    const sanitizedLimit = Math.min(Number(limit), 100);
    const skip = (Math.max(Number(page), 1) - 1) * sanitizedLimit;

    const [complaints, totalDocuments] = await Promise.all([
      Complaint.find(query)
        .populate('user', 'name email')
        .populate('verification.verifiedBy', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(sanitizedLimit),
      Complaint.countDocuments(query)
    ]);

    res.json({
      complaints,
      pagination: {
        total: totalDocuments,
        page: Number(page),
        pages: Math.ceil(totalDocuments / sanitizedLimit)
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/admin/complaints/:id — Get single complaint
router.get('/complaints/:id', async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('user', 'name email')
      .populate('verification.verifiedBy', 'name');

    if (!complaint) return res.status(404).json({ message: 'Complaint not found.' });

    res.json(complaint);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/admin/flagged — Get complaints flagged as possibly fake
router.get('/flagged', async (req, res) => {
  try {
    const flagged = await Complaint.find({
      $or: [
        { 'verification.flagCount': { $gte: 1 } },
        { 'verification.confidenceScore': { $lt: 60 } },
        { 'verification.status': 'Under Investigation' },
      ],
    })
      .populate('user', 'name email')
      .sort({ 'verification.confidenceScore': 1 });

    res.json(flagged);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/admin/complaints/:id/status — Update complaint status
router.put('/complaints/:id/status', async (req, res) => {
  try {
    const { status, note } = req.body;
    
    // Simple enum validation safeguard
    const allowedStatuses = ['Pending', 'In Progress', 'Resolved', 'Rejected'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status update string' });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found.' });

    complaint.status = status;
    complaint.timeline.push({
      status,
      updatedBy: req.admin.id,
      note: note || `Status updated to ${status}`,
      date: new Date(),
    });

    await complaint.save();
    res.json({ message: 'Status updated.', complaint });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/admin/complaints/:id/verify — Verify or mark as fake
router.put('/complaints/:id/verify', async (req, res) => {
  try {
    const { verificationStatus, fakeReason, adminNotes } = req.body;

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found.' });

    complaint.verification.status = verificationStatus;
    complaint.verification.verifiedBy = req.admin.id;
    complaint.verification.verifiedAt = new Date();
    complaint.verification.adminNotes = adminNotes || '';

    if (verificationStatus === 'Fake') {
      complaint.verification.fakeReason = fakeReason || 'Marked as fake by admin';
      complaint.status = 'Rejected';
      complaint.timeline.push({
        status: 'Rejected',
        updatedBy: req.admin.id,
        note: `Marked as fake: ${fakeReason}`,
        date: new Date(),
      });
    }

    if (verificationStatus === 'Under Investigation') {
      if (complaint.status !== 'In Progress') complaint.status = 'In Progress';
      complaint.timeline.push({
        status: complaint.status,
        updatedBy: req.admin.id,
        note: 'Admin started investigation',
        date: new Date(),
      });
    }

    if (verificationStatus === 'Verified') {
      if (complaint.status !== 'Resolved') complaint.status = 'Resolved';
      complaint.timeline.push({
        status: complaint.status,
        updatedBy: req.admin.id,
        note: 'Complaint verified by admin',
        date: new Date(),
      });
    }

    // CRITICAL: Persist modifications to DB *BEFORE* firing notifications
    await complaint.save();

    // Notify citizen about process update (handled safely in background)
    try {
      const user = await User.findById(complaint.user);
      if (user) {
        sendCitizenConfirmationEmail(complaint, user).catch((e) =>
          console.error('Citizen notification email error:', e.message)
        );
      }
    } catch (e) {
      console.error('Citizen notification setup failed:', e.message);
    }

    res.json({ message: `Complaint marked as ${verificationStatus}.`, complaint });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE /api/admin/complaints/:id — Delete complaint
router.delete('/complaints/:id', async (req, res) => {
  try {
    const complaint = await Complaint.findByIdAndDelete(req.params.id);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found.' });
    res.json({ message: 'Complaint deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/admin/stats — Optimized Dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    // Run counts concurrently via Promise.all to save backend processing time
    const [
      total,
      pending,
      inProgress,
      resolved,
      critical,
      fake,
      verified,
      flagged
    ] = await Promise.all([
      Complaint.countDocuments(),
      Complaint.countDocuments({ status: 'Pending' }),
      Complaint.countDocuments({ status: 'In Progress' }),
      Complaint.countDocuments({ status: 'Resolved' }),
      Complaint.countDocuments({ priority: 'Critical' }),
      Complaint.countDocuments({ 'verification.status': 'Fake' }),
      Complaint.countDocuments({ 'verification.status': 'Verified' }),
      Complaint.countDocuments({ 'verification.flagCount': { $gte: 1 } })
    ]);

    // Category stats
    const byCategory = await Complaint.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const categoryLabels = byCategory.map((x) => x._id);
    const categoryCounts = byCategory.map((x) => x.count);

    // Status stats
    const statuses = ['Pending', 'In Progress', 'Resolved', 'Rejected'];
    const statusAgg = await Complaint.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const statusMap = new Map(statusAgg.map((x) => [x._id, x.count]));
    const statusLabels = statuses;
    const statusCounts = statuses.map((s) => statusMap.get(s) || 0);

    // Avg votes
    const avgVotesAgg = await Complaint.aggregate([
      { $group: { _id: null, avg: { $avg: '$votes' } } },
    ]);
    const avgVotes = Number(avgVotesAgg?.[0]?.avg || 0);

    // Safe response time calculation
    let safeAvgResponseMs = 0;
    try {
      const avgResponseAgg = await Complaint.aggregate([
        {
          $project: {
            createdAt: 1,
            firstNonPendingTimeline: {
              $first: {
                $filter: {
                  input: '$timeline',
                  as: 't',
                  cond: { $ne: ['$$t.status', 'Pending'] },
                },
              },
            },
          },
        },
        {
          $project: {
            responseMs: {
              $cond: [
                { $and: ['$firstNonPendingTimeline.date', '$createdAt'] },
                {
                  $max: [
                    0,
                    { $subtract: ['$firstNonPendingTimeline.date', '$createdAt'] },
                  ],
                },
                null,
              ],
            },
          },
        },
        {
          $group: {
            _id: null,
            avg: { $avg: '$responseMs' },
          },
        },
      ]);

      const avgResponseMs = Number(avgResponseAgg?.[0]?.avg || 0);
      safeAvgResponseMs = Number.isFinite(avgResponseMs) ? avgResponseMs : 0;
    } catch (e) {
      console.warn('avgResponseMs aggregation failed:', e.message);
    }

    const topCategoryCount = categoryCounts?.[0] || 0;

    res.json({
      total,
      pending,
      inProgress,
      resolved,
      critical,
      fake,
      verified,
      flagged,
      byCategory,
      categoryLabels,
      categoryCounts,
      statusLabels,
      statusCounts,
      avgVotes,
      avgResponseMs: safeAvgResponseMs,
      topCategoryCount,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/admin/users — Paginated User profiles
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const sanitizedLimit = Math.min(Number(limit), 100);
    const skip = (Math.max(Number(page), 1) - 1) * sanitizedLimit;

    const [users, totalUsers] = await Promise.all([
      User.find()
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(sanitizedLimit),
      User.countDocuments()
    ]);

    res.json({
      users,
      pagination: {
        total: totalUsers,
        page: Number(page),
        pages: Math.ceil(totalUsers / sanitizedLimit)
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/admin/users/:id/role — Guarded role adjustment 
router.put('/users/:id/role', requireSuperAdmin, async (req, res) => {
  try {
    const { role } = req.body;

    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User target not found.' });

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;