// Storage Service - Using IndexedDB for offline support
import { openDB } from 'idb';

const DB_NAME = 'weather-app-db';
const DB_VERSION = 1;

class StorageService {
    constructor() {
        this.db = null;
        this.initDB();
    }

    /**
     * Initialize IndexedDB
     */
    async initDB() {
        try {
            this.db = await openDB(DB_NAME, DB_VERSION, {
                upgrade(db) {
                    // Create object stores
                    if (!db.objectStoreNames.contains('weather')) {
                        db.createObjectStore('weather', { keyPath: 'id' });
                    }

                    if (!db.objectStoreNames.contains('favorites')) {
                        db.createObjectStore('favorites', { keyPath: 'id' });
                    }

                    if (!db.objectStoreNames.contains('preferences')) {
                        db.createObjectStore('preferences', { keyPath: 'key' });
                    }
                },
            });
        } catch (error) {
            console.error('Error initializing database:', error);
        }
    }

    /**
     * Save weather data
     */
    async saveWeatherData(location, data) {
        try {
            await this.db.put('weather', {
                id: `${location.lat},${location.lon}`,
                data,
                timestamp: Date.now()
            });
        } catch (error) {
            console.error('Error saving weather data:', error);
        }
    }

    /**
     * Get cached weather data
     */
    async getCachedWeatherData(location, maxAge = 600000) { // 10 minutes default
        try {
            const cached = await this.db.get('weather', `${location.lat},${location.lon}`);

            if (cached && (Date.now() - cached.timestamp) < maxAge) {
                return cached.data;
            }

            return null;
        } catch (error) {
            console.error('Error getting cached weather:', error);
            return null;
        }
    }

    /**
     * Save favorite city
     */
    async saveFavorite(city) {
        try {
            const id = `${city.lat},${city.lon}`;
            await this.db.put('favorites', {
                id,
                ...city,
                addedAt: Date.now()
            });
        } catch (error) {
            console.error('Error saving favorite:', error);
            throw error;
        }
    }

    /**
     * Remove favorite city
     */
    async removeFavorite(city) {
        try {
            const id = `${city.lat},${city.lon}`;
            await this.db.delete('favorites', id);
        } catch (error) {
            console.error('Error removing favorite:', error);
            throw error;
        }
    }

    /**
     * Get all favorite cities
     */
    async getAllFavorites() {
        try {
            const favorites = await this.db.getAllFromIndex('favorites');
            return favorites || [];
        } catch (error) {
            // Fallback if index doesn't exist
            try {
                const tx = this.db.transaction('favorites', 'readonly');
                const store = tx.objectStore('favorites');
                const favorites = await store.getAll();
                return favorites || [];
            } catch (err) {
                console.error('Error getting favorites:', err);
                return [];
            }
        }
    }

    /**
     * Check if city is in favorites
     */
    async isFavorite(city) {
        try {
            const id = `${city.lat},${city.lon}`;
            const favorite = await this.db.get('favorites', id);
            return !!favorite;
        } catch (error) {
            console.error('Error checking favorite:', error);
            return false;
        }
    }

    /**
     * Save user preference
     */
    async savePreference(key, value) {
        try {
            // Wait for db to be ready
            if (!this.db) {
                await this.initDB();
            }

            if (this.db) {
                await this.db.put('preferences', { key, value });
            }

            // Also save to localStorage for quick access
            localStorage.setItem(`pref_${key}`, JSON.stringify(value));
        } catch (error) {
            console.error('Error saving preference:', error);
        }
    }

    /**
     * Get user preference
     */
    async getPreference(key, defaultValue = null) {
        try {
            // Try localStorage first for speed
            const localValue = localStorage.getItem(`pref_${key}`);
            if (localValue !== null) {
                return JSON.parse(localValue);
            }

            // Wait for db to be ready
            if (!this.db) {
                await this.initDB();
            }

            // Fall back to IndexedDB
            if (this.db) {
                const pref = await this.db.get('preferences', key);
                return pref ? pref.value : defaultValue;
            }

            return defaultValue;
        } catch (error) {
            console.error('Error getting preference:', error);
            return defaultValue;
        }
    }

    /**
     * Get all preferences
     */
    async getAllPreferences() {
        try {
            const tx = this.db.transaction('preferences', 'readonly');
            const store = tx.objectStore('preferences');
            const prefs = await store.getAll();

            const prefsObj = {};
            prefs.forEach(pref => {
                prefsObj[pref.key] = pref.value;
            });

            return prefsObj;
        } catch (error) {
            console.error('Error getting all preferences:', error);
            return {};
        }
    }

    /**
     * Clear all cached weather data
     */
    async clearWeatherCache() {
        try {
            const tx = this.db.transaction('weather', 'readwrite');
            await tx.objectStore('weather').clear();
        } catch (error) {
            console.error('Error clearing cache:', error);
        }
    }

    /**
     * Clear all data
     */
    async clearAll() {
        try {
            await this.db.clear('weather');
            await this.db.clear('favorites');
            await this.db.clear('preferences');
            localStorage.clear();
        } catch (error) {
            console.error('Error clearing all data:', error);
        }
    }
}

export default new StorageService();
