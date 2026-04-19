const mongoose = require('mongoose');

const VaultItemSchema = new mongoose.Schema({
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String, // 'note' or 'asset'
    enum: ['note', 'asset'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  content: {
    type: String // For notes, or asset URL/path
  },
  size: {
    type: String // For assets (e.g., '2.4MB')
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('VaultItem', VaultItemSchema);
