// Storage Service - Using IndexedDB for offline support
import { openDB } from 'idb';

const DB_NAME = 'weather-app-db';
const DB_VERSION = 1;

class StorageService {
    constructor() {
        this.db = null;
        this._dbReady = this.initDB();
    }

    /**
     * Ensure DB is initialized before use
     */
    async ensureDB() {
        if (!this.db) {
            await this._dbReady;
        }
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
            await this.ensureDB();
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
            await this.ensureDB();
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
            await this.ensureDB();
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
            await this.ensureDB();
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
            await this.ensureDB();
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
            await this.ensureDB();
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
            await this.ensureDB();

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

            // Fall back to IndexedDB
            await this.ensureDB();
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
            await this.ensureDB();
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
     * Save a daily weather snapshot for comparison
     */
    async saveWeatherSnapshot(data) {
        try {
            await this.ensureDB();
            const today = new Date().toISOString().slice(0, 10);
            await this.db.put('weather', {
                id: `snapshot_${today}`,
                data,
                timestamp: Date.now()
            });
        } catch (e) {
            console.error('Error saving weather snapshot:', e);
        }
    }

    /**
     * Get yesterday's weather snapshot for comparison
     */
    async getYesterdayWeather() {
        try {
            await this.ensureDB();
            const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
            const snap = await this.db.get('weather', `snapshot_${yesterday}`);
            return snap?.data || null;
        } catch (e) {
            console.error('Error getting yesterday weather:', e);
            return null;
        }
    }

    /**
     * Clear all cached weather data
     */
    async clearWeatherCache() {
        try {
            await this.ensureDB();
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
            await this.ensureDB();
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
