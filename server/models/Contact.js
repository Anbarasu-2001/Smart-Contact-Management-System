const mongoose = require('mongoose');

const ContactSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        trim: true
    },
    purpose: {
        type: String,
        trim: true,
        default: 'Personal'
    },
    priority: {
        type: String,
        enum: ['High', 'Medium', 'Low'],
        default: 'Medium'
    },
    notes: {
        type: String,
        default: ''
    },
    howMet: {
        type: String,
        trim: true,
        default: ''
    },
    category: {
        type: String,
        enum: ['Family', 'Friend', 'Work', 'Business', 'Other'],
        default: 'Other'
    },
    relationshipScore: {
        type: Number,
        default: 0
    },
    lastInteractionDate: {
        type: Date,
        default: null
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update timestamp on save
// Update timestamp on save
ContactSchema.pre('save', function () {
    this.updatedAt = Date.now();
});

module.exports = mongoose.model('Contact', ContactSchema);
