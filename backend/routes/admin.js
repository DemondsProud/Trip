const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const User = require('../models/User');
const Trip = require('../models/Trip');

const calculateTrend = async (Model) => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const totalDocs = await Model.countDocuments();
    const recentDocs = await Model.countDocuments({ createdAt: { $gte: sevenDaysAgo } });

    const previousDocs = totalDocs - recentDocs;

    if (previousDocs === 0) return recentDocs > 0 ? 100 : 0;

    const trend = ((recentDocs / previousDocs) * 100).toFixed(1);
    return trend;
};

router.get('/stats', async (req, res) => {
    try {
        const userCount = await User.countDocuments();
        const tripCount = await Trip.countDocuments();

        const userTrend = await calculateTrend(User);
        const tripTrend = await calculateTrend(Trip);

        const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';

        const aiStatus = 'Active';

        res.json({
            users: userCount,
            trips: tripCount,
            trends: {
                users: userTrend,
                trips: tripTrend
            },
            systemHealth: {
                api: 'Operational', 
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
