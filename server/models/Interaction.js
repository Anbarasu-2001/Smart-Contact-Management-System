const mongoose = require('mongoose');

const InteractionSchema = new mongoose.Schema({
    userId: {
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
    type: {
        type: String,
        enum: [
            'call_incoming',
            'call_outgoing',
            'call_missed',
            'message_sent',
            'message_received',
            'follow_up',
            'meeting',
        ],
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true,
    },
    duration: {
        type: Number,
        default: 0,
    },
    notes: {
        type: String,
        default: '',
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
    },
}, {
    timestamps: true,
});

InteractionSchema.index({ userId: 1, contactId: 1, timestamp: -1 });
InteractionSchema.index({ userId: 1, type: 1, timestamp: -1 });

module.exports = mongoose.model('Interaction', InteractionSchema);
