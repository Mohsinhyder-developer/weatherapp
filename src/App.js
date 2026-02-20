import weatherService from './services/weather.service.js';
import locationService from './services/location.service.js';
import storageService from './services/storage.service.js';

import astronomyService from './services/astronomy.service.js';
import weatherCharts from './utils/charts.js';
import { units } from './utils/units.js';
import { formatters } from './utils/formatters.js';
import theme, { THEMES } from './utils/theme.js';

class App {
  constructor() {
    this.currentUser = null;
    this.currentWeather = null;
    this.currentLocation = null;
    this.favorites = [];
    this.preferences = { units: 'metric', theme: 'twilight' };
    this.astronomyData = null;
    this.charts = { temperature: null, precipitation: null };
  }

  async init() {
    // Show simple loading state to prevent flash of auth
    document.getElementById('app').innerHTML = `
      <div class="h-screen w-full flex flex-col items-center justify-center overflow-hidden relative">
         <div id="app-background" class="app-background-el"></div>
         <div class="relative z-10 flex flex-col items-center text-app">
            <div class="w-20 h-20 mb-6 relative">
               <div class="absolute inset-0 border-4 border-white/20 rounded-full animate-ping"></div>
               <div class="absolute inset-0 border-4 border-white/80 border-t-transparent rounded-full animate-spin"></div>
               <ion-icon name="cloudy-night" class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-4xl text-white"></ion-icon>
            </div>
            <div class="text-xl font-bold tracking-widest uppercase animate-pulse text-white">Weather App</div>
            <div class="text-xs text-white/60 mt-2 tracking-wide">Loading your forecast...</div>
         </div>
      </div>
    `;

    // Load immediately
    this.showWeatherApp();

    await this.loadPreferences();
  }

  async loadPreferences() {
    this.preferences.units = await storageService.getPreference('units', 'metric');
    this.preferences.theme = await storageService.getPreference('theme', 'twilight');
    theme.setTheme(this.preferences.theme); // Apply theme
    this.favorites = await storageService.getAllFavorites();
  }

  async loadUserPreferences() {
    await this.loadPreferences();
  }

  // --- HTML TEMPLATES ---



  getWeatherAppHTML() {
    return `
      <div id="app-background" class="app-background-el"></div>
      
      <!-- Mobile Side Menu Overlay -->
      <div id="side-menu-overlay" class="side-menu-overlay"></div>
      
      <!-- Side Menu (mobile drawer) -->
      <nav id="side-menu" class="side-menu">
        <div class="side-menu-bg"></div>
        <div class="side-menu-content">
          <div class="side-menu-header">
            <div class="side-menu-avatar">
              <ion-icon name="cloudy-night" class="text-2xl text-white"></ion-icon>
            </div>
            <div>
              <div class="text-base font-bold text-white">Weather App</div>
              <div class="text-xs text-white/60">Your personal forecast</div>
            </div>
            <button id="btn-close-menu" class="ml-auto p-2 text-white/70 hover:text-white transition rounded-full hover:bg-white/10">
              <ion-icon name="close" class="text-xl"></ion-icon>
            </button>
          </div>
          <div class="side-menu-items">
            <button class="side-menu-item" id="menu-search">
              <ion-icon name="search" class="text-lg"></ion-icon>
              <span>Search Location</span>
            </button>
            <button class="side-menu-item" id="menu-settings">
              <ion-icon name="settings-outline" class="text-lg"></ion-icon>
              <span>Settings</span>
            </button>
            <button class="side-menu-item" id="menu-refresh">
              <ion-icon name="locate" class="text-lg"></ion-icon>
              <span>Update Location</span>
            </button>
          </div>
          <div class="side-menu-footer">
            <div class="text-[10px] text-white/40 uppercase tracking-widest">Version 3.0.0</div>
          </div>
        </div>
      </nav>
      
      <ion-page id="main-page">
        <ion-header class="ion-no-border">
          <ion-toolbar>
             <ion-buttons slot="start">
               <!-- Mobile: hamburger menu -->
               <ion-button id="btn-menu-open" class="header-btn mobile-only" fill="clear">
                 <ion-icon name="menu-outline"></ion-icon>
               </ion-button>
               <!-- Desktop: settings button -->
               <ion-button id="btn-settings" class="header-btn desktop-only" fill="clear">
                 <ion-icon name="settings-outline"></ion-icon>
               </ion-button>
             </ion-buttons>
             <ion-title class="text-center" id="header-location">Getting your location…</ion-title>
             <ion-buttons slot="end">
               <ion-button id="btn-search-open" class="header-btn desktop-only" fill="clear">
                 <ion-icon name="search"></ion-icon>
               </ion-button>
             </ion-buttons>
          </ion-toolbar>
        </ion-header>

        <ion-content class="single-page-content">
          <div id="weather-alerts"></div>

          <div class="single-page-inner">
            <div id="hero-weather" class="hero-compact flex flex-col items-center justify-center py-4 px-4 text-center relative">
               <div class="text-white/90">Loading Weather...</div>
            </div>

            <div id="weather-details-content" class="single-page-details">
            </div>
          </div>
        </ion-content>
      </ion-page>
    `;
  }

  getSearchPageHTML() {
    return `
      <div id="search-page" class="search-overlay fixed inset-0 z-50 translate-x-full flex flex-col md:items-center md:justify-center md:bg-black/50 md:backdrop-blur-sm">
        <div class="search-overlay-inner themed-overlay-bg w-full h-full md:max-w-lg md:max-h-[85vh] md:rounded-2xl md:shadow-2xl md:overflow-hidden flex flex-col md:border border-white/15">
        <!-- Header -->
        <div class="p-4 pt-12 md:pt-4 border-b border-white/10 flex items-center gap-4 shrink-0">
           <button id="btn-close-search" class="overlay-icon-btn p-2 -ml-2 text-white/80 hover:text-white transition rounded-full hover:bg-white/10">
              <ion-icon name="arrow-back" class="text-2xl"></ion-icon>
           </button>
           <div class="flex-1 relative">
              <input type="text" id="search-input" placeholder="Search City or Country" 
                     class="w-full bg-white/10 text-white p-3 pl-10 rounded-xl border border-white/15 focus:border-white/40 focus:bg-white/15 transition outline-none placeholder:text-white/50 backdrop-blur">
              <ion-icon name="search" class="absolute left-3 top-1/2 -translate-y-1/2 text-white/50"></ion-icon>
              <div id="search-loader" class="hidden absolute right-3 top-1/2 -translate-y-1/2">
                 <div class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
              </div>
           </div>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto search-scroll p-4 text-white">
           
           <!-- Current Location Button -->
           <button type="button" id="btn-use-location" class="w-full mb-6 flex items-center gap-3 p-4 bg-white/10 hover:bg-white/20 border border-white/15 rounded-2xl transition group backdrop-blur-sm">
              <div class="p-2.5 bg-white/20 rounded-xl text-white group-hover:scale-110 transition-transform">
                 <ion-icon name="navigate" class="text-xl"></ion-icon>
              </div>
              <div class="text-left">
                 <div class="font-bold text-white">Use Current Location</div>
                 <div class="text-xs text-white/70">Get weather for your exact position</div>
              </div>
              <ion-icon name="chevron-forward" class="text-white/40 ml-auto text-lg"></ion-icon>
           </button>

           <!-- Recent/Favorites Section -->
           <div id="favorites-section">
              <h3 class="section-label px-1 mb-3">Saved Locations</h3>
              <div id="favorites-list" class="space-y-2 mb-8"></div>
           </div>

           <!-- Results Section -->
           <div id="results-section">
              <h3 class="section-label px-1 mb-3">Search Results</h3>
              <div id="search-results-list" class="space-y-2 pb-20"></div>
           </div>
        </div>
        </div>
      </div>
    `;
  }

  getSettingsPageHTML() {
    const themes = theme.getAvailableThemes();
    return `
      <div id="settings-page" class="settings-overlay fixed inset-0 z-50 translate-x-full flex flex-col transition-transform duration-300 md:items-center md:justify-center md:bg-black/50 md:backdrop-blur-sm">
        <div class="settings-overlay-inner themed-overlay-bg w-full h-full md:max-w-lg md:max-h-[85vh] md:rounded-2xl md:shadow-2xl md:overflow-hidden flex flex-col md:border border-white/15 text-white">
        <!-- Header -->
        <div class="p-4 pt-12 md:pt-4 border-b border-white/10 flex items-center justify-between shrink-0">
           <h2 class="text-xl font-bold text-white">Settings</h2>
           <button id="btn-close-settings" class="overlay-icon-btn px-4 py-2 text-white/90 hover:text-white transition bg-white/10 hover:bg-white/20 rounded-full border border-white/15">
              <span class="text-sm font-bold uppercase tracking-wide">Done</span>
           </button>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto p-6 space-y-8">
            
            <!-- Theme Section -->
            <div class="space-y-4">
                <h3 class="section-label pl-2">Theme</h3>
                <div id="theme-grid" class="grid grid-cols-3 gap-3">
                    ${themes.map(t => `
                        <button class="theme-pick-btn group relative flex items-center justify-center p-3 rounded-2xl border transition-all duration-300 ${t.active ? 'bg-white/25 border-white/50 ring-2 ring-white/30' : 'bg-white/8 border-white/15 hover:bg-white/15 hover:border-white/30'}"
                                data-theme="${t.id}">
                            <span class="text-xs font-semibold text-white/90 text-center leading-tight">${t.name}</span>
                            ${t.active ? '<div class="absolute top-1.5 right-1.5 w-2 h-2 bg-white rounded-full shadow-lg shadow-white/50"></div>' : ''}
                        </button>
                    `).join('')}
                </div>
            </div>

            <!-- Units Section -->
            <div class="space-y-4">
                <h3 class="section-label pl-2">Display</h3>
                <div class="card-light p-1 rounded-2xl flex relative">
                     <div class="w-1/2 h-full absolute top-0 left-0 bg-white/25 rounded-xl transition-all duration-300" id="unit-indicator"></div>
                     <button class="flex-1 py-3 text-center z-10 font-medium text-white transition rounded-xl" id="btn-metric">Metric (°C)</button>
                     <button class="flex-1 py-3 text-center z-10 font-medium text-white/80 transition rounded-xl" id="btn-imperial">Imperial (°F)</button>
                </div>
            </div>

            <!-- Notifications Section -->
             <div class="space-y-4">
                <h3 class="section-label pl-2">Notifications</h3>
                <div class="card-light p-4 rounded-2xl flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <div class="p-2.5 rounded-xl bg-white/15 text-white">
                           <ion-icon name="notifications"></ion-icon>
                        </div>
                        <span class="font-medium text-white">Severe Weather Alerts</span>
                    </div>
                     <ion-toggle id="toggle-notifications" checked></ion-toggle>
                </div>
            </div>

             <!-- Data Section -->
            <div class="space-y-4">
                <h3 class="section-label pl-2">Data & Storage</h3>
                 <button id="btn-clear-cache" class="w-full card-light p-4 rounded-2xl flex items-center justify-between group hover:bg-white/15 transition border border-white/10">
                    <div class="flex items-center gap-3">
                        <div class="p-2.5 rounded-xl bg-white/15 text-white">
                           <ion-icon name="trash"></ion-icon>
                        </div>
                        <span class="font-medium text-white">Clear Cache & Reset</span>
                    </div>
                    <ion-icon name="chevron-forward" class="text-white/50"></ion-icon>
                </button>
            </div>

            <!-- About Section -->
            <div class="pt-8 text-center pb-8">
                 <div class="w-16 h-16 card-light mx-auto mb-4 rounded-2xl flex items-center justify-center">
                    <ion-icon name="cloudy-night" class="text-3xl text-white"></ion-icon>
                 </div>
                 <h4 class="text-lg font-bold text-white mb-1">Weather App</h4>
                 <div class="text-white/70 text-sm">Version 3.0.0</div>
                 <div class="text-white/50 text-xs mt-4">Designed with ❤️ using Ionic & Tailwind</div>
            </div>

        </div>
        </div>
      </div>
    `;
  }

  getModalsHTML() {
    return ``;
  }

  // --- LISTENERS ---

  attachAuthListeners() {
    const errorDiv = document.getElementById('auth-error');
    const showError = (msg) => { errorDiv.innerText = msg; errorDiv.classList.remove('hidden'); };

    document.getElementById('btn-signin')?.addEventListener('click', async () => {
      const email = document.getElementById('auth-email').value;
      const password = document.getElementById('auth-password').value;
      const res = await authService.signIn(email, password);
      if (!res.success) showError(res.error);
    });

    document.getElementById('btn-signup')?.addEventListener('click', async () => {
      const email = document.getElementById('auth-email').value;
      const password = document.getElementById('auth-password').value;
      const res = await authService.signUp(email, password);
      if (!res.success) showError(res.error);
    });

    document.getElementById('btn-google')?.addEventListener('click', async () => {
      const res = await authService.signInWithGoogle();
      if (!res.success) showError(res.error);
    });
  }

  attachWeatherListeners() {
    const searchInput = document.getElementById('search-input');
    const searchPage = document.getElementById('search-page');
    const settingsModal = document.getElementById('settings-modal');
    const resultsList = document.getElementById('search-results-list');
    const loader = document.getElementById('search-loader');
    const sideMenu = document.getElementById('side-menu');
    const sideMenuOverlay = document.getElementById('side-menu-overlay');

    // --- Side Menu (Mobile) ---
    const openMenu = () => {
      sideMenu?.classList.add('open');
      sideMenuOverlay?.classList.add('open');
      document.body.style.overflow = 'hidden';
    };
    const closeMenu = () => {
      sideMenu?.classList.remove('open');
      sideMenuOverlay?.classList.remove('open');
      document.body.style.overflow = '';
    };

    document.getElementById('btn-menu-open')?.addEventListener('click', openMenu);
    document.getElementById('btn-close-menu')?.addEventListener('click', closeMenu);
    sideMenuOverlay?.addEventListener('click', closeMenu);

    // Menu item: open search
    document.getElementById('menu-search')?.addEventListener('click', () => {
      closeMenu();
      setTimeout(() => {
        searchPage.classList.remove('translate-x-full');
        searchPage.classList.add('translate-x-0');
        setTimeout(() => searchInput.focus(), 300);
        this.renderFavoritesList();
      }, 250);
    });

    // Menu item: open settings
    document.getElementById('menu-settings')?.addEventListener('click', () => {
      closeMenu();
      const settingsPageEl = document.getElementById('settings-page');
      setTimeout(() => {
        settingsPageEl.classList.remove('translate-x-full');
        settingsPageEl.classList.add('translate-x-0');
      }, 250);
    });

    // Menu item: refresh location
    document.getElementById('menu-refresh')?.addEventListener('click', async () => {
      closeMenu();
      const hero = document.getElementById('hero-weather');
      const prevHtml = hero?.innerHTML;
      if (hero) hero.innerHTML = '<div class="text-white/90">Getting your location…</div>';
      try {
        const loc = await locationService.getFreshLocation();
        this.currentLocation = { lat: loc.lat, lon: loc.lon };
        await this.loadWeather(false);
      } catch (err) {
        console.error(err);
        if (hero && prevHtml) hero.innerHTML = prevHtml;
      }
    });

    // OPEN Search Page (desktop header button)
    document.getElementById('btn-search-open')?.addEventListener('click', () => {
      searchPage.classList.remove('translate-x-full');
      searchPage.classList.add('translate-x-0');
      setTimeout(() => searchInput.focus(), 300);
      this.renderFavoritesList();
    });

    // CLOSE Search Page (button or backdrop click on desktop)
    const closeSearch = () => {
      searchPage.classList.remove('translate-x-0');
      searchPage.classList.add('translate-x-full');
    };
    document.getElementById('btn-close-search')?.addEventListener('click', closeSearch);
    searchPage?.addEventListener('click', (e) => {
      if (e.target === searchPage) closeSearch();
    });

    // Use Current Location – get fresh GPS only, then load weather (no fallback to London)
    searchPage.addEventListener('click', async (e) => {
      const btn = e.target?.closest?.('#btn-use-location');
      if (!btn) return;
      e.preventDefault();
      e.stopPropagation();
      searchPage.classList.remove('translate-x-0');
      searchPage.classList.add('translate-x-full');
      const hero = document.getElementById('hero-weather');
      const prevHtml = hero?.innerHTML;
      if (hero) hero.innerHTML = '<div class="text-white/90">Getting your location…</div>';
      try {
        const loc = await locationService.getFreshLocation();
        this.currentLocation = { lat: loc.lat, lon: loc.lon };
        await this.loadWeather(false);
      } catch (err) {
        console.error(err);
        if (hero && prevHtml) hero.innerHTML = prevHtml;
        const lower = (err?.message || '').toLowerCase();
        const msg = lower.includes('permission') || lower.includes('denied')
          ? 'Location access was denied. Please allow location in your browser or device settings and try again.'
          : lower.includes('timeout') || lower.includes('unavailable')
            ? 'Could not get your location. Check that location/GPS is on and try again.'
            : 'Could not get your location. ' + (err?.message || '');
        alert(msg);
      }
    });

    // OPEN Settings Page
    const settingsPageEl = document.getElementById('settings-page');
    document.getElementById('btn-settings')?.addEventListener('click', () => {
      settingsPageEl.classList.remove('translate-x-full');
      settingsPageEl.classList.add('translate-x-0');
    });

    // CLOSE Settings Page (button or backdrop click on desktop)
    const closeSettings = () => {
      settingsPageEl.classList.remove('translate-x-0');
      settingsPageEl.classList.add('translate-x-full');
    };
    document.getElementById('btn-close-settings')?.addEventListener('click', closeSettings);
    settingsPageEl?.addEventListener('click', (e) => {
      if (e.target === settingsPageEl) closeSettings();
    });

    // Dynamic Background Toggle (keeps same single color either way)
    // — REMOVED: replaced by multi-theme system
    
    // Theme Picker (grid of theme buttons)
    document.getElementById('theme-grid')?.addEventListener('click', async (e) => {
      const btn = e.target.closest('.theme-pick-btn');
      if (!btn) return;
      const newTheme = btn.dataset.theme;
      if (!newTheme) return;
      
      this.preferences.theme = newTheme;
      theme.setTheme(newTheme);
      await storageService.savePreference('theme', newTheme);
      
      // Update active states in the grid
      document.querySelectorAll('.theme-pick-btn').forEach(b => {
        const isActive = b.dataset.theme === newTheme;
        b.classList.toggle('bg-white/25', isActive);
        b.classList.toggle('border-white/50', isActive);
        b.classList.toggle('ring-2', isActive);
        b.classList.toggle('ring-white/30', isActive);
        b.classList.toggle('bg-white/8', !isActive);
        b.classList.toggle('border-white/15', !isActive);
        
        // Add/remove active dot
        const dot = b.querySelector('.theme-active-dot');
        if (isActive && !dot) {
          const d = document.createElement('div');
          d.className = 'theme-active-dot absolute top-1.5 right-1.5 w-2 h-2 bg-white rounded-full shadow-lg shadow-white/50';
          b.appendChild(d);
        } else if (!isActive && dot) {
          dot.remove();
        }
      });
    });

    // Notifications Toggle
    document.getElementById('toggle-notifications')?.addEventListener('ionChange', (e) => {
      if (e.detail.checked) {
        const toast = document.createElement('ion-toast');
        toast.message = 'Severe weather alerts enabled';
        toast.duration = 2000;
        toast.position = 'top';
        toast.color = 'success';
        document.body.appendChild(toast);
        toast.present();
      }
    });

    document.getElementById('unit-segment')?.addEventListener('ionChange', async (e) => {
      const newUnit = e.detail.value;
      if (newUnit !== this.preferences.units) {
        this.preferences.units = newUnit;
        await storageService.savePreference('units', newUnit);
        this.loadWeather();
      }
    });

    // Unit toggle buttons (Metric / Imperial)
    const unitIndicator = document.getElementById('unit-indicator');
    const btnMetric = document.getElementById('btn-metric');
    const btnImperial = document.getElementById('btn-imperial');

    const setUnitUI = (unit) => {
      if (unitIndicator) {
        unitIndicator.style.transform = unit === 'imperial' ? 'translateX(100%)' : 'translateX(0)';
      }
      if (btnMetric) {
        btnMetric.classList.toggle('text-white', unit === 'metric');
        btnMetric.classList.toggle('text-white/60', unit !== 'metric');
      }
      if (btnImperial) {
        btnImperial.classList.toggle('text-white', unit === 'imperial');
        btnImperial.classList.toggle('text-white/60', unit !== 'imperial');
      }
    };
    setUnitUI(this.preferences.units);

    btnMetric?.addEventListener('click', async () => {
      if (this.preferences.units !== 'metric') {
        this.preferences.units = 'metric';
        setUnitUI('metric');
        await storageService.savePreference('units', 'metric');
        this.loadWeather();
      }
    });
    btnImperial?.addEventListener('click', async () => {
      if (this.preferences.units !== 'imperial') {
        this.preferences.units = 'imperial';
        setUnitUI('imperial');
        await storageService.savePreference('units', 'imperial');
        this.loadWeather();
      }
    });

    document.getElementById('theme-segment')?.addEventListener('ionChange', async (e) => {
      const newTheme = e.detail.value;
      this.preferences.theme = newTheme;
      theme.setTheme(newTheme);
      await storageService.savePreference('theme', newTheme);
    });

    document.getElementById('btn-clear-cache')?.addEventListener('click', async () => {
      if (confirm('Are you sure? This will remove all favorites and cached data.')) {
        await storageService.clearAll();
        window.location.reload();
      }
    });

    let debounceTimer;
    searchInput?.addEventListener('input', (e) => {
      const query = e.target.value;

      if (!query || query.length < 3) {
        resultsList.innerHTML = '';
        loader.classList.add('hidden');
        return;
      }

      loader.classList.remove('hidden');
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(async () => {
        try {
          const cities = await weatherService.searchCities(query);
          loader.classList.add('hidden');

          if (cities.length === 0) {
            resultsList.innerHTML = '<div class="text-white/80 p-4 text-center">No cities found</div>';
            return;
          }

          resultsList.innerHTML = cities.map(city => `
  <div class="p-4 bg-white/10 rounded-2xl mb-2 flex justify-between items-center cursor-pointer data-city-item hover:bg-white/20 transition border border-white/10"
data-lat="${city.lat}" data-lon="${city.lon}" data-name="${city.name}" data-country="${city.country}">
                   <div>
                     <div class="font-bold text-white text-lg">${city.name}</div>
                     <div class="text-sm text-white/80 flex items-center gap-1">
                        <ion-icon name="location-outline"></ion-icon> 
                        ${city.state ? city.state + ', ' : ''}${city.country}
                     </div>
                   </div>
                   <ion-icon name="chevron-forward" class="text-white/80"></ion-icon>
                </div>
  `).join('');

          // Add click listeners to new items
          document.querySelectorAll('.data-city-item').forEach(item => {
            item.addEventListener('click', () => {
              searchPage.classList.remove('translate-x-0');
              searchPage.classList.add('translate-x-full');

              this.selectCity({
                lat: item.dataset.lat,
                lon: item.dataset.lon,
                name: item.dataset.name,
                country: item.dataset.country
              });

              // Clear search
              searchInput.value = '';
              resultsList.innerHTML = '';
            });
          });

        } catch (err) {
          console.error(err);
          loader.classList.add('hidden');
          resultsList.innerHTML = '<div class="text-red-400 p-4">Error searching</div>';
        }
      }, 500); // 500ms debounce
    });
  }

  // --- LOGIC ---

  showAuthScreen() {
    document.getElementById('app').innerHTML = this.getAuthHTML();
    this.attachAuthListeners();
  }

  showWeatherApp() {
    const app = document.getElementById('app');
    // Insert main page
    app.innerHTML = this.getWeatherAppHTML();
    // Append Search and Settings Pages
    app.insertAdjacentHTML('beforeend', this.getSearchPageHTML());
    app.insertAdjacentHTML('beforeend', this.getSettingsPageHTML());

    this.attachWeatherListeners();
    this.attachAuthListeners();
    this.renderFavoritesList();
    this.loadWeather();
  }

  async selectCity(city) {
    this.currentLocation = city;
    await this.loadWeather(false);
  }

  async toggleFavorite() {
    if (!this.currentLocation) return;

    const isFav = await storageService.isFavorite(this.currentLocation);
    if (isFav) {
      await storageService.removeFavorite(this.currentLocation);
    } else {
      await storageService.saveFavorite(this.currentLocation);
    }
    this.favorites = await storageService.getAllFavorites();
    this.renderFavoritesList();
    this.updateFavoriteButtonState();
  }

  updateFavoriteButtonState() {
    const btn = document.getElementById('btn-favorite');
    if (!btn || !this.currentLocation) return;

    const isFav = this.favorites.some(f => String(f.lat) === String(this.currentLocation.lat) && String(f.lon) === String(this.currentLocation.lon));
    const icon = btn.querySelector('ion-icon');
    if (icon) {
      if (isFav) {
        icon.setAttribute('name', 'heart');
        icon.style.color = '#fff';
      } else {
        icon.setAttribute('name', 'heart-outline');
        icon.style.color = '';
      }
    }
  }

  renderFavoritesList() {
    const list = document.getElementById('favorites-list');
    if (!list) return;

    if (this.favorites.length === 0) {
      list.innerHTML = '<div class="text-xs text-white/70 text-center py-4">No saved locations yet</div>';
      return;
    }

    list.innerHTML = this.favorites.map(city => `
  <div class="p-3 bg-white/10 rounded-2xl flex justify-between items-center cursor-pointer fav-item hover:bg-white/20 transition border border-white/10"
data-lat="${city.lat}" data-lon="${city.lon}">
             <span class="font-medium text-white">${city.name}</span>
             <button class="btn-delete-fav p-2 text-white/80 hover:text-white transition">
                <ion-icon name="trash-outline"></ion-icon>
             </button>
        </div>
  `).join('');

    list.querySelectorAll('.fav-item').forEach((item, index) => {
      item.querySelector('.btn-delete-fav').addEventListener('click', (e) => {
        e.stopPropagation();
        this.removeFavoriteAtIndex(index);
      });

      item.addEventListener('click', () => {
        const searchPage = document.getElementById('search-page');
        searchPage.classList.remove('translate-x-0');
        searchPage.classList.add('translate-x-full');
        this.selectCity(this.favorites[index]);
      });
    });
  }

  async removeFavoriteAtIndex(index) {
    const item = this.favorites[index];
    await storageService.removeFavorite(item);
    this.favorites = await storageService.getAllFavorites();
    this.renderFavoritesList();
    this.updateFavoriteButtonState();
  }

  async loadWeather(forceGPS = false) {
    try {
      // 1. Location Strategy
      let loc = this.currentLocation;
      if (forceGPS || !loc) {
        loc = await locationService.getLocationWithFallback();
      }
      this.currentLocation = loc;

      // 2. Fetch Data
      const weather = await weatherService.getCurrentWeatherByCoords(loc.lat, loc.lon, this.preferences.units);

      // Update currentLocation with resolved name from API (important for GPS & Favorites)
      this.currentLocation = {
        lat: loc.lat,
        lon: loc.lon,
        name: weather.cityName,
        country: weather.country
      };

      const hourly = await weatherService.getHourlyForecast(loc.lat, loc.lon, this.preferences.units);
      const daily = await weatherService.getDailyForecast(loc.lat, loc.lon, this.preferences.units);
      // Fail-safe API calls
      let airQuality = null;
      let uv = null;
      try { airQuality = await weatherService.getAirQuality(loc.lat, loc.lon); } catch (e) { console.warn('AQI Error', e); }
      try { uv = await weatherService.getUVIndex(loc.lat, loc.lon); } catch (e) { console.warn('UV Error', e); }

      // Get astronomy data
      this.astronomyData = astronomyService.getSunMoonData(loc.lat, loc.lon);

      this.currentWeather = { current: weather, hourly, daily, airQuality, uv };

      // 3. Display
      this.displayWeather();

    } catch (err) {
      console.error(err);
      alert("Error loading weather: " + err.message);
    }
  }

  displayWeather() {
    if (!this.currentWeather) return;
    const { current, hourly, daily, airQuality, uv } = this.currentWeather;

    // Update Header
    const header = document.getElementById('header-location');
    if (header) {
      header.innerText = `${current.cityName}, ${current.country}`.toUpperCase();
      header.setAttribute('title', 'Tap search to change location');
    }

    // ——— HERO SECTION ———
    const hero = document.getElementById('hero-weather');
    if (hero) {
      hero.innerHTML = `
        <div class="absolute top-0 right-0 p-2 fade-in" style="animation-delay:0.1s">
          <button id="btn-favorite" class="min-h-[44px] min-w-[44px] flex items-center justify-center text-2xl text-white/80 hover:text-white transition-colors rounded-full hover:bg-white/10" aria-label="Favorite">
            <ion-icon name="heart-outline"></ion-icon>
          </button>
        </div>

        <div class="mb-3 text-[10px] sm:text-xs font-bold uppercase tracking-[0.18em] text-white/85 bg-white/15 backdrop-blur px-4 py-1.5 rounded-full inline-block fade-in border border-white/10">
          ${formatters.formatShortDay(new Date())} &bull; ${formatters.formatTime(new Date())}
        </div>

        <div class="flex items-center justify-center gap-3 sm:gap-4 fade-in" style="animation-delay:0.2s">
          <img src="${weatherService.getIconUrl(current.icon)}" class="hero-weather-icon animate-float" alt="${current.description}" onerror="this.style.display='none'" />
          <div class="text-left">
            <div class="hero-temp">${Math.round(current.temp)}°</div>
            <div class="text-white/85 text-[13px] sm:text-sm capitalize font-medium">${current.description}</div>
          </div>
        </div>

        <div class="flex gap-5 text-[13px] font-medium text-white/85 fade-in mt-1.5" style="animation-delay:0.3s">
          <span class="flex items-center gap-1"><ion-icon name="arrow-up" class="text-white/60 text-xs"></ion-icon> ${Math.round(current.tempMax)}°</span>
          <span class="flex items-center gap-1"><ion-icon name="arrow-down" class="text-white/60 text-xs"></ion-icon> ${Math.round(current.tempMin)}°</span>
        </div>

        <button id="btn-refresh-loc" class="mt-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/85 hover:text-white bg-white/12 hover:bg-white/20 border border-white/15 px-5 py-2.5 rounded-full transition fade-in min-h-[38px]" style="animation-delay:0.4s">
          <ion-icon name="locate" class="text-sm"></ion-icon> Update Location
        </button>
      `;

      document.getElementById('btn-favorite')?.addEventListener('click', () => this.toggleFavorite());
      document.getElementById('btn-refresh-loc')?.addEventListener('click', () => this.loadWeather(true));
      this.updateFavoriteButtonState();
    }

    // ——— DETAILS SECTION ———
    const details = document.getElementById('weather-details-content');
    if (details) {
      details.innerHTML = `

        <!-- ★ HOURLY FORECAST ★ -->
        <section class="card-light p-4 fade-in" style="animation-delay:0.5s">
          <h2 class="section-label">Hourly Forecast</h2>
          <div class="hourly-scroll">
            ${(hourly || []).map((h, idx) => `
              <div class="hourly-item${idx === 0 ? ' hourly-active' : ''}">
                <span class="hourly-time">${formatters.formatTime(h.time)}</span>
                <img src="${weatherService.getIconUrl(h.icon)}" class="hourly-icon" alt="" onerror="this.style.display='none'">
                <span class="hourly-temp">${Math.round(h.temp)}°</span>
                <span class="hourly-rain"><ion-icon name="water" class="text-[9px] text-blue-300/90"></ion-icon> ${Math.round(h.pop * 100)}%</span>
              </div>
            `).join('')}
          </div>
        </section>

        <!-- ★ 7-DAY FORECAST ★ -->
        <section class="card-light p-4 fade-in" style="animation-delay:0.6s">
          <h2 class="section-label">7-Day Forecast</h2>
          <div class="daily-list">
            ${(daily || []).map((d, i) => `
              <div class="daily-row${i < (daily.length - 1) ? ' daily-row-border' : ''}">
                <span class="daily-day">${formatters.formatShortDay(d.date)}</span>
                <img src="${weatherService.getIconUrl(d.icon)}" class="daily-icon-img" alt="" onerror="this.style.display='none'">
                <span class="daily-min">${Math.round(d.tempMin)}°</span>
                <span class="daily-max">${Math.round(d.tempMax)}°</span>
              </div>
            `).join('')}
          </div>
        </section>

        <!-- ★ METRICS GRID — top row (3 cols) ★ -->
        <div class="grid grid-cols-3 gap-2.5 fade-in" style="animation-delay:0.7s">
          <div class="metric-card">
            <div class="metric-icon"><img src="${weatherService.getMetricIconUrl('wind')}" class="metric-icon-img" alt="wind"></div>
            <div class="metric-label">Wind</div>
            <div class="metric-value">${current.windSpeed}<span class="metric-unit"> km/h</span></div>
          </div>
          <div class="metric-card">
            <div class="metric-icon"><img src="${weatherService.getMetricIconUrl('humidity')}" class="metric-icon-img" alt="humidity"></div>
            <div class="metric-label">Humidity</div>
            <div class="metric-value">${current.humidity}<span class="metric-unit">%</span></div>
          </div>
          <div class="metric-card">
            <div class="metric-icon"><img src="${weatherService.getMetricIconUrl('thermometer')}" class="metric-icon-img" alt="feels like"></div>
            <div class="metric-label">Feels</div>
            <div class="metric-value">${Math.round(current.feelsLike)}°</div>
          </div>
        </div>

        <!-- ★ METRICS GRID — bottom row (3 cols) ★ -->
        <div class="grid grid-cols-3 gap-2.5 fade-in" style="animation-delay:0.75s">
          <div class="metric-card">
            <div class="metric-icon"><img src="${weatherService.getMetricIconUrl('mist')}" class="metric-icon-img" alt="visibility"></div>
            <div class="metric-label">Vis</div>
            <div class="metric-value">${(current.visibility / 1000).toFixed(1)}<span class="metric-unit"> km</span></div>
          </div>
          <div class="metric-card">
            <div class="metric-icon"><img src="${weatherService.getMetricIconUrl('uv-index')}" class="metric-icon-img" alt="uv"></div>
            <div class="metric-label">UV</div>
            <div class="metric-value">${uv !== null ? uv : '--'}</div>
          </div>
          <div class="metric-card">
            <div class="metric-icon"><img src="${weatherService.getMetricIconUrl('dust-wind')}" class="metric-icon-img" alt="air quality"></div>
            <div class="metric-label">AQI</div>
            <div class="metric-value metric-value-sm">${airQuality ? airQuality.aqiDescription : '--'}</div>
          </div>
        </div>

        <!-- ★ SUNRISE / SUNSET ★ -->
        <div class="card-light p-4 flex fade-in" style="animation-delay:0.8s">
          <div class="flex-1 text-center flex flex-col items-center">
            <img src="${weatherService.getMetricIconUrl('sunrise')}" class="sr-icon" alt="sunrise">
            <div class="sr-label">Sunrise</div>
            <div class="sr-value">${current.sunrise ? formatters.formatTime(current.sunrise) : '--'}</div>
          </div>
          <div class="sr-divider"></div>
          <div class="flex-1 text-center flex flex-col items-center">
            <img src="${weatherService.getMetricIconUrl('sunset')}" class="sr-icon" alt="sunset">
            <div class="sr-label">Sunset</div>
            <div class="sr-value">${current.sunset ? formatters.formatTime(current.sunset) : '--'}</div>
          </div>
        </div>
      `;
    }
  }

  renderCharts() {
    if (!this.currentWeather || !this.currentWeather.hourly) return;

    const tempCanvas = document.getElementById('temperature-chart');
    const precipCanvas = document.getElementById('precipitation-chart');

    if (tempCanvas && this.currentWeather.hourly) {
      this.charts.temperature = weatherCharts.createTemperatureChart(
        tempCanvas,
        this.currentWeather.hourly
      );
    }

    if (precipCanvas && this.currentWeather.hourly) {
      this.charts.precipitation = weatherCharts.createPrecipitationChart(
        precipCanvas,
        this.currentWeather.hourly
      );
    }
  }
}

export default App;
