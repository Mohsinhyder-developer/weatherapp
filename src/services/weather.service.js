// Weather Service - OpenWeatherMap API Integration
const API_KEY = 'a1344abdd8f27d55282815c8c08e1bfb';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';
const GEO_URL = 'https://api.openweathermap.org/geo/1.0';

class WeatherService {
    /**
     * Get current weather by coordinates
     */
    async getCurrentWeatherByCoords(lat, lon, units = 'metric') {
        try {
            const response = await fetch(
                `${BASE_URL}/weather?lat=${lat}&lon=${lon}&units=${units}&appid=${API_KEY}`
            );

            if (!response.ok) throw new Error('Failed to fetch weather data');

            const data = await response.json();
            return this.formatCurrentWeather(data);
        } catch (error) {
            console.error('Error fetching weather:', error);
            throw error;
        }
    }

    /**
     * Get current weather by city name
     */
    async getCurrentWeatherByCity(city, units = 'metric') {
        try {
            const response = await fetch(
                `${BASE_URL}/weather?q=${city}&units=${units}&appid=${API_KEY}`
            );

            if (!response.ok) throw new Error('City not found');

            const data = await response.json();
            return this.formatCurrentWeather(data);
        } catch (error) {
            console.error('Error fetching weather:', error);
            throw error;
        }
    }

    /**
     * Get hourly forecast (next 24 hours)
     */
    async getHourlyForecast(lat, lon, units = 'metric') {
        try {
            const response = await fetch(
                `${BASE_URL}/forecast?lat=${lat}&lon=${lon}&units=${units}&appid=${API_KEY}`
            );

            if (!response.ok) throw new Error('Failed to fetch forecast');

            const data = await response.json();
            // Get next 24 hours (8 x 3-hour intervals)
            return data.list.slice(0, 8).map(item => ({
                time: new Date(item.dt * 1000),
                temp: Math.round(item.main.temp),
                feelsLike: Math.round(item.main.feels_like),
                weather: item.weather[0].main,
                description: item.weather[0].description,
                icon: item.weather[0].icon,
                humidity: item.main.humidity,
                windSpeed: item.wind.speed,
                pop: Math.round(item.pop * 100) // Probability of precipitation
            }));
        } catch (error) {
            console.error('Error fetching hourly forecast:', error);
            throw error;
        }
    }

    /**
     * Get 7-day forecast
     */
    async getDailyForecast(lat, lon, units = 'metric') {
        try {
            // Using OneCall API 3.0 for daily forecast
            const response = await fetch(
                `${BASE_URL}/forecast?lat=${lat}&lon=${lon}&units=${units}&appid=${API_KEY}`
            );

            if (!response.ok) throw new Error('Failed to fetch forecast');

            const data = await response.json();

            // Group by day and get daily min/max
            const dailyData = this.groupByDay(data.list);

            return dailyData.slice(0, 7);
        } catch (error) {
            console.error('Error fetching daily forecast:', error);
            throw error;
        }
    }

    /**
     * Get Air Quality Index (AQI)
     */
    async getAirQuality(lat, lon) {
        try {
            const response = await fetch(
                `${BASE_URL}/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`
            );

            if (!response.ok) throw new Error('Failed to fetch air quality');

            const data = await response.json();
            const aqi = data.list[0];

            return {
                aqi: aqi.main.aqi,
                aqiDescription: this.getAQIDescription(aqi.main.aqi),
                components: {
                    co: aqi.components.co,
                    no2: aqi.components.no2,
                    o3: aqi.components.o3,
                    pm2_5: aqi.components.pm2_5,
                    pm10: aqi.components.pm10
                },
                healthRecommendation: this.getHealthRecommendation(aqi.main.aqi)
            };
        } catch (error) {
            if (error.message.includes('401') || error.message.includes('Failed to fetch')) {
                return null; // Silent fail for free tier
            }
            console.error('Error fetching air quality:', error);
            throw error;
        }
    }

    /**
     * Get UV Index
     * Note: Standard API key might not support OneCall 3.0, trying fallback if needed or fail gracefully
     */
    /**
     * Get UV Index
     * Note: Standard API key does not support OneCall 3.0, returning null to prevent 401 errors.
     */
    async getUVIndex(lat, lon) {
        // Return null immediately as free/standard keys don't support this endpoint
        return null;
    }

    /**
     * Get Map Tile URL
     * layer: 'clouds_new', 'precipitation_new', 'pressure_new', 'wind_new', 'temp_new'
     */
    getMapTileUrl(layer) {
        return `https://tile.openweathermap.org/map/${layer}/{z}/{x}/{y}.png?appid=${API_KEY}`;
    }

    /**
     * Search cities for autocomplete
     */
    async searchCities(query, limit = 5) {
        try {
            const response = await fetch(
                `${GEO_URL}/direct?q=${encodeURIComponent(query)}&limit=${limit}&appid=${API_KEY}`
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('Search API Error:', response.status, errorData);
                throw new Error(`Failed to search cities: ${response.statusText}`);
            }

            const data = await response.json();
            if (!Array.isArray(data)) {
                console.error('Unexpected API response format:', data);
                return [];
            }

            return data.map(city => ({
                name: city.name,
                country: city.country,
                state: city.state,
                lat: city.lat,
                lon: city.lon,
                displayName: `${city.name}${city.state ? ', ' + city.state : ''}, ${city.country}`
            }));
        } catch (error) {
            console.error('Error searching cities:', error);
            // Return empty array instead of throwing to prevent UI crash
            return [];
        }
    }

    /**
     * Format current weather data
     */
    formatCurrentWeather(data) {
        return {
            temp: Math.round(data.main.temp),
            feelsLike: Math.round(data.main.feels_like),
            tempMin: Math.round(data.main.temp_min),
            tempMax: Math.round(data.main.temp_max),
            weather: data.weather[0].main,
            description: data.weather[0].description,
            icon: data.weather[0].icon,
            humidity: data.main.humidity,
            pressure: data.main.pressure,
            windSpeed: data.wind.speed,
            windDeg: data.wind.deg,
            clouds: data.clouds.all,
            visibility: data.visibility,
            sunrise: new Date(data.sys.sunrise * 1000),
            sunset: new Date(data.sys.sunset * 1000),
            timezone: data.timezone,
            cityName: data.name,
            country: data.sys.country,
            coords: {
                lat: data.coord.lat,
                lon: data.coord.lon
            }
        };
    }

    /**
     * Group forecast data by day
     */
    groupByDay(list) {
        const days = {};

        list.forEach(item => {
            const date = new Date(item.dt * 1000);
            const day = date.toLocaleDateString();

            if (!days[day]) {
                days[day] = {
                    date: date,
                    temps: [],
                    weather: item.weather[0],
                    pop: []
                };
            }

            days[day].temps.push(item.main.temp);
            days[day].pop.push(item.pop);
        });

        return Object.values(days).map(day => ({
            date: day.date,
            tempMin: Math.round(Math.min(...day.temps)),
            tempMax: Math.round(Math.max(...day.temps)),
            weather: day.weather.main,
            description: day.weather.description,
            icon: day.weather.icon,
            pop: Math.round(Math.max(...day.pop) * 100)
        }));
    }

    /**
     * Get AQI description
     */
    getAQIDescription(aqi) {
        const descriptions = {
            1: 'Good',
            2: 'Fair',
            3: 'Moderate',
            4: 'Poor',
            5: 'Very Poor'
        };
        return descriptions[aqi] || 'Unknown';
    }

    /**
     * Get health recommendation based on AQI
     */
    getHealthRecommendation(aqi) {
        const recommendations = {
            1: 'Air quality is satisfactory, and air pollution poses little or no risk.',
            2: 'Air quality is acceptable. However, there may be a risk for some people, particularly those who are unusually sensitive to air pollution.',
            3: 'Members of sensitive groups may experience health effects. The general public is less likely to be affected.',
            4: 'Some members of the general public may experience health effects; members of sensitive groups may experience more serious health effects.',
            5: 'Health alert: The risk of health effects is increased for everyone.'
        };
        return recommendations[aqi] || 'No data available';
    }

    /**
     * OpenWeatherMap icon code → Basmilius animated weather icon name
     */
    _owmToBasmilius = {
        '01d': 'clear-day',
        '01n': 'clear-night',
        '02d': 'partly-cloudy-day',
        '02n': 'partly-cloudy-night',
        '03d': 'cloudy',
        '03n': 'cloudy',
        '04d': 'overcast-day',
        '04n': 'overcast-night',
        '09d': 'partly-cloudy-day-drizzle',
        '09n': 'partly-cloudy-night-drizzle',
        '10d': 'partly-cloudy-day-rain',
        '10n': 'partly-cloudy-night-rain',
        '11d': 'thunderstorms-day-rain',
        '11n': 'thunderstorms-night-rain',
        '13d': 'partly-cloudy-day-snow',
        '13n': 'partly-cloudy-night-snow',
        '50d': 'mist',
        '50n': 'mist',
    };

    /**
     * Get weather icon URL (Basmilius animated SVG)
     */
    getIconUrl(iconCode) {
        const name = this._owmToBasmilius[iconCode] || 'not-available';
        return `https://basmilius.github.io/weather-icons/production/fill/all/${name}.svg`;
    }

    /**
     * Get metric/UI icon URL (Basmilius static SVG)
     */
    getMetricIconUrl(name) {
        return `https://basmilius.github.io/weather-icons/production/fill/all/${name}.svg`;
    }
}

export default new WeatherService();
