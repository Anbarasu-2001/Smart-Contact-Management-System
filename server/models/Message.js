const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    contactId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Contact',
        required: false,
        index: true,
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false,
        index: true,
    },
    receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false,
        index: true,
    },
    chatRoomId: {
        type: String,
        default: null,
        index: true,
    },
    sender: {
        type: String,
        enum: ['user', 'contact'],
        default: 'user',
    },
    messageType: {
        type: String,
        enum: ['text', 'contact_share', 'image', 'video', 'audio', 'file', 'call'],
        default: 'text',
    },
    text: {
        type: String,
        required: false,
        trim: true,
        maxlength: 2000,
    },

    // File/message type fields
    fileUrl: {
        type: String,
        default: null,
    },
    fileName: {
        type: String,
        default: null,
    },
    fileSize: {
        type: Number,
        default: null,
    },
    imageUrl: {
        type: String,
        default: null,
    },
    videoUrl: {
        type: String,
        default: null,
    },
    audioUrl: {
        type: String,
        default: null,
    },
    thumbnailUrl: {
        type: String,
        default: null,
    },
    sharedContactId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Contact',
        default: null,
    },
    shareToken: {
        type: String,
        default: null,
    },
    shareLink: {
        type: String,
        default: null,
    },
    sharedContactName: {
        type: String,
        default: null,
    },
    shareExpiresAt: {
        type: Date,
        default: null,
    },
    sharePayload: {
        type: {
            type: String,
            enum: ['contact_share'],
            default: null,
        },
        contactId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Contact',
            default: null,
        },
        token: {
            type: String,
            default: null,
        },
        expiresAt: {
            type: Date,
            default: null,
        },
    },
    clientMessageId: {
        type: String,
        default: null,
    },
    read: {
        type: Boolean,
        default: false,
    },
    status: {
        type: String,
        enum: ['sent', 'delivered', 'seen'],
        default: 'sent',
        index: true,
    },
    deliveredAt: {
        type: Date,
        default: null,
    },
    seenAt: {
        type: Date,
        default: null,
    },
    isTemporary: {
        type: Boolean,
        default: false,
        index: true,
    },
    expiresAt: {
        type: Date,
        default: null,
    },
}, {
    timestamps: true,
});

MessageSchema.index({ ownerId: 1, contactId: 1, createdAt: -1 });
MessageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 });
MessageSchema.index({ chatRoomId: 1, createdAt: -1 });
MessageSchema.index(
    { expiresAt: 1 },
    { expireAfterSeconds: 0, partialFilterExpression: { expiresAt: { $type: 'date' } } }
);
MessageSchema.index(
    { ownerId: 1, clientMessageId: 1 },
    { unique: true, partialFilterExpression: { clientMessageId: { $type: 'string' } } }
);

module.exports = mongoose.model('Message', MessageSchema);
