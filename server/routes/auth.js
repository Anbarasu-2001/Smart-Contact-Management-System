const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Contact = require('../models/Contact');
const { formatPhone } = require('../utils/phone');

const PREDEFINED_CONTACTS = [
    { name: 'Aarav', phone: '+919811112222', relationship: 'Friend' },
    { name: 'Priya', phone: '+919822223333', relationship: 'Family' },
    { name: 'Rahul', phone: '+919833334444', relationship: 'Work' },
    { name: 'Sneha', phone: '+919844445555', relationship: 'Friend' },
    { name: 'Karthik', phone: '+919855556666', relationship: 'Work' },
    { name: 'Meena', phone: '+919866667777', relationship: 'Family' },
    { name: 'Arjun', phone: '+919877778888', relationship: 'Friend' },
    { name: 'Divya', phone: '+919888889999', relationship: 'Work' },
    { name: 'Vikram', phone: '+919899990000', relationship: 'Friend' },
    { name: 'Ananya', phone: '+919900001111', relationship: 'Family' },
];

const mapRelationshipToType = (relationship) => {
    const value = String(relationship || '').toLowerCase();
    if (value === 'family') return 'family';
    if (value === 'work') return 'colleague';
    return 'friend';
};

async function seedContacts(userId) {
    if (!userId) return;

    const existingByOwner = await Contact.find({ ownerId: userId }).select('phone');
    const existingLegacy = await Contact.find({ userId, ownerId: { $exists: false } }).select('phone');
    const existingPhones = new Set(
        [...existingByOwner, ...existingLegacy]
            .map((c) => formatPhone(c.phone))
            .filter(Boolean)
    );

    const contactsToInsert = PREDEFINED_CONTACTS.filter((c) => !existingPhones.has(formatPhone(c.phone)));
    if (contactsToInsert.length === 0) return;

    const contacts = contactsToInsert.map((c) => ({
        name: c.name,
        phone: formatPhone(c.phone),
        relationshipType: mapRelationshipToType(c.relationship),
        purpose: c.relationship,
        category: c.relationship,
        notes: `Auto-seeded ${c.relationship} contact`,
        userId: null,
        linkedUserId: null,
        ownerId: userId,
    }));

    await Contact.insertMany(contacts);
    console.log(`Contacts auto-added: ${contacts.length}`);
}

// @route   POST api/auth/register
// @desc    Register user
// @access  Public
router.post('/register', async (req, res) => {
    const { name, email, password, phone } = req.body;
    const normalizedEmail = (email || '').toLowerCase().trim();
    const normalizedPhone = formatPhone(phone) || null;

    if (!name || !normalizedPhone || !normalizedEmail || !password) {
        return res.status(400).json({ msg: 'Please provide name, phone, email, and password' });
    }

    if (password.length < 6) {
        return res.status(400).json({ msg: 'Password must be at least 6 characters' });
    }

    try {
        let user = await User.findOne({ $or: [ { email: normalizedEmail }, { phone: normalizedPhone } ] });
        if (user) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user = new User({
            name,
            email: normalizedEmail,
            phone: normalizedPhone,
            password: hashedPassword
        });

        await user.save();

        // Auto-link contacts with same phone
        await Contact.updateMany(
            { phone: normalizedPhone },
            { userId: user._id, linkedUserId: user._id }
        );

        await seedContacts(user.id);

        const payload = {
            user: {
                id: user.id
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: 360000 },
            (err, token) => {
                if (err) throw err;
                res.json({
                    token,
                    user: {
                        _id: user._id,
                        name: user.name,
                        email: user.email,
                        phone: user.phone
                    },
                    msg: 'Registration successful'
                });
            }
        );
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ msg: 'User already exists' });
        }
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
    console.log('Login request received:', { email: req.body.email, hasPassword: !!req.body.password });

    const { email, password } = req.body;
    const normalizedEmail = (email || '').toLowerCase().trim();

    // Validate input
    if (!normalizedEmail || !password) {
        console.log('Login failed: Missing email or password');
        return res.status(400).json({ msg: 'Please provide both email and password' });
    }

    try {
        let user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            console.log('Login failed: User not found for email:', normalizedEmail);
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            console.log('Login failed: Password mismatch for email:', normalizedEmail);
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        const payload = {
            user: {
                id: user.id
            }
        };

        await seedContacts(user.id);

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: 360000 },
            (err, token) => {
                if (err) throw err;
                console.log('Login successful for email:', normalizedEmail);
                res.json({
                    token,
                    user: {
                        _id: user._id,
                        name: user.name,
                        email: user.email,
                        phone: user.phone || null,
                    },
                });
            }
        );
    } catch (err) {
        console.error('Login error:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/auth/user
// @desc    Get logged in user
// @access  Private
router.get('/user', auth, async (req, res) => {
    try {
        await seedContacts(req.user.id);
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
