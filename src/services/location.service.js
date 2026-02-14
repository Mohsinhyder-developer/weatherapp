// Location Service - Geolocation utilities
class LocationService {
    constructor() {
        this.lastKnownLocation = null;
    }

    /**
     * Get user's current location using GPS
     * @param {Object} options - { maximumAge: 0 } for fresh position, default 5 min cache
     */
    async getCurrentLocation(options = {}) {
        const { maximumAge = 300000 } = options;
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation is not supported by your browser'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const location = {
                        lat: position.coords.latitude,
                        lon: position.coords.longitude,
                        accuracy: position.coords.accuracy
                    };

                    this.lastKnownLocation = location;
                    this.saveLastLocation(location);
                    resolve(location);
                },
                (error) => {
                    let errorMessage = 'Failed to get location';

                    switch (error.code) {
                        case error.PERMISSION_DENIED:
                            errorMessage = 'Location permission denied';
                            break;
                        case error.POSITION_UNAVAILABLE:
                            errorMessage = 'Location information unavailable';
                            break;
                        case error.TIMEOUT:
                            errorMessage = 'Location request timed out';
                            break;
                    }

                    reject(new Error(errorMessage));
                },
                {
                    enableHighAccuracy: true,
                    timeout: 20000,
                    maximumAge
                }
            );
        });
    }

    /**
     * Get a fresh GPS position only. No cache, no fallback. Use for "Use current location" button.
     */
    async getFreshLocation() {
        return this.getCurrentLocation({ maximumAge: 0 });
    }

    /**
     * Request location permission
     */
    async requestPermission() {
        try {
            const result = await navigator.permissions.query({ name: 'geolocation' });
            return result.state;
        } catch (error) {
            console.error('Error checking permission:', error);
            return 'prompt';
        }
    }

    /**
     * Check if location permission is granted
     */
    async hasPermission() {
        const permission = await this.requestPermission();
        return permission === 'granted';
    }

    /**
     * Save last known location to localStorage
     */
    saveLastLocation(location) {
        try {
            localStorage.setItem('lastLocation', JSON.stringify(location));
        } catch (error) {
            console.error('Error saving last location:', error);
        }
    }

    /**
     * Get last known location from localStorage
     */
    getLastLocation() {
        try {
            const saved = localStorage.getItem('lastLocation');
            if (saved) {
                this.lastKnownLocation = JSON.parse(saved);
                return this.lastKnownLocation;
            }
        } catch (error) {
            console.error('Error retrieving last location:', error);
        }
        return null;
    }

    /**
     * Get location with fallback
     * Try GPS first, then fall back to last known location
     */
    async getLocationWithFallback() {
        try {
            return await this.getCurrentLocation();
        } catch (error) {
            console.warn('GPS failed, trying last known location');
            const lastLocation = this.getLastLocation();

            if (lastLocation) {
                return lastLocation;
            }

            // Fallback to London if everything fails
            console.warn('No location available. Using default (London).');
            return {
                lat: 51.5074,
                lon: -0.1278,
                name: 'London',
                country: 'GB'
            };
        }
    }

    /**
     * Watch user's position for continuous updates
     */
    watchPosition(callback, errorCallback) {
        if (!navigator.geolocation) {
            errorCallback(new Error('Geolocation not supported'));
            return null;
        }

        return navigator.geolocation.watchPosition(
            (position) => {
                const location = {
                    lat: position.coords.latitude,
                    lon: position.coords.longitude,
                    accuracy: position.coords.accuracy
                };

                this.lastKnownLocation = location;
                callback(location);
            },
            errorCallback,
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000
            }
        );
    }

    /**
     * Clear watch position
     */
    clearWatch(watchId) {
        if (watchId) {
            navigator.geolocation.clearWatch(watchId);
        }
    }
}

export default new LocationService();
