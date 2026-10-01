const mongoose = require('mongoose');

const VoteSchema = new mongoose.Schema({
  complaint: { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Vote', VoteSchema);