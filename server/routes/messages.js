const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Message = require('../models/Message');
const Contact = require('../models/Contact');
const User = require('../models/User');

const getPairRoom = (a, b) => [String(a), String(b)].sort().join('_');

router.get('/summaries', auth, async (req, res) => {
    try {
        const currentUserId = String(req.user.id);

        const rows = await Message.find({
            $or: [
                { senderId: currentUserId },
                { receiverId: currentUserId },
            ],
        })
            .sort({ createdAt: -1 })
            .select('senderId receiverId text createdAt status')
            .lean();

        const summaryByUser = new Map();

        for (const row of rows) {
            const senderId = row.senderId ? String(row.senderId) : '';
            const receiverId = row.receiverId ? String(row.receiverId) : '';
            const otherUserId = senderId === currentUserId ? receiverId : senderId;

            if (!otherUserId || otherUserId === currentUserId) continue;
            if (summaryByUser.has(otherUserId)) continue;

            summaryByUser.set(otherUserId, {
                userId: otherUserId,
                lastMessage: row.text || '',
                updatedAt: row.createdAt,
            });
        }

        const summaries = Array.from(summaryByUser.values());
        if (!summaries.length) {
            return res.json([]);
        }

        const ids = summaries.map((s) => s.userId);
        const users = await User.find({ _id: { $in: ids } }).select('_id name').lean();
        const userMap = new Map(users.map((u) => [String(u._id), u]));

        const unreadAgg = await Message.aggregate([
            {
                $match: {
                    receiverId: req.user.id,
                    status: { $ne: 'seen' },
                },
            },
            {
                $group: {
                    _id: '$senderId',
                    count: { $sum: 1 },
                },
            },
        ]);
        const unreadMap = new Map(unreadAgg.map((u) => [String(u._id), u.count]));

        const output = summaries
            .map((s) => ({
                userId: s.userId,
                name: userMap.get(String(s.userId))?.name || 'Unknown user',
                lastMessage: s.lastMessage,
                updatedAt: s.updatedAt,
                unreadCount: unreadMap.get(String(s.userId)) || 0,
            }))
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

        res.json(output);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

router.get('/thread/:otherUserId', auth, async (req, res) => {
    try {
        const myId = req.user.id;
        const otherId = req.params.otherUserId;
        const limit = Math.min(200, Math.max(20, Number(req.query.limit) || 50));

        const messages = await Message.find({
            $or: [
                { senderId: myId, receiverId: otherId },
                { senderId: otherId, receiverId: myId },
                { chatRoomId: getPairRoom(myId, otherId) },
            ],
        })
            .sort({ createdAt: -1 })
            .limit(limit)
            .sort({ createdAt: 1 });

        res.json(messages);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

router.get('/:contactId', auth, async (req, res) => {
    try {
        const contact = await Contact.findById(req.params.contactId);
        if (!contact || contact.userId.toString() !== req.user.id) {
            return res.status(404).json({ msg: 'Contact not found' });
        }
        const limit = Math.min(200, Math.max(20, Number(req.query.limit) || 50));

        const messages = await Message.find({
            ownerId: req.user.id,
            contactId: req.params.contactId,
        })
            .sort({ createdAt: -1 })
            .limit(limit)
            .sort({ createdAt: 1 });

        res.json(messages);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

router.post('/', auth, async (req, res) => {
    const {
        contactId,
        text,
        clientMessageId,
        expiresInMinutes = null,
        messageType = 'text',
        sharedContactId = null,
        shareToken = null,
        shareLink = null,
        sharedContactName = null,
        shareExpiresAt = null,
        sharePayload = null,
    } = req.body;

    const normalizedMessageType = messageType === 'contact_share' ? 'contact_share' : 'text';
    const safeText = (text || '').trim();
    const temporaryMinutes = Number(expiresInMinutes);
    const isTemporary = Number.isFinite(temporaryMinutes) && temporaryMinutes > 0;
    const expiresAt = isTemporary ? new Date(Date.now() + Math.floor(temporaryMinutes) * 60 * 1000) : null;

    if (!contactId) {
        return res.status(400).json({ msg: 'contactId is required' });
    }

    if (normalizedMessageType === 'text' && !safeText) {
        return res.status(400).json({ msg: 'text is required for text messages' });
    }

    if (normalizedMessageType === 'contact_share' && !shareToken) {
        return res.status(400).json({ msg: 'shareToken is required for contact_share messages' });
    }

    try {
        const contact = await Contact.findById(contactId);
        if (!contact || contact.userId.toString() !== req.user.id) {
            return res.status(404).json({ msg: 'Contact not found' });
        }

        if (clientMessageId) {
            const existing = await Message.findOne({ ownerId: req.user.id, clientMessageId });
            if (existing) {
                return res.json(existing);
            }
        }

        const message = await Message.create({
            ownerId: req.user.id,
            contactId,
            senderId: req.user.id,
            messageType: normalizedMessageType,
            text: normalizedMessageType === 'contact_share'
                ? (safeText || `Shared contact: ${sharedContactName || 'Contact'}`)
                : safeText,
            sender: 'user',
            sharedContactId,
            shareToken,
            shareLink,
            sharedContactName,
            shareExpiresAt,
            sharePayload: normalizedMessageType === 'contact_share'
                ? {
                    type: 'contact_share',
                    contactId: sharePayload?.contactId || sharedContactId || null,
                    token: sharePayload?.token || shareToken || null,
                    expiresAt: sharePayload?.expiresAt || shareExpiresAt || null,
                }
                : null,
            clientMessageId: clientMessageId || null,
            isTemporary,
            expiresAt,
        });

        res.status(201).json(message);
    } catch (err) {
        console.error(err.message);
        if (err.code === 11000) {
            const existing = await Message.findOne({ ownerId: req.user.id, clientMessageId });
            if (existing) {
                return res.json(existing);
            }
        }
        res.status(500).send('Server Error');
    }
});

router.patch('/read/:contactId', auth, async (req, res) => {
    try {
        const now = new Date();
        await Message.updateMany(
            { ownerId: req.user.id, contactId: req.params.contactId, sender: 'contact', read: false },
            { $set: { read: true, status: 'seen', seenAt: now } }
        );
        res.json({ ok: true });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
