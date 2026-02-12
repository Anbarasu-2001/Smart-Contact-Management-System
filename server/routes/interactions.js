const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Interaction = require('../models/Interaction');
const Contact = require('../models/Contact');

// @route   POST api/interactions
// @desc    Log a new interaction
// @access  Private
router.post('/', auth, async (req, res) => {
    const { contactId, type, date, notes } = req.body;

    try {
        const contact = await Contact.findById(contactId);

        if (!contact) {
            return res.status(404).json({ msg: 'Contact not found' });
        }

        // Verify user owns contact
        if (contact.userId.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        const newInteraction = new Interaction({
            contactId,
            type,
            date,
            notes
        });

        const interaction = await newInteraction.save();

        // Update Relationship Score
        let scoreIncrement = 0;
        if (type === 'meeting') scoreIncrement = 10;
        else if (type === 'call') scoreIncrement = 5;
        else if (type === 'message') scoreIncrement = 2;

        contact.relationshipScore += scoreIncrement;

        // Update last interaction date
        contact.lastInteractionDate = date || new Date();

        // Update isActive status (active if interaction within last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        contact.isActive = contact.lastInteractionDate > thirtyDaysAgo;

        await contact.save();

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
        if (contact.userId.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        const interactions = await Interaction.find({ contactId: req.params.contactId }).sort({ date: -1 });
        res.json(interactions);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
