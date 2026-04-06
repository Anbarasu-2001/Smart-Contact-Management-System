const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Message = require('../models/Message');
const Contact = require('../models/Contact');
const User = require('../models/User');

const getPairRoom = (a, b) => `chat:${[String(a), String(b)].sort().join('_')}`;

router.get('/conversations', auth, async (req, res) => {
    try {
        const currentUserId = String(req.user.id);

        const rows = await Message.find({
            $or: [
                { senderId: currentUserId },
                { receiverId: currentUserId },
            ],
        })
            .populate('senderId', 'name email')
            .populate('receiverId', 'name email')
            .sort({ createdAt: -1 })
            .lean();

        const conversationsMap = new Map();

        for (const msg of rows) {
            const sender = msg.senderId;
            const receiver = msg.receiverId;
            if (!sender || !receiver) continue;

            const isMe = String(sender._id) === currentUserId;
            const otherUser = isMe ? receiver : sender;
            const otherId = String(otherUser._id);

            if (!conversationsMap.has(otherId)) {
                conversationsMap.set(otherId, {
                    userId: otherId,
                    name: otherUser.name || otherUser.email || 'Loading...',
                    email: otherUser.email,
                    lastMessage: msg.text || '',
                    updatedAt: msg.createdAt,
                    unreadCount: 0
                });
            }
            
            const conv = conversationsMap.get(otherId);
            if (msg.status !== 'seen' && String(msg.receiverId._id) === currentUserId) {
                conv.unreadCount += 1;
            }
        }

        const output = Array.from(conversationsMap.values());
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
            .populate('senderId', 'name email')
            .populate('receiverId', 'name email')
            .sort({ createdAt: 1 });

        res.json(messages);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

router.get('/:userId', auth, async (req, res) => {
    try {
        const myId = req.user.id;
        const targetId = req.params.userId;

        const limit = Math.min(200, Math.max(20, Number(req.query.limit) || 50));

        const messages = await Message.find({
            $or: [
                { senderId: myId, receiverId: targetId },
                { senderId: targetId, receiverId: myId }
            ],
        })
            .sort({ createdAt: -1 })
            .limit(limit)
            .populate('senderId', 'name email')
            .populate('receiverId', 'name email');
            
        messages.reverse(); // sort by createdAt ascending after limit

        res.json(messages);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

router.post('/', auth, async (req, res) => {
    const { senderId, receiverId, text } = req.body;

    if (!senderId || !receiverId || !text) {
        return res.status(400).json({ msg: 'senderId, receiverId, and text are required' });
    }

    try {
        const message = new Message({
            senderId,
            receiverId,
            text,
            ownerId: req.user.id, // Keeping ownerId in case Mongoose schema requires it
        });

        await message.save();
        res.status(201).json(message);
    } catch (err) {
        console.error('Error saving message:', err.message);
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
