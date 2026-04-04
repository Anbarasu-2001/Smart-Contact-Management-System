const mongoose = require('mongoose');

const ReminderSchema = new mongoose.Schema({
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
    },
    message: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500,
    },
    remindAt: {
        type: Date,
        required: true,
        index: true,
    },
    repeat: {
        type: String,
        enum: ['none', 'daily', 'weekly', 'monthly'],
        default: 'none',
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true,
    },
    lastNotifiedAt: {
        type: Date,
        default: null,
    },
}, {
    timestamps: true,
});

ReminderSchema.index({ userId: 1, remindAt: 1, isActive: 1 });

module.exports = mongoose.model('Reminder', ReminderSchema);
