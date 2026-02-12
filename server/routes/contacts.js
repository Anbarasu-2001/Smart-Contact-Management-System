const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Contact = require('../models/Contact');
const { check, validationResult } = require('express-validator'); // Optional but good practice

// @route   POST api/contacts
// @desc    Add new contact
// @access  Private
router.post(
    '/',
    auth,
    [
        check('name', 'Name is required').not().isEmpty(),
        check('phone', 'Phone number is required').not().isEmpty()
    ],
    async (req, res) => {
        // Validation Errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, phone, purpose, priority, notes } = req.body;

        try {
            // 1. Check for Duplicate Contact (Same User + Same Phone)
            let existingContact = await Contact.findOne({ userId: req.user.id, phone });

            if (existingContact) {
                return res.status(400).json({ msg: 'Contact with this phone number already exists' });
            }

            // 2. Create New Contact
            const newContact = new Contact({
                userId: req.user.id, // Extracted from JWT
                name,
                phone,
                purpose,
                priority,
                notes,
                relationshipScore: 0 // Default
            });

            // 3. Save to Database
            const contact = await newContact.save();

            // 4. Return the saved contact
            res.json(contact);

        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    }
);

// @route   GET api/contacts
// @desc    Get all users contacts
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const contacts = await Contact.find({ userId: req.user.id }).sort({ createdAt: -1 });
        res.json(contacts);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/contacts/:id
// @desc    Update contact
// @access  Private
router.put('/:id', auth, async (req, res) => {
    const { name, phone, purpose, priority, notes } = req.body;

    // Build contact object
    const contactFields = {};
    if (name) contactFields.name = name;
    if (phone) contactFields.phone = phone;
    if (purpose) contactFields.purpose = purpose;
    if (priority) contactFields.priority = priority;
    if (notes) contactFields.notes = notes;

    try {
        let contact = await Contact.findById(req.params.id);

        if (!contact) return res.status(404).json({ msg: 'Contact not found' });

        // Make sure user owns contact
        if (contact.userId.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        contact = await Contact.findByIdAndUpdate(
            req.params.id,
            { $set: contactFields },
            { new: true }
        );

        res.json(contact);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/contacts/:id
// @desc    Delete contact
// @access  Private
router.delete('/:id', auth, async (req, res) => {
    try {
        let contact = await Contact.findById(req.params.id);

        if (!contact) return res.status(404).json({ msg: 'Contact not found' });

        // Make sure user owns contact
        if (contact.userId.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        await Contact.findByIdAndDelete(req.params.id);

        res.json({ msg: 'Contact removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
