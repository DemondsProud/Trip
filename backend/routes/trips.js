const express = require('express');
const router = express.Router();
const Trip = require('../models/Trip');
const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Please authenticate' });
    }
};

router.post('/', auth, async (req, res) => {
    try {
        const { destination, startDate, endDate, notes } = req.body;

        const start = new Date(startDate);
        const end = new Date(endDate);
        const dayCount = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

        let itinerary = req.body.itinerary;

        if (!itinerary || itinerary.length === 0) {
            itinerary = [];
            for (let i = 0; i < dayCount; i++) {
                const date = new Date(start);
                date.setDate(date.getDate() + i);
                itinerary.push({
                    day: i + 1,
                    date: date,
                    items: []
                });
            }
        }

        const trip = new Trip({
            user: req.user.userId,
            destination,
            startDate,
            endDate,
            notes,
            itinerary
        });

        await trip.save();
        res.status(201).json(trip);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/', auth, async (req, res) => {
    try {
        const trips = await Trip.find({
            $or: [
                { user: req.user.userId },
                { sharedWith: req.user.userId }
            ]
        }).sort({ startDate: 1 });
        res.json(trips);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/:id', auth, async (req, res) => {
    try {
        const trip = await Trip.findOne({
            _id: req.params.id,
            $or: [
                { user: req.user.userId },
                { sharedWith: req.user.userId }
            ]
        }).populate('sharedWith', 'email'); 

        if (!trip) {
            return res.status(404).json({ message: 'Trip not found or access denied' });
        }
        res.json(trip);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/:id/item', auth, async (req, res) => {
    try {
        const { dayId, type, title, description, startTime, endTime, location, cost } = req.body;

        const trip = await Trip.findOne({ _id: req.params.id, user: req.user.userId });
        if (!trip) {
            return res.status(404).json({ message: 'Trip not found' });
        }

        const day = trip.itinerary.id(dayId);
        if (!day) {
            return res.status(404).json({ message: 'Day not found' });
        }

        day.items.push({
            type,
            title,
            description,
            startTime,
            endTime,
            location,
            cost
        });

        await trip.save();
        res.json(trip);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.delete('/:id/days/:dayId/items/:itemId', auth, async (req, res) => {
    try {
        const trip = await Trip.findOne({ _id: req.params.id, user: req.user.userId });
        if (!trip) {
            return res.status(404).json({ message: 'Trip not found' });
        }

        const day = trip.itinerary.id(req.params.dayId);
        if (!day) {
            return res.status(404).json({ message: 'Day not found' });
        }

        day.items.pull(req.params.itemId);
        await trip.save();
        res.json(trip);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.patch('/:id/days/:dayId/items/:itemId/book', auth, async (req, res) => {
    try {
        const trip = await Trip.findOne({ _id: req.params.id, user: req.user.userId });
        if (!trip) {
            return res.status(404).json({ message: 'Trip not found' });
        }

        const day = trip.itinerary.id(req.params.dayId);
        if (!day) {
            return res.status(404).json({ message: 'Day not found' });
        }

        const item = day.items.id(req.params.itemId);
        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }

        item.booked = !item.booked; 
        await trip.save();
        res.json(trip);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/:id/share', auth, async (req, res) => {
    try {
        const { email } = req.body;
        const User = require('../models/User');

        const userToShareWith = await User.findOne({ email });
        if (!userToShareWith) {
            return res.status(404).json({ message: 'User not found' });
        }

        const trip = await Trip.findOne({ _id: req.params.id, user: req.user.userId });
        if (!trip) {
            return res.status(404).json({ message: 'Trip not found or access denied' });
        }

        if (trip.sharedWith.includes(userToShareWith._id)) {
            return res.status(400).json({ message: 'Trip already shared with this user' });
        }

        trip.sharedWith.push(userToShareWith._id);
        await trip.save();

        const updatedTrip = await Trip.findById(trip._id).populate('sharedWith', 'email');
        res.json(updatedTrip);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/:id/expenses', auth, async (req, res) => {
    try {
        const trip = await Trip.findById(req.params.id);
        if (!trip) return res.status(404).json({ message: 'Trip not found' });

        const isOwner = trip.user.toString() === req.user.userId;
        const isShared = trip.sharedWith.includes(req.user.userId);

        if (!isOwner && !isShared) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const { description, amount, category } = req.body;
        trip.expenses.push({ description, amount, category });
        await trip.save();

        res.json(trip);
    } catch (error) {
        console.error('Error adding expense:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.delete('/:id/expenses/:expenseId', auth, async (req, res) => {
    try {
        const trip = await Trip.findById(req.params.id);
        if (!trip) return res.status(404).json({ message: 'Trip not found' });

        const isOwner = trip.user.toString() === req.user.userId;
        if (!isOwner) {

            const isShared = trip.sharedWith.includes(req.user.userId);
            if (!isShared) return res.status(403).json({ message: 'Not authorized' });
        }

        trip.expenses = trip.expenses.filter(e => e._id.toString() !== req.params.expenseId);
        await trip.save();

        res.json(trip);
    } catch (error) {
        console.error('Error deleting expense:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.patch('/:id/days/:dayId/reorder', auth, async (req, res) => {
    try {
        const { newItems } = req.body;
        const trip = await Trip.findOne({ _id: req.params.id, user: req.user.userId });
        if (!trip) {
            return res.status(404).json({ message: 'Trip not found' });
        }

        const day = trip.itinerary.id(req.params.dayId);
        if (!day) {
            return res.status(404).json({ message: 'Day not found' });
        }

        day.items = newItems;

        await trip.save();
        res.json(trip);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
