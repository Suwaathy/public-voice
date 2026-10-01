const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Complaint = require('../models/Complaint');

// POST /api/votes/:complaintId — Toggle vote
router.post('/:complaintId', auth, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.complaintId);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found.' });

    const userId = req.user.id;
    const alreadyVoted = complaint.voters.includes(userId);

    if (alreadyVoted) {
      complaint.voters.pull(userId);
      complaint.votes = Math.max(0, complaint.votes - 1);
    } else {
      complaint.voters.push(userId);
      complaint.votes += 1;
    }

    await complaint.save();
    res.json({ votes: complaint.votes, voted: !alreadyVoted });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;