import { useState, useEffect } from 'react';
import axiosInstance from '../../utils/axios';

export default function WeatherWidget({ destination, startDate, endDate }) {
    const [currentWeather, setCurrentWeather] = useState(null);
    const [forecast, setForecast] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Weather code mapping for OpenWeatherMap icons
    const getWeatherIcon = (iconCode) => {
        // Use OWM icon URLs
        return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
    };

    useEffect(() => {
        const fetchWeather = async () => {
            if (!destination) return;

            try {
                setLoading(true);
                setError(null);

                // Call our backend proxy which calls OpenWeatherMap
                const res = await axiosInstance.get('/weather', {
                    params: { city: destination }
                });

                const data = res.data;
                const list = data.list; // 3-hour forecast list

                if (!list || list.length === 0) {
                    setError('No weather data available.');
                    setLoading(false);
                    return;
                }

                // Current Weather
                // OWM /forecast endpoint returns data starting from "now"
                const current = list[0];
                setCurrentWeather({
                    temp: Math.round(current.main.temp),
                    condition: current.weather[0].main,
                    description: current.weather[0].description,
                    icon: getWeatherIcon(current.weather[0].icon),
                    humidity: current.main.humidity,
                    windSpeed: Math.round(current.wind.speed * 3.6), // m/s to km/h
                    date: new Date(current.dt * 1000).toLocaleDateString()
                });

                // Aggregate 3-hour forecast into daily approximation
                const dailyMap = new Map();

                list.forEach(item => {
                    const dateObj = new Date(item.dt * 1000);
                    const dayKey = dateObj.toLocaleDateString();
                    const hours = dateObj.getHours();

                    // Prefer noon data (12:00), or closest to it
                    if (!dailyMap.has(dayKey) || Math.abs(hours - 12) < Math.abs(new Date(dailyMap.get(dayKey).dt * 1000).getHours() - 12)) {
                        dailyMap.set(dayKey, item);
                    }
                });

                const dailyForecast = Array.from(dailyMap.values())
                    .slice(0, 5) // OWM Free forecast is 5 days
                    .map(item => ({
                        date: new Date(item.dt * 1000).toLocaleDateString(undefined, { weekday: 'short' }),
                        temp: Math.round(item.main.temp),
                        icon: getWeatherIcon(item.weather[0].icon),
                        description: item.weather[0].main
                    }));

                setForecast(dailyForecast);
                setError(null);
            } catch (err) {
                console.error('Weather Fetch Error:', err);
                setError('Failed to load weather data.');
            } finally {
                setLoading(false);
            }
        };

        fetchWeather();
    }, [destination]);

    if (loading) return <div className="weather-widget loading">Loading weather for {destination}...</div>;
    if (error) return <div className="weather-widget error">{error}</div>;
    if (!currentWeather) return null;

    return (
        <div className="weather-widget">
            <div className="current-weather">
                <div className="weather-main">
                    <img src={currentWeather.icon} alt={currentWeather.condition} className="weather-icon-large" />
                    <div className="weather-info">
                        <h2>{currentWeather.temp}°C</h2>
                        <p className="condition">{currentWeather.description}</p>
                        <p className="location-name">{destination}</p>
                    </div>
                </div>
                <div className="weather-details">
                    <div className="detail-item">
                        <span>💧 Humidity</span>
                        <span>{currentWeather.humidity}%</span>
                    </div>
                    <div className="detail-item">
                        <span>💨 Wind</span>
                        <span>{currentWeather.windSpeed} km/h</span>
                    </div>
                </div>
            </div>

            <div className="forecast-list">
                <h3>5-Day Forecast</h3>
                <div className="forecast-grid">
                    {forecast.map((day, index) => (
                        <div key={index} className="weather-box">
                            <span className="weather-day-label">{day.date}</span>
                            <img src={day.icon} alt={day.description} className="weather-icon-small" />
                            <span className="weather-temp-badge">{day.temp}°</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
