// Utility functions for data formatting
export const formatters = {
    _timeFormat: '12h',

    setTimeFormat(fmt) {
      this._timeFormat = fmt;
    },

    /**
     * Format timestamp to time (e.g., "2:30 PM" or "14:30")
     */
    formatTime(date) {
        const is24 = this._timeFormat === '24h';
        return new Date(date).toLocaleTimeString('en-US', {
            hour: is24 ? '2-digit' : 'numeric',
            minute: '2-digit',
            hour12: !is24
        });
    },

    /**
     * Format date to day of week (e.g., "Monday")
     */
    formatDayOfWeek(date) {
        return new Date(date).toLocaleDateString('en-US', {
            weekday: 'long'
        });
    },

    /**
     * Format date to short day (e.g., "Mon")
     */
    formatShortDay(date) {
        return new Date(date).toLocaleDateString('en-US', {
            weekday: 'short'
        });
    },

    /**
     * Format date to full date (e.g., "Jan 1, 2024")
     */
    formatFullDate(date) {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    },

    /**
     * Format wind direction from degrees to cardinal direction
     */
    formatWindDirection(degrees) {
        const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
        const index = Math.round(degrees / 22.5) % 16;
        return directions[index];
    },

    /**
     * Format visibility (meters to km or miles)
     */
    formatVisibility(meters, units = 'metric') {
        if (units === 'imperial') {
            const miles = meters / 1609.34;
            return `${miles.toFixed(1)} mi`;
        }
        const km = meters / 1000;
        return `${km.toFixed(1)} km`;
    },

    /**
     * Capitalize first letter
     */
    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    },

    /**
     * Format percentage
     */
    formatPercentage(value) {
        return `${Math.round(value)}%`;
    }
};

export default formatters;
