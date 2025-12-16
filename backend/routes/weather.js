const express = require('express');
const router = express.Router();
const axios = require('axios');

router.get('/', async (req, res) => {
    const { city } = req.query;
    if (!city) return res.status(400).json({ message: 'Missing city parameter' });

    try {
        const apiKey = process.env.OPENWEATHER_API_KEY;

        const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;

        const response = await axios.get(forecastUrl);

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
