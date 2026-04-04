const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const AIReminder = require('../models/AIReminder');

router.get('/', auth, async (req, res) => {
    try {
        const reminders = await AIReminder.find({ userId: req.user.id })
            .sort({ createdAt: -1 })
            .limit(100)
            .lean();

        res.json(reminders);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

router.patch('/:id/read', auth, async (req, res) => {
    try {
        const reminder = await AIReminder.findById(req.params.id);

        if (!reminder || reminder.userId.toString() !== req.user.id) {
            return res.status(404).json({ msg: 'AI reminder not found' });
        }

        reminder.isRead = true;
        await reminder.save();
        res.json(reminder);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
