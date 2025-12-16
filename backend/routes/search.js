const express = require('express');
const router = express.Router();
const axios = require('axios');

const generateHotels = (location) => {
    const basePrice = location.length * 15;
    const hotels = ['Grand Plaza', 'SleepTight Inn', 'The Continental', 'Budget Bunk'];

    return hotels.map((hotel, index) => ({
        id: `htl_${index}_${location}`,
        type: 'hotel',
        provider: hotel,
        title: `Stay at ${hotel}`,
        description: `Standard Room - Wifi Included`,
        startTime: '14:00', 
        endTime: '11:00', 
        location: `${hotel}, ${location}`,
        cost: basePrice + (index * 80) + Math.floor(Math.random() * 20),
        currency: 'USD'
    }));
};

router.get('/flights', async (req, res) => {
    const { from, to, date } = req.query;
    if (!from || !to) return res.status(400).json({ message: 'Missing from/to parameters' });

    try {

        const response = await axios.get('http://api.aviationstack.com/v1/flights', {
            params: {
                access_key: process.env.AVIATION_API_KEY,
                limit: 10,
                
                dep_iata: from,
                arr_iata: to
            }
        });

        const apiFlights = response.data.data || [];

        const results = apiFlights.map((flight, index) => ({
            id: `flight_${index}`,
            type: 'flight',
            provider: flight.airline?.name || 'Unknown Airline',
            title: `Flight ${flight.flight?.iata || 'N/A'}`,
            description: `Departs: ${flight.departure?.airport || from} -> Arrives: ${flight.arrival?.airport || to}`,
            startTime: flight.departure?.scheduled ? new Date(flight.departure.scheduled).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'TBD',
            endTime: flight.arrival?.scheduled ? new Date(flight.arrival.scheduled).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'TBD',
            location: `${flight.departure?.iata || from} -> ${flight.arrival?.iata || to}`,
            
            cost: 150 + Math.floor(Math.random() * 300),
            currency: 'USD'
        }));

        if (results.length === 0) {

            results.push({
                id: 'demo_fallback',
                type: 'flight',
                provider: 'Demo Airways (API returned 0)',
                title: 'Demo Flight',
                description: 'No live flights found for this route/time on Free Tier',
                startTime: '10:00',
                endTime: '12:00',
                location: `${from} -> ${to}`,
                cost: 99,
                currency: 'USD'
            });
        }

        res.json(results);
    } catch (error) {
        console.error('Aviation API Error:', error.message);
        res.status(500).json({ message: 'Failed to fetch flight data' });
    }
});

router.get('/hotels', (req, res) => {
    const { location, date } = req.query;
    if (!location) return res.status(400).json({ message: 'Missing location parameter' });

    setTimeout(() => {
        const results = generateHotels(location);
        res.json(results);
    }, 800);
});

module.exports = router;
