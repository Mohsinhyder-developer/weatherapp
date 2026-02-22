// Theme management utilities — supports multiple visual themes
export const THEMES = {
    celestial: {
        name: 'Celestial Night',
        icon: '🌌',
        metaColor: '#0f0a2e',
        bgClass: 'theme-celestial',
        description: 'Deep purple galaxy sky',
    },
    twilight: {
        name: 'Twilight',
        icon: '🌆',
        metaColor: '#0f172a',
        bgClass: 'theme-twilight',
        description: 'Purple dusk gradient',
    },
    sunset: {
        name: 'Golden Sunset',
        icon: '🌅',
        metaColor: '#5c2d0e',
        bgClass: 'theme-sunset',
        description: 'Warm golden horizon',
    },
    aurora: {
        name: 'Aurora',
        icon: '🌈',
        metaColor: '#0a2342',
        bgClass: 'theme-aurora',
        description: 'Northern lights glow',
    },
    ocean: {
        name: 'Deep Ocean',
        icon: '🌊',
        metaColor: '#0a1628',
        bgClass: 'theme-ocean',
        description: 'Calm deep blue seas',
    },
    auto: {
        name: 'Auto (Time-based)',
        icon: '🕐',
        metaColor: '#0f172a',
        bgClass: '',
        description: 'Changes with time of day',
    },
};

export const theme = {
    currentTheme: 'twilight',
    starsCreated: false,

    /**
     * Initialize theme from saved preference
     */
    init() {
        const savedTheme = localStorage.getItem('theme') || 'twilight';
        this.setTheme(savedTheme);
    },

    /**
     * Set theme
     */
    setTheme(themeName) {
        if (!THEMES[themeName]) themeName = 'twilight';

        // If auto, pick based on time of day
        let resolvedTheme = themeName;
        if (themeName === 'auto') {
            resolvedTheme = this._getAutoTheme();
        }

        this.currentTheme = themeName;
        const themeConfig = THEMES[resolvedTheme];

        // Remove all theme classes from html
        const html = document.documentElement;
        Object.values(THEMES).forEach(t => {
            if (t.bgClass) html.classList.remove(t.bgClass);
        });

        // Apply the resolved theme class
        if (themeConfig.bgClass) {
            html.classList.add(themeConfig.bgClass);
        }

        // Dark mode for certain themes
        const darkThemes = ['celestial', 'aurora', 'ocean'];
        if (darkThemes.includes(resolvedTheme)) {
            html.classList.add('dark');
        } else {
            html.classList.remove('dark');
        }

        localStorage.setItem('theme', themeName);

        // Update meta theme-color
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            metaThemeColor.setAttribute('content', themeConfig.metaColor);
        }

        // Create stars for celestial/aurora themes
        this._updateStars(resolvedTheme);

        // Update background element
        this._updateBackground(resolvedTheme);
    },

    /**
     * Auto theme: pick based on hour
     */
    _getAutoTheme() {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 8) return 'sunset';     // dawn
        if (hour >= 8 && hour < 17) return 'ocean';      // day
        if (hour >= 17 && hour < 20) return 'twilight';   // dusk
        return 'celestial';                                // night
    },

    /**
     * Create animated stars overlay
     */
    _updateStars(resolvedTheme) {
        const needStars = ['celestial', 'aurora'].includes(resolvedTheme);
        let container = document.getElementById('stars-container');
        
        if (!needStars) {
            if (container) container.style.display = 'none';
            return;
        }

        if (!container) {
            container = document.createElement('div');
            container.id = 'stars-container';
            container.className = 'stars-container';
            document.body.appendChild(container);
        }
        container.style.display = 'block';

        if (!this.starsCreated) {
            this.starsCreated = true;
            let starsHTML = '';
            for (let i = 0; i < 80; i++) {
                const x = Math.random() * 100;
                const y = Math.random() * 100;
                const size = Math.random() * 2.5 + 0.5;
                const delay = Math.random() * 4;
                const dur = Math.random() * 3 + 2;
                starsHTML += `<div class="star" style="left:${x}%;top:${y}%;width:${size}px;height:${size}px;animation-delay:${delay}s;animation-duration:${dur}s"></div>`;
            }
            // Add a few shooting stars
            for (let i = 0; i < 3; i++) {
                const top = Math.random() * 40 + 5;
                const delay = Math.random() * 10 + 5;
                starsHTML += `<div class="shooting-star" style="top:${top}%;animation-delay:${delay}s"></div>`;
            }
            container.innerHTML = starsHTML;
        }
    },

    /**
     * Update the main background element
     */
    _updateBackground(resolvedTheme) {
        const bg = document.getElementById('app-background');
        if (!bg) return;
        // Remove old theme classes
        bg.className = 'app-background-el';
        bg.classList.add(`bg-${resolvedTheme}`);

        // Apply theme to overlay pages (search, settings, side menu)
        document.querySelectorAll('.themed-overlay-bg').forEach(el => {
            el.className = el.className.replace(/overlay-bg-\w+/g, '');
            el.classList.add(`overlay-bg-${resolvedTheme}`);
            el.classList.add('themed-overlay-bg');
        });
        document.querySelectorAll('.side-menu-bg').forEach(el => {
            el.className = el.className.replace(/overlay-bg-\w+/g, '');
            el.classList.add(`overlay-bg-${resolvedTheme}`);
        });
    },

    /**
     * Get list of all available themes for settings UI
     */
    getAvailableThemes() {
        return Object.entries(THEMES).map(([key, val]) => ({
            id: key,
            ...val,
            active: this.currentTheme === key,
        }));
    },

    /**
     * Get current theme key
     */
    getTheme() {
        return this.currentTheme;
    },

    /**
     * Check if dark mode is enabled
     */
    isDark() {
        const darkThemes = ['celestial', 'aurora', 'ocean'];
        const resolved = this.currentTheme === 'auto' ? this._getAutoTheme() : this.currentTheme;
        return darkThemes.includes(resolved);
    }
};

export default theme;
