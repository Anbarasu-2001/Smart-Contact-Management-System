const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Interaction = require('../models/Interaction');
const Contact = require('../models/Contact');
const User = require('../models/User');

const LEGACY_TYPE_MAP = {
    call: 'call_outgoing',
    message: 'message_sent',
    meeting: 'meeting',
};

const normalizeType = (type) => {
    if (!type) return null;
    return LEGACY_TYPE_MAP[type] || type;
};

const CALL_TYPE_MAP = {
    call_incoming: 'incoming',
    call_outgoing: 'outgoing',
    call_missed: 'missed',
};

// @route   GET api/interactions/calls
// @desc    Get normalized call history list
// @access  Private
router.get('/calls', auth, async (req, res) => {
    try {
        const callInteractions = await Interaction.find({
            userId: req.user.id,
            type: { $in: ['call_incoming', 'call_outgoing', 'call_missed'] },
        })
            .sort({ timestamp: -1 })
            .select('_id contactId type timestamp duration')
            .lean();

        // Keep only final call events for stable, non-duplicated history rows.
        const finalized = callInteractions.filter((item) => {
            if (item.type === 'call_missed') return true;
            return Number(item.duration || 0) > 0;
        });

        if (!finalized.length) {
            return res.json([]);
        }

        const rawIds = [...new Set(finalized.map((item) => String(item.contactId || '')).filter(Boolean))];
        const objectIdLike = rawIds.filter((id) => /^[a-fA-F0-9]{24}$/.test(id));

        const [ownedContacts, users] = await Promise.all([
            Contact.find({ userId: req.user.id, _id: { $in: objectIdLike } }).select('_id name').lean(),
            User.find({ _id: { $in: objectIdLike } }).select('_id name').lean(),
        ]);

        const contactNameMap = new Map(ownedContacts.map((item) => [String(item._id), item.name]));
        const userNameMap = new Map(users.map((item) => [String(item._id), item.name]));

        const result = finalized
            .map((item) => {
                const contactId = String(item.contactId || '');
                return {
                    id: String(item._id),
                    contactId,
                    name: contactNameMap.get(contactId) || userNameMap.get(contactId) || 'Unknown',
                    type: CALL_TYPE_MAP[item.type] || 'missed',
                    time: item.timestamp,
                    duration: Number(item.duration) || 0,
                };
            })
            .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

        res.json(result);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/interactions
// @desc    Log a new interaction
// @access  Private
router.post('/', auth, async (req, res) => {
    const { contactId, type, timestamp, duration, notes, metadata } = req.body;
    const normalizedType = normalizeType(type);

    if (!contactId || !normalizedType) {
        return res.status(400).json({ msg: 'contactId and type are required' });
    }

    try {
        const contact = await Contact.findById(contactId);

        const newInteraction = new Interaction({
            userId: req.user.id,
            contactId,
            type: normalizedType,
            timestamp: timestamp || new Date(),
            duration: Number(duration) || 0,
            notes,
            metadata: metadata || {},
        });

        const interaction = await newInteraction.save();

        // If a formal contact exists, update relationship score and last interaction date
        if (contact && String(contact.ownerId || "") === req.user.id) {
            let scoreIncrement = 0;
            if (interaction.type === 'meeting') scoreIncrement = 10;
            else if (interaction.type.startsWith('call_')) scoreIncrement = 5;
            else if (interaction.type.startsWith('message_')) scoreIncrement = 2;
            else if (interaction.type === 'follow_up') scoreIncrement = 3;

            contact.relationshipScore += scoreIncrement;
            contact.lastInteractionDate = interaction.timestamp || new Date();

            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            contact.isActive = contact.lastInteractionDate > thirtyDaysAgo;

            await contact.save();
        }

        res.json(interaction);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/interactions/:contactId
// @desc    Get interactions for a contact
// @access  Private
router.get('/:contactId', auth, async (req, res) => {
    try {
        const contact = await Contact.findById(req.params.contactId);

        if (!contact) return res.status(404).json({ msg: 'Contact not found' });
        if (String(contact.ownerId || "") !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        const interactions = await Interaction.find({
            userId: req.user.id,
            contactId: req.params.contactId,
        }).sort({ timestamp: -1 });
        res.json(interactions);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
