const mongoose = require('mongoose');

const AIReminderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    contactId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Contact',
        default: null,
        index: true,
    },
    message: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500,
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium',
    },
    category: {
        type: String,
        enum: ['inactive_contact', 'missed_call_followup', 'regular_followup'],
        default: 'regular_followup',
    },
    uniqueKey: {
        type: String,
        required: true,
        unique: true,
    },
    isRead: {
        type: Boolean,
        default: false,
        index: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: true,
    },
}, {
    timestamps: true,
});

AIReminderSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('AIReminder', AIReminderSchema);
