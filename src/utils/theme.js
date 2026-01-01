// Theme management utilities
export const theme = {
    /**
     * Initialize theme from saved preference
   */
    init() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        this.setTheme(savedTheme);
    },

    /**
     * Set theme (light or dark)
     */
    setTheme(themeName) {
        if (themeName === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }

        localStorage.setItem('theme', themeName);

        // Update meta theme-color
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            metaThemeColor.setAttribute('content', themeName === 'dark' ? '#0f1419' : '#0066ff');
        }
    },

    /**
     * Toggle between light and dark theme
     */
    toggle() {
        const currentTheme = this.getTheme();
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
        return newTheme;
    },

    /**
     * Get current theme
     */
    getTheme() {
        return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    },

    /**
     * Check if dark mode is enabled
     */
    isDark() {
        return this.getTheme() === 'dark';
    }
};

export default theme;
