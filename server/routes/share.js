const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const crypto = require('crypto');
const ShareLink = require('../models/ShareLink');
const Contact = require('../models/Contact');
const Interaction = require('../models/Interaction');

// @route   POST api/share/:contactId
// @desc    Generate a share link
// @access  Private
router.post('/:contactId', auth, async (req, res) => {
    const { loopTime } = req.body; // expiry time in minutes? Or absolute date?
    // Requirement says: "User selects contact, Sets expiry time"
    const { expiryInMinutes } = req.body;

    try {
        const contact = await Contact.findById(req.params.contactId);
        if (!contact) return res.status(404).json({ msg: 'Contact not found' });
        if (contact.userId.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        const token = crypto.randomBytes(20).toString('hex');
        const expiryTime = new Date(Date.now() + expiryInMinutes * 60 * 1000);

        const newShareLink = new ShareLink({
            contactId: req.params.contactId,
            token,
            expiryTime
        });

        await newShareLink.save();

        // Return the link (or just token)
        // Frontend will construct the full URL
        res.json({ token, expiryTime });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/share/:token
// @desc    Get contact details via token
// @access  Public
router.get('/:token', async (req, res) => {
    try {
        const shareLink = await ShareLink.findOne({ token: req.params.token });

        if (!shareLink) {
            return res.status(404).json({ msg: 'Invalid or expired link' });
        }

        if (shareLink.expiryTime < Date.now() || !shareLink.isActive) {
            return res.status(401).json({ msg: 'Link has expired' });
        }

        const contact = await Contact.findById(shareLink.contactId).select('-userId -notes');
        // Hide sensitive info like notes or user ID?
        // Requirement: "Show restricted contact view"
        // Let's hide 'notes' and 'userId'.

        if (!contact) {
            return res.status(404).json({ msg: 'Contact not found' });
        }

        // Mask phone number for privacy (show first 3 and last 3 digits)
        let maskedPhone = contact.phone;
        if (contact.phone && contact.phone.length > 6) {
            const firstThree = contact.phone.substring(0, 3);
            const lastThree = contact.phone.substring(contact.phone.length - 3);
            const middleLength = contact.phone.length - 6;
            maskedPhone = firstThree + '*'.repeat(middleLength) + lastThree;
        }

        // Update access tracking
        shareLink.accessCount += 1;
        shareLink.lastAccessedAt = new Date();
        await shareLink.save();

        // Return contact with masked phone
        const contactData = contact.toObject();
        contactData.phone = maskedPhone;

        res.json(contactData);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/share/:token
// @desc    Manually revoke a share link
// @access  Private
router.delete('/:token', auth, async (req, res) => {
    try {
        const shareLink = await ShareLink.findOne({ token: req.params.token });

        if (!shareLink) {
            return res.status(404).json({ msg: 'Share link not found' });
        }

        // Verify user owns the contact
        const contact = await Contact.findById(shareLink.contactId);
        if (!contact || contact.userId.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        // Revoke the link
        shareLink.isActive = false;
        await shareLink.save();

        res.json({ msg: 'Share link revoked successfully' });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
