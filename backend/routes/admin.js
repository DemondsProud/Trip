const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const User = require('../models/User');
const Trip = require('../models/Trip');

// Helper to calculate trend
const calculateTrend = async (Model) => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const totalDocs = await Model.countDocuments();
    const recentDocs = await Model.countDocuments({ createdAt: { $gte: sevenDaysAgo } });

    // If no data existed before this week, growth is 100% (or infinite, but we cap/handle it)
    const previousDocs = totalDocs - recentDocs;

    if (previousDocs === 0) return recentDocs > 0 ? 100 : 0;

    const trend = ((recentDocs / previousDocs) * 100).toFixed(1);
    return trend;
};

// Get Admin Stats
router.get('/stats', async (req, res) => {
    try {
        const userCount = await User.countDocuments();
        const tripCount = await Trip.countDocuments();

        const userTrend = await calculateTrend(User);
        const tripTrend = await calculateTrend(Trip);

        // System Health Checks
        const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';

        // Mock AI status since we can't easily check quota without hitting it
        // We'll assume it's "Active" unless we track errors globally
        const aiStatus = 'Active';

        res.json({
            users: userCount,
            trips: tripCount,
            trends: {
                users: userTrend,
                trips: tripTrend
            },
            systemHealth: {
                api: 'Operational', // If this route responds, API is operational
                db: dbStatus,
                ai: aiStatus
            }
        });
    } catch (error) {
        console.error('Error fetching admin stats:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
