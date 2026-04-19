const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Reminder = require('../models/Reminder');

router.get('/', auth, async (req, res) => {
    try {
        const reminders = await Reminder.find({ userId: req.user.id, isActive: true })
            .sort({ remindAt: 1 })
            .lean();
        res.json(reminders);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

router.post('/', auth, async (req, res) => {
    const { message, contactId, remindAt, repeat } = req.body;

    if (!message || !remindAt) {
        return res.status(400).json({ msg: 'message and remindAt are required' });
    }

    try {
        const reminder = await Reminder.create({
            userId: req.user.id,
            message: message.trim(),
            contactId: contactId || null,
            remindAt,
            repeat: repeat || 'none',
        });

        res.status(201).json(reminder);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

router.patch('/:id/toggle', auth, async (req, res) => {
    try {
        const reminder = await Reminder.findById(req.params.id);

        if (!reminder || String(reminder.userId || "") !== req.user.id) {
            return res.status(404).json({ msg: 'Reminder not found' });
        }

        reminder.isActive = !reminder.isActive;
        await reminder.save();

        res.json(reminder);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

router.delete('/:id', auth, async (req, res) => {
    try {
        const reminder = await Reminder.findById(req.params.id);

        if (!reminder || String(reminder.userId || "") !== req.user.id) {
            return res.status(404).json({ msg: 'Reminder not found' });
        }

        await Reminder.findByIdAndDelete(req.params.id);

        res.json({ ok: true });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
