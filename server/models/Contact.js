const mongoose = require('mongoose');

const ContactSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    linkedUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },
    email: {
        type: String,
        trim: true,
        default: ''
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
    relationshipType: {
        type: String,
        enum: ['friend', 'family', 'colleague', 'client', 'other'],
        default: 'other'
    },
    meetContext: {
        type: String,
        enum: ['school', 'college', 'work', 'event', 'other'],
        default: 'other'
    },
    priorityLevel: {
        type: String,
        enum: ['high', 'medium', 'low'],
        default: 'medium'
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

ContactSchema.index({ ownerId: 1, phone: 1 }, { unique: true });
ContactSchema.index({ userId: 1 });
ContactSchema.index({ linkedUserId: 1 });

// Update timestamp on save
// Update timestamp on save
ContactSchema.pre('save', function () {
    this.updatedAt = Date.now();
});

module.exports = mongoose.model('Contact', ContactSchema);
