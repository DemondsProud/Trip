const express = require('express');
const router = express.Router();
const axios = require('axios');

// GET /api/weather?city=London
router.get('/', async (req, res) => {
    const { city } = req.query;
    if (!city) return res.status(400).json({ message: 'Missing city parameter' });

    try {
        const apiKey = process.env.OPENWEATHER_API_KEY;

        // Fetch current weather and forecast
        // We use the 5 day / 3 hour forecast API (standard free tier)
        const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;

        const response = await axios.get(forecastUrl);

        // OWM returns a list of 3-hour steps. We want to aggregate or simplifiy this for the frontend.
        // For simplicity, we'll pass the raw list and let frontend pick.
        // OR we can process it here. Let's return the raw data mostly.

        res.json(response.data);

    } catch (error) {
        console.error('Weather API Error:', error.response?.data || error.message);
        if (error.response?.status === 404) {
            return res.status(404).json({ message: 'City not found' });
        }
        res.status(500).json({ message: 'Failed to fetch weather data' });
    }
});

module.exports = router;
