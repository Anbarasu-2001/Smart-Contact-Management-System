const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Contact = require('../models/Contact');
const User = require('../models/User');
const { formatPhone } = require('../utils/phone');
const { check, validationResult } = require('express-validator'); // Optional but good practice

const REQUESTED_CONTACTS = [
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

const normalizePriority = (priority) => {
    if (!priority) return undefined;
    const normalized = String(priority).toLowerCase();
    if (normalized === 'high') return 'High';
    if (normalized === 'medium') return 'Medium';
    if (normalized === 'low') return 'Low';
    return undefined;
};

const normalizeRelationshipType = (value) => {
    if (!value) return 'other';
    const normalized = String(value).toLowerCase();
    if (['friend', 'family', 'colleague', 'client', 'other'].includes(normalized)) return normalized;
    if (normalized === 'work') return 'colleague';
    return 'other';
};

const normalizeMeetContext = (value) => {
    if (!value) return 'other';
    const normalized = String(value).toLowerCase();
    if (['school', 'college', 'work', 'event', 'other'].includes(normalized)) return normalized;
    if (normalized === 'office') return 'work';
    return 'other';
};

const normalizePriorityLevel = (value) => {
    if (!value) return 'medium';
    const normalized = String(value).toLowerCase();
    if (['high', 'medium', 'low'].includes(normalized)) return normalized;
    return 'medium';
};

const normalizeText = (value) => String(value || '').trim();

const toIdString = (value) => {
    if (!value) return null;
    if (typeof value === 'string') return value;
    if (typeof value === 'object') {
        if (value._id) return String(value._id);
        if (value.id) return String(value.id);
    }
    return String(value);
};

async function findLinkedUserByPhoneOrEmail({ phone, email, excludeUserId }) {
    const normalizedEmail = normalizeText(email).toLowerCase();
    const normalizedPhone = formatPhone(phone);
    const exclude = excludeUserId ? { _id: { $ne: excludeUserId } } : {};

    if (normalizedEmail) {
        const byEmail = await User.findOne({
            ...exclude,
            email: normalizedEmail,
        }).select('_id');
        if (byEmail) return byEmail;
    }

    if (normalizedPhone) {
        const byPhone = await User.findOne({
            ...exclude,
            phone: normalizedPhone,
        }).select('_id');
        if (byPhone) return byPhone;
    }

    return null;
}

const buildOwnerQuery = (userId) => ({ ownerId: userId });

const isOwnedByUser = (contact, userId) => {
    if (!contact) return false;
    const owner = contact.ownerId || contact.userId;
    return owner && String(owner) === String(userId);
};

const mapRelationshipTypeToDisplay = (value) => {
    const normalized = String(value || '').toLowerCase();
    if (normalized === 'family') return 'Family';
    if (normalized === 'colleague' || normalized === 'client') return 'Work';
    return 'Friend';
};

async function ensureRequestedContactsForUser(userId) {
    if (!userId) return;

    const existing = await Contact.find({ ownerId: userId }).select('phone userId ownerId');
    const existingPhones = new Set(existing.map((item) => normalizeText(item.phone)).filter(Boolean));

    const toInsert = REQUESTED_CONTACTS.filter((item) => !existingPhones.has(normalizeText(item.phone)));
    if (toInsert.length === 0) return;

    const contacts = toInsert.map((item) => ({
        name: item.name,
        phone: formatPhone(item.phone),
        relationshipType: normalizeRelationshipType(item.relationship),
        category: item.relationship,
        purpose: item.relationship,
        notes: '',
        userId: null,
        linkedUserId: null,
        ownerId: userId,
    }));

    await Contact.insertMany(contacts);
}

const serializeContact = (raw) => {
    if (!raw) return null;
    const linkedUserId = toIdString(raw.linkedUserId);
    const ownerId = toIdString(raw.ownerId) || toIdString(raw.userId) || '';
    const mappedUserId = toIdString(raw.userId) || linkedUserId;

    return {
        _id: String(raw._id),
        name: raw.name,
        phone: raw.phone,
        email: raw.email || '',
        relationship: mapRelationshipTypeToDisplay(raw.relationshipType),
        relationshipType: raw.relationshipType || 'other',
        notes: raw.notes || '',
        ownerId,
        linkedUserId,
        userId: mappedUserId,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
    };
};

async function backfillLinkedUsersForOwner(ownerId) {
    if (!ownerId) return;

    const contacts = await Contact.find({ ownerId }).select('_id phone email linkedUserId userId ownerId');

    for (const contact of contacts) {
        const normalizedPhone = formatPhone(contact.phone);
        const phoneWasUpdated = Boolean(normalizedPhone) && normalizedPhone !== contact.phone;
        if (normalizedPhone && normalizedPhone !== contact.phone) {
            contact.phone = normalizedPhone;
        }

        const currentLinked = contact.linkedUserId || null;
        const currentUserId = contact.userId || null;
        const linkedId = currentLinked || currentUserId;

        if (linkedId && String(linkedId) !== String(ownerId)) {
            if (!currentLinked || String(currentLinked) !== String(linkedId) || phoneWasUpdated) {
                contact.linkedUserId = linkedId;
                await contact.save();
            }
            continue;
        }

        const matchedUser = await findLinkedUserByPhoneOrEmail({
            phone: contact.phone,
            email: contact.email,
            excludeUserId: ownerId,
        });

        const nextLinkedId = matchedUser ? matchedUser._id : null;
        const changed = String(contact.linkedUserId || '') !== String(nextLinkedId || '')
            || String(contact.userId || '') !== String(nextLinkedId || '');

        if (!changed) continue;

        contact.linkedUserId = nextLinkedId;
        contact.userId = nextLinkedId;
        await contact.save();
    }
}

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

        const {
            name,
            phone,
            email,
            relationshipType,
            relationship,
            meetContext,
            priorityLevel,
            purpose,
            howMet,
            category,
            priority,
            notes,
        } = req.body;
        const trimmedName = normalizeText(name);
        const formattedPhone = formatPhone(phone);
        const trimmedEmail = normalizeText(email);
        const trimmedNotes = normalizeText(notes);
        const normalizedRelationshipType = normalizeRelationshipType(relationshipType || relationship || category || purpose);
        const normalizedMeetContext = normalizeMeetContext(meetContext || howMet);
        const normalizedPriorityLevel = normalizePriorityLevel(priorityLevel || priority);
        const normalizedPriority = normalizePriority(priority || priorityLevel);

        if (!trimmedName || !formattedPhone) {
            return res.status(400).json({ msg: 'Name and phone number are required' });
        }

        try {
            // 1. Check for Duplicate Contact (same owner + same phone)
            const existingContact = await Contact.findOne({
                ...buildOwnerQuery(req.user.id),
                phone: formattedPhone,
            });

            if (existingContact) {
                return res.status(400).json({ msg: 'Contact with this phone number already exists' });
            }

            // 2. Link to existing user by phone
            const existingUser = await findLinkedUserByPhoneOrEmail({
                phone: formattedPhone,
                email: trimmedEmail,
                excludeUserId: req.user.id,
            });

            // 3. Create New Contact
            const newContact = new Contact({
                userId: existingUser ? existingUser._id : null,
                ownerId: req.user.id,
                linkedUserId: existingUser ? existingUser._id : null,
                name: trimmedName,
                phone: formattedPhone,
                email: trimmedEmail.toLowerCase(),
                relationshipType: normalizedRelationshipType,
                meetContext: normalizedMeetContext,
                priorityLevel: normalizedPriorityLevel,
                purpose: purpose || normalizedRelationshipType,
                category: category || mapRelationshipTypeToDisplay(normalizedRelationshipType),
                howMet: howMet || normalizedMeetContext,
                priority: normalizedPriority,
                notes: trimmedNotes,
                relationshipScore: 0 // Default
            });

            // 4. Save to Database
            const contact = await newContact.save();

            // 5. Return the saved contact
            res.json(serializeContact(contact));

        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    });

// @route   GET api/contacts
// @desc    Get all users contacts
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        await ensureRequestedContactsForUser(req.user.id);

        await backfillLinkedUsersForOwner(req.user.id);

        // Exclude self-contact by phone
        const contacts = await Contact.find({
            ownerId: req.user.id,
            phone: { $ne: req.user.phone }
        })
            .select('_id name phone email relationshipType notes ownerId userId linkedUserId createdAt updatedAt')
            .populate('userId', 'name phone')
            .sort({ name: 1, createdAt: -1 });
        console.log('contacts fetched for user:', req.user.id, 'count:', contacts.length);
        res.json(contacts.map(serializeContact));
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/contacts/:id
// @desc    Get a single contact by id
// @access  Private
router.get('/:id', auth, async (req, res) => {
    try {
        const contact = await Contact.findById(req.params.id);

        if (!contact) {
            return res.status(404).json({ msg: 'Contact not found' });
        }

        if (!isOwnedByUser(contact, req.user.id)) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        res.json(serializeContact(contact));
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/contacts/:id
// @desc    Update contact
// @access  Private
router.put('/:id', auth, async (req, res) => {
    const {
        name,
        phone,
        email,
        relationshipType,
        relationship,
        meetContext,
        priorityLevel,
        purpose,
        howMet,
        category,
        priority,
        notes,
    } = req.body;
    const normalizedPriority = normalizePriority(priority || priorityLevel);
    const normalizedRelationshipType = (relationshipType || relationship)
        ? normalizeRelationshipType(relationshipType || relationship)
        : undefined;
    const normalizedMeetContext = meetContext ? normalizeMeetContext(meetContext) : undefined;
    const normalizedPriorityLevel = priorityLevel ? normalizePriorityLevel(priorityLevel) : undefined;

    // Build contact object
    const contactFields = {};
    if (name !== undefined) contactFields.name = normalizeText(name);
    if (phone !== undefined) contactFields.phone = formatPhone(phone);
    if (email !== undefined) contactFields.email = normalizeText(email).toLowerCase();
    if (purpose) contactFields.purpose = purpose;
    if (howMet) contactFields.howMet = howMet;
    if (category) {
        const normalizedCategory = String(category).trim();
        if (["Family", "Friend", "Work", "Business", "Other"].includes(normalizedCategory)) {
            contactFields.category = normalizedCategory;
        } else {
            contactFields.category = mapRelationshipTypeToDisplay(normalizeRelationshipType(normalizedCategory));
        }
    }
    if (normalizedMeetContext) contactFields.meetContext = normalizedMeetContext;
    if (normalizedPriorityLevel) contactFields.priorityLevel = normalizedPriorityLevel;
    if (normalizedPriority) contactFields.priority = normalizedPriority;
    if (notes !== undefined) contactFields.notes = normalizeText(notes);

    try {
        let contact = await Contact.findById(req.params.id);

        if (!contact) return res.status(404).json({ msg: 'Contact not found' });

        // Make sure user owns contact
        if (!isOwnedByUser(contact, req.user.id)) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        if (contactFields.phone) {
            const duplicate = await Contact.findOne({
                ...buildOwnerQuery(req.user.id),
                phone: contactFields.phone,
                _id: { $ne: req.params.id },
            });
            if (duplicate) {
                return res.status(400).json({ msg: 'Contact with this phone number already exists' });
            }
        }

        if (email !== undefined || phone !== undefined) {
            const nextEmail = contactFields.email !== undefined ? contactFields.email : contact.email;
            const nextPhone = contactFields.phone !== undefined ? contactFields.phone : contact.phone;
            const linkedUser = await findLinkedUserByPhoneOrEmail({
                phone: nextPhone,
                email: nextEmail,
                excludeUserId: req.user.id,
            });
            contactFields.linkedUserId = linkedUser ? linkedUser._id : null;
            contactFields.userId = linkedUser ? linkedUser._id : null;
        }

        contact = await Contact.findByIdAndUpdate(
            req.params.id,
            { $set: contactFields },
            { new: true }
        );

        res.json(serializeContact(contact));
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
        if (!isOwnedByUser(contact, req.user.id)) {
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
