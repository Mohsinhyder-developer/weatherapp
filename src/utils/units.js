// Unit conversion utilities
export const units = {
    /**
     * Convert Celsius to Fahrenheit
     */
    celsiusToFahrenheit(celsius) {
        return (celsius * 9 / 5) + 32;
    },

    /**
     * Convert Fahrenheit to Celsius
     */
    fahrenheitToCelsius(fahrenheit) {
        return (fahrenheit - 32) * 5 / 9;
    },

    /**
     * Format temperature with unit
     */
    formatTemperature(temp, unit = 'C') {
        const rounded = Math.round(temp);
        return `${rounded}°${unit}`;
    },

    /**
     * Convert km/h to mph
     */
    kmhToMph(kmh) {
        return kmh * 0.621371;
    },

    /**
     * Convert m/s to km/h
     */
    msToKmh(ms) {
        return ms * 3.6;
    },

    /**
     * Convert m/s to mph
     */
    msToMph(ms) {
        return ms * 2.23694;
    },

    /**
     * Format wind speed with unit
     */
    formatWindSpeed(speed, unit = 'metric') {
        // speed is in m/s from API
        switch (unit) {
            case 'imperial':
                return `${Math.round(this.msToMph(speed))} mph`;
            case 'ms':
                return `${Math.round(speed)} m/s`;
            default: // metric (km/h)
                return `${Math.round(this.msToKmh(speed))} km/h`;
        }
    },

    /**
     * Convert hPa to inHg
     */
    hPaToInHg(hPa) {
        return hPa * 0.02953;
    },

    /**
     * Format pressure with unit
     */
    formatPressure(pressure, unit = 'hPa') {
        if (unit === 'inHg') {
            return `${this.hPaToInHg(pressure).toFixed(2)} inHg`;
        }
        return `${pressure} hPa`;
    }
};

export default units;
