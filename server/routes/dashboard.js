const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Contact = require('../models/Contact');
const Interaction = require('../models/Interaction');

// @route   GET api/dashboard
// @desc    Get dashboard stats with enhanced insights
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const now = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        // Get all contacts for user
        const contacts = await Contact.find({ userId });

        // Use the isActive field we're now maintaining
        const activeContacts = contacts.filter(c => c.isActive);
        const inactiveContacts = contacts.filter(c => !c.isActive);

        // Category breakdown
        const categoryBreakdown = {
            Family: 0,
            Friend: 0,
            Work: 0,
            Business: 0,
            Other: 0
        };

        contacts.forEach(contact => {
            if (categoryBreakdown.hasOwnProperty(contact.category)) {
                categoryBreakdown[contact.category]++;
            }
        });

        // Relationship strength distribution
        const strengthDistribution = {
            strong: 0,    // 10+
            moderate: 0,  // 5-9
            weak: 0       // 0-4
        };

        contacts.forEach(contact => {
            if (contact.relationshipScore >= 10) {
                strengthDistribution.strong++;
            } else if (contact.relationshipScore >= 5) {
                strengthDistribution.moderate++;
            } else {
                strengthDistribution.weak++;
            }
        });

        // Reconnect suggestions (inactive contacts sorted by priority)
        const priorityMap = { 'High': 3, 'Medium': 2, 'Low': 1 };
        let reconnectSuggestions = inactiveContacts
            .map(c => c.toObject())
            .sort((a, b) => priorityMap[b.priority] - priorityMap[a.priority])
            .slice(0, 5);

        // Recent interactions (last 7 days)
        const recentInteractions = await Interaction.find({
            date: { $gte: sevenDaysAgo }
        })
            .populate('contactId', 'name')
            .sort({ date: -1 })
            .limit(5);

        res.json({
            totalContacts: contacts.length,
            activeContacts: activeContacts.length,
            inactiveContacts: inactiveContacts.length,
            categoryBreakdown,
            strengthDistribution,
            reconnectSuggestions,
            recentInteractions
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
