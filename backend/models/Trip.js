const mongoose = require('mongoose');

const itineraryItemSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['activity', 'hotel', 'flight', 'transport'],
        required: true
    },
    title: { type: String, required: true },
    description: String,
    startTime: String,
    endTime: String,
    location: String,
    cost: Number,
    booked: { type: Boolean, default: false }
});

const daySchema = new mongoose.Schema({
    day: { type: Number, required: true },
    date: Date,
    items: [itineraryItemSchema]
});

const tripSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    sharedWith: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    destination: {
        type: String,
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    notes: String,
    itinerary: [daySchema],
    expenses: [{
        description: { type: String, required: true },
        amount: { type: Number, required: true },
        category: {
            type: String,
            enum: ['food', 'transport', 'accommodation', 'activity', 'other'],
            default: 'other'
        },
        date: { type: Date, default: Date.now }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Trip', tripSchema);
