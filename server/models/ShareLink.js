const mongoose = require('mongoose');

const ShareLinkSchema = new mongoose.Schema({
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    contactId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Contact',
        required: true
    },
    contactName: {
        type: String,
        default: 'Unknown Contact'
    },
    receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    token: {
        type: String,
        required: true,
        unique: true
    },
    expiresAt: {
        type: Date,
        required: true,
        index: true,
    },
    isActive: {
        type: Boolean,
        default: true
    },
    viewed: {
        type: Boolean,
        default: false,
        index: true,
    },
    viewedAt: {
        type: Date,
        default: null,
    },
    usedAt: {
        type: Date,
        default: null,
    },
    isOneTime: {
        type: Boolean,
        default: false,
    },
    accessType: {
        type: String,
        enum: ['limited'],
        default: 'limited',
    },
    accessCount: {
        type: Number,
        default: 0
    },
    lastAccessedAt: {
        type: Date,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

ShareLinkSchema.index({ isActive: 1, expiresAt: 1 });
ShareLinkSchema.index({ receiverId: 1, isActive: 1, expiresAt: 1 });

module.exports = mongoose.model('ShareLink', ShareLinkSchema);
