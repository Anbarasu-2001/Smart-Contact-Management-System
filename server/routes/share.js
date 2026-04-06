const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const crypto = require('crypto');
const ShareLink = require('../models/ShareLink');
const Contact = require('../models/Contact');

const getShareStatus = (share) => {
    const now = new Date();
    if (!share) return 'expired';
    if (!share.isActive || (share.expiresAt && share.expiresAt <= now)) return 'expired';
    if (share.viewed) return 'viewed';
    return 'active';
};

const toPositiveMinutes = (value) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
        return null;
    }
    return Math.floor(parsed);
};

const emitShareUpdated = (req, share, statusOverride = null) => {
    const io = req.app.get('io');
    if (!io || !share) return;

    const payload = {
        token: share.token,
        isActive: share.isActive,
        status: statusOverride || getShareStatus(share),
        expiresAt: share.expiresAt,
        accessType: share.accessType || 'limited',
        isOneTime: Boolean(share.isOneTime),
    };

    io.to(`user:${String(share.receiverId)}`).emit('shareUpdated', payload);
    io.to(`user:${String(share.senderId)}`).emit('shareUpdated', payload);
};

const createShare = async (req, res, contactIdFromPath = null) => {
    const contactId = req.body.contactId || contactIdFromPath;
    const receiverId = req.body.receiverId;
    const expiresInMinutes = toPositiveMinutes(req.body.expiresInMinutes);
    const isOneTime = Boolean(req.body.isOneTime);

    if (!contactId || !receiverId || !expiresInMinutes) {
        return res.status(400).json({ msg: 'contactId, receiverId and expiresInMinutes are required' });
    }

    try {
        const contact = await Contact.findById(contactId);
        if (!contact) {
            return res.status(404).json({ msg: 'Contact not found' });
        }

        if (contact.userId.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        if (String(receiverId) === String(req.user.id)) {
            return res.status(400).json({ msg: 'receiverId must be different from sender' });
        }

        const token = crypto.randomBytes(24).toString('hex');
        const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

        const share = await ShareLink.create({
            senderId: req.user.id,
            contactId,
            receiverId,
            token,
            expiresAt,
            isOneTime,
            accessType: 'limited',
            isActive: true,
        });

        res.status(201).json({
            token: share.token,
            expiresAt: share.expiresAt,
            isActive: share.isActive,
            receiverId: share.receiverId,
            accessType: share.accessType,
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @route   POST api/share/create
// @desc    Generate a secure share link
// @access  Private
router.post('/create', auth, async (req, res) => {
    const { contactId, receiverId } = req.body;

    if (!contactId || !receiverId) {
        return res.status(400).json({ msg: 'Missing data' });
    }

    try {
        const token = crypto.randomBytes(24).toString('hex');
        const share = await ShareLink.create({
            senderId: req.user.id,
            contactId,
            receiverId,
            token,
            expiresAt: new Date(Date.now() + 60 * 60 * 1000), // Default 1 hour
            isActive: true,
        });

        res.json({
            link: `http://localhost:3000/share/${share.token}`,
            token: share.token
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Backward-compatible endpoint currently used in existing UI
router.post('/:contactId', auth, async (req, res) => createShare(req, res, req.params.contactId));

// @route   GET api/share/mine
// @desc    Get sender share history with statuses
// @access  Private
router.get('/mine', auth, async (req, res) => {
    try {
        const links = await ShareLink.find({ senderId: req.user.id })
            .sort({ createdAt: -1 })
            .populate('contactId', 'name phone email')
            .populate('receiverId', 'name email')
            .lean();

        const response = links.map((share) => {
            const status = getShareStatus(share);
            return {
                _id: share._id,
                token: share.token,
                shareLink: `/share/${share.token}`,
                senderId: share.senderId,
                receiverId: share.receiverId?._id || share.receiverId,
                receiverName: share.receiverId?.name || share.receiverId?.email || 'Unknown User',
                contactId: share.contactId?._id || share.contactId,
                contactName: share.contactId?.name || 'Unknown Contact',
                createdAt: share.createdAt,
                expiresAt: share.expiresAt,
                isActive: share.isActive,
                viewed: Boolean(share.viewed),
                viewedAt: share.viewedAt || null,
                status,
                isOneTime: Boolean(share.isOneTime),
                accessType: share.accessType || 'limited',
            };
        });

        res.json(response);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/share/:token
// @desc    Get limited contact access details via token
// @access  Private (receiver only)
router.get('/:token', auth, async (req, res) => {
    try {
        const share = await ShareLink.findOne({ token: req.params.token });

        if (!share) {
            return res.status(404).json({ msg: 'Invalid link' });
        }

        if (String(share.receiverId) !== String(req.user.id)) {
            return res.status(403).json({ msg: 'Not authorized for this share token' });
        }

        const now = new Date();
        if (!share.isActive || share.expiresAt <= now) {
            if (share.isActive && share.expiresAt <= now) {
                share.isActive = false;
                await share.save();
            }
            return res.status(410).json({ msg: 'Link expired' });
        }

        const contact = await Contact.findById(share.contactId).select('name');

        if (!contact) {
            return res.status(404).json({ msg: 'Contact not found' });
        }

        res.json({
            contactId: String(share.contactId),
            name: contact.name,
            expiresAt: share.expiresAt,
            isOneTime: share.isOneTime,
            isActive: share.isActive,
            accessType: share.accessType || 'limited',
            status: getShareStatus(share),
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/share/:token/access
// @desc    Validate token and consume action-based access
// @access  Private (receiver only)
router.post('/:token/access', auth, async (req, res) => {
    try {
        const action = String(req.body?.action || '').toLowerCase();
        if (!['call', 'chat'].includes(action)) {
            return res.status(400).json({ msg: 'action must be call or chat' });
        }

        const share = await ShareLink.findOne({ token: req.params.token });
        if (!share) {
            return res.status(404).json({ msg: 'Invalid link' });
        }

        if (String(share.receiverId) !== String(req.user.id)) {
            return res.status(403).json({ msg: 'Not authorized for this share token' });
        }

        const now = new Date();
        if (!share.isActive || share.expiresAt <= now) {
            if (share.isActive && share.expiresAt <= now) {
                share.isActive = false;
                await share.save();
            }
            return res.status(410).json({ msg: 'Link expired' });
        }

        const contact = await Contact.findById(share.contactId).select('name');
        if (!contact) {
            return res.status(404).json({ msg: 'Contact not found' });
        }

        share.accessCount += 1;
        share.lastAccessedAt = now;
        share.viewed = true;
        share.viewedAt = now;
        if (share.isOneTime) {
            share.isActive = false;
            share.usedAt = now;
        }
        await share.save();

        res.json({
            action,
            contactId: String(share.contactId),
            name: contact.name,
            expiresAt: share.expiresAt,
            isOneTime: share.isOneTime,
            isActive: share.isActive,
            accessType: share.accessType || 'limited',
            status: getShareStatus(share),
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PATCH api/share/:token
// @desc    Update share link settings
// @access  Private (sender only)
router.patch('/:token', auth, async (req, res) => {
    try {
        const share = await ShareLink.findOne({ token: req.params.token });
        if (!share) {
            return res.status(404).json({ msg: 'Share link not found' });
        }

        if (String(share.senderId) !== String(req.user.id)) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        const hasOneTime = Object.prototype.hasOwnProperty.call(req.body || {}, 'isOneTime');
        if (!hasOneTime) {
            return res.status(400).json({ msg: 'No editable fields provided' });
        }

        share.isOneTime = Boolean(req.body.isOneTime);
        await share.save();
        emitShareUpdated(req, share);

        res.json({
            token: share.token,
            isOneTime: share.isOneTime,
            expiresAt: share.expiresAt,
            isActive: share.isActive,
            accessType: share.accessType || 'limited',
            status: getShareStatus(share),
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PATCH api/share/:token/extend
// @desc    Extend share link expiry by minutes
// @access  Private (sender only)
router.patch('/:token/extend', auth, async (req, res) => {
    try {
        const minutes = toPositiveMinutes(req.body?.minutes);
        if (!minutes) {
            return res.status(400).json({ msg: 'minutes must be a positive number' });
        }

        const share = await ShareLink.findOne({ token: req.params.token });
        if (!share) {
            return res.status(404).json({ msg: 'Share link not found' });
        }

        if (String(share.senderId) !== String(req.user.id)) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        if (!share.isActive) {
            return res.status(400).json({ msg: 'Cannot extend inactive share link' });
        }

        const base = share.expiresAt && share.expiresAt > new Date() ? share.expiresAt : new Date();
        share.expiresAt = new Date(base.getTime() + minutes * 60 * 1000);
        await share.save();

        emitShareUpdated(req, share);

        res.json({
            token: share.token,
            expiresAt: share.expiresAt,
            isActive: share.isActive,
            accessType: share.accessType || 'limited',
            status: getShareStatus(share),
        });
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
        const share = await ShareLink.findOne({ token: req.params.token });

        if (!share) {
            return res.status(404).json({ msg: 'Share link not found' });
        }

        const contact = await Contact.findById(share.contactId);
        if (!contact || contact.userId.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        share.isActive = false;
        await share.save();

        emitShareUpdated(req, share, 'expired');

        res.json({ msg: 'Share link revoked successfully' });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
