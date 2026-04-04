const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const mongoose = require('mongoose');
const Contact = require('../models/Contact');
const Interaction = require('../models/Interaction');

const dashboardCache = new Map();
const DASHBOARD_CACHE_TTL_MS = 30 * 1000;

// @route   GET api/dashboard
// @desc    Get dashboard stats with enhanced insights
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const cached = dashboardCache.get(userId);
        if (cached && Date.now() - cached.ts < DASHBOARD_CACHE_TTL_MS) {
            return res.json(cached.data);
        }
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const fiveDaysAgo = new Date();
        fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

        // Get all contacts for user
        const contacts = await Contact.find({ userId });
        const contactIds = contacts.map((c) => c._id);

        const interactionAgg = contactIds.length ? await Interaction.aggregate([
            {
                $match: {
                    userId: new mongoose.Types.ObjectId(userId),
                    contactId: { $in: contactIds },
                },
            },
            {
                $group: {
                    _id: '$contactId',
                    total: { $sum: 1 },
                    lastInteractionAt: { $max: '$timestamp' },
                    last7DaysCount: {
                        $sum: {
                            $cond: [{ $gte: ['$timestamp', sevenDaysAgo] }, 1, 0],
                        },
                    },
                    messageCount: {
                        $sum: {
                            $cond: [
                                {
                                    $or: [
                                        { $eq: ['$type', 'message_sent'] },
                                        { $eq: ['$type', 'message_received'] },
                                    ],
                                },
                                1,
                                0,
                            ],
                        },
                    },
                    missedCallCount: {
                        $sum: {
                            $cond: [{ $eq: ['$type', 'call_missed'] }, 1, 0],
                        },
                    },
                },
            },
        ]) : [];

        const interactionByContact = new Map(
            interactionAgg.map((i) => [String(i._id), i])
        );

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

        const contactInsights = contacts.map((contact) => {
            const activity = interactionByContact.get(String(contact._id));
            const lastInteractionAt = activity?.lastInteractionAt || contact.lastInteractionDate || null;
            const last7DaysCount = activity?.last7DaysCount || 0;
            const missedCallCount = activity?.missedCallCount || 0;
            const frequency = activity?.total || 0;

            let priorityLabel = 'Inactive';
            if (last7DaysCount >= 5) {
                priorityLabel = 'Frequent';
            } else if (last7DaysCount >= 2 || (contact.priority || '').toLowerCase() === 'high') {
                priorityLabel = 'Important';
            }

            return {
                _id: contact._id,
                name: contact.name,
                priorityLabel,
                frequency,
                lastInteractionAt,
                missedCallCount,
                needsReminder: !lastInteractionAt || new Date(lastInteractionAt) < fiveDaysAgo,
            };
        });

        const topContacts = [...contactInsights]
            .sort((a, b) => b.frequency - a.frequency)
            .slice(0, 5);

        const needsAttention = contactInsights
            .filter((c) => c.needsReminder || c.missedCallCount > 0)
            .sort((a, b) => {
                if (b.missedCallCount !== a.missedCallCount) return b.missedCallCount - a.missedCallCount;
                return (a.lastInteractionAt ? new Date(a.lastInteractionAt).getTime() : 0) - (b.lastInteractionAt ? new Date(b.lastInteractionAt).getTime() : 0);
            })
            .slice(0, 5);

        const mostContacted = topContacts[0] || null;
        const leastContacted = [...contactInsights].sort((a, b) => a.frequency - b.frequency)[0] || null;

        const aiSuggestions = needsAttention.slice(0, 5).map((item) => {
            if (item.missedCallCount > 0) {
                return {
                    contactId: item._id,
                    message: `Call back ${item.name} (${item.missedCallCount} missed call${item.missedCallCount > 1 ? 's' : ''})`,
                    priority: 'high',
                };
            }

            const days = item.lastInteractionAt
                ? Math.max(1, Math.ceil((Date.now() - new Date(item.lastInteractionAt).getTime()) / (1000 * 60 * 60 * 24)))
                : 7;

            return {
                contactId: item._id,
                message: `You haven't contacted ${item.name} in ${days} day${days > 1 ? 's' : ''}`,
                priority: days >= 7 ? 'high' : 'medium',
            };
        });

        // Recent interactions (last 7 days)
        const recentInteractions = await Interaction.find({
            userId,
            timestamp: { $gte: sevenDaysAgo }
        })
            .populate('contactId', 'name')
            .sort({ timestamp: -1 })
            .limit(5);

        const payload = {
            totalContacts: contacts.length,
            activeContacts: activeContacts.length,
            inactiveContacts: inactiveContacts.length,
            categoryBreakdown,
            strengthDistribution,
            reconnectSuggestions,
            recentInteractions,
            mostContacted,
            leastContacted,
            pendingFollowUps: needsAttention.length,
            topContacts,
            needsAttention,
            aiSuggestions,
        };

        dashboardCache.set(userId, { ts: Date.now(), data: payload });
        res.json(payload);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
