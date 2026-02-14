import weatherService from './services/weather.service.js';
import locationService from './services/location.service.js';
import storageService from './services/storage.service.js';

import astronomyService from './services/astronomy.service.js';
import weatherCharts from './utils/charts.js';
import { units } from './utils/units.js';
import { formatters } from './utils/formatters.js';
import theme from './utils/theme.js';

class App {
  constructor() {
    this.currentUser = null;
    this.currentWeather = null;
    this.currentLocation = null;
    this.favorites = [];
    this.preferences = { units: 'metric', theme: 'light' };
    this.astronomyData = null;
    this.charts = { temperature: null, precipitation: null };
  }

  async init() {
    // Show simple loading state to prevent flash of auth
    document.getElementById('app').innerHTML = `
      <div class="h-screen w-full flex flex-col items-center justify-center bg-app overflow-hidden relative">
         <div class="relative z-10 flex flex-col items-center text-app">
            <div class="w-20 h-20 mb-6 relative">
               <div class="absolute inset-0 border-4 border-white/30 rounded-full animate-ping"></div>
               <div class="absolute inset-0 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
               <ion-icon name="cloudy-night" class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-4xl text-white"></ion-icon>
            </div>
            <div class="text-xl font-bold tracking-widest uppercase animate-pulse text-white">Weather App</div>
            <div class="text-xs text-white/80 mt-2 tracking-wide">Synkly Design</div>
         </div>
      </div>
    `;

    // Load immediately
    this.showWeatherApp();

    await this.loadPreferences();
  }

  async loadPreferences() {
    this.preferences.units = await storageService.getPreference('units', 'metric');
    this.preferences.theme = await storageService.getPreference('theme', 'light');
    theme.setTheme(this.preferences.theme); // Apply theme
    this.favorites = await storageService.getAllFavorites();
  }

  async loadUserPreferences() {
    await this.loadPreferences();
  }

  // --- HTML TEMPLATES ---



  getWeatherAppHTML() {
    return `
      <div id="app-background"></div>
      
      <ion-page id="main-page">
        <ion-header class="ion-no-border">
          <ion-toolbar>
             <ion-buttons slot="start">
               <ion-button id="btn-settings" class="header-btn header-btn-settings" fill="clear">
                 <ion-icon name="settings-outline"></ion-icon>
               </ion-button>
             </ion-buttons>
             <ion-title class="text-center" id="header-location">Getting your location…</ion-title>
             <ion-buttons slot="end">
               <ion-button id="btn-search-open" class="header-btn header-btn-search" fill="clear">
                 <ion-icon name="search"></ion-icon>
               </ion-button>
             </ion-buttons>
          </ion-toolbar>
        </ion-header>

        <ion-content class="single-page-content">
          <div id="weather-alerts"></div>

          <!-- Single page: hero + hourly + 7-day + metrics in one flow -->
          <div class="single-page-inner">
            <div id="hero-weather" class="hero-compact flex flex-col items-center justify-center py-4 px-4 text-center relative">
               <div class="text-white/90">Loading Weather...</div>
            </div>

            <div id="weather-details-content" class="single-page-details">
               <!-- Populate via JS: Hourly, 7-day, metrics -->
            </div>
          </div>
        </ion-content>
      </ion-page>
    `;
  }

  getSearchPageHTML() {
    return `
      <div id="search-page" class="search-overlay fixed inset-0 z-50 bg-app translate-x-full flex flex-col md:items-center md:justify-center md:bg-black/50 md:backdrop-blur-sm">
        <div class="search-overlay-inner w-full h-full md:max-w-lg md:max-h-[85vh] md:rounded-2xl md:shadow-2xl md:overflow-hidden flex flex-col bg-app md:border border-app">
        <!-- Header -->
        <div class="p-4 pt-12 md:pt-4 border-b border-app flex items-center gap-4 shrink-0">
           <button id="btn-close-search" class="p-2 -ml-2 text-white/80 hover:text-white transition">
              <ion-icon name="arrow-back" class="text-2xl"></ion-icon>
           </button>
           <div class="flex-1 relative">
              <input type="text" id="search-input" placeholder="Search City or Country" 
                     class="w-full bg-white/15 text-white p-3 pl-10 rounded-xl border border-app focus:border-white/50 transition outline-none placeholder:text-white/60">
              <ion-icon name="search" class="absolute left-3 top-1/2 -translate-y-1/2 text-white/60"></ion-icon>
              <div id="search-loader" class="hidden absolute right-3 top-1/2 -translate-y-1/2">
                 <div class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
              </div>
           </div>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto search-scroll p-4 text-white">
           
           <!-- Current Location Button -->
           <button type="button" id="btn-use-location" class="w-full mb-6 flex items-center gap-3 p-4 bg-white/15 hover:bg-white/25 border border-app rounded-xl transition group">
              <div class="p-2 bg-white/25 rounded-lg text-white group-hover:scale-110 transition-transform">
                 <ion-icon name="navigate" class="text-xl"></ion-icon>
              </div>
              <div class="text-left">
                 <div class="font-bold text-white">Use Current Location</div>
                 <div class="text-xs text-white/80">Get weather for your exact position</div>
              </div>
           </button>

           <!-- Recent/Favorites Section -->
           <div id="favorites-section">
              <h3 class="text-xs font-bold text-white/80 uppercase mb-3 tracking-wide px-1">Saved Locations</h3>
              <div id="favorites-list" class="space-y-2 mb-8"></div>
           </div>

           <!-- Results Section -->
           <div id="results-section">
              <h3 class="text-xs font-bold text-white/80 uppercase mb-3 tracking-wide px-1">Search Results</h3>
              <div id="search-results-list" class="space-y-2 pb-20"></div>
           </div>
        </div>
        </div>
      </div>
    `;
  }

  getSettingsPageHTML() {
    return `
      <div id="settings-page" class="settings-overlay fixed inset-0 z-50 bg-app translate-x-full flex flex-col transition-transform duration-300 md:items-center md:justify-center md:bg-black/50 md:backdrop-blur-sm">
        <div class="settings-overlay-inner w-full h-full md:max-w-lg md:max-h-[85vh] md:rounded-2xl md:shadow-2xl md:overflow-hidden flex flex-col md:border border-app bg-app text-white">
        <!-- Header -->
        <div class="p-4 pt-12 md:pt-4 border-b border-app flex items-center justify-between shrink-0">
           <h2 class="text-xl font-bold text-white">Settings</h2>
           <button id="btn-close-settings" class="p-2 -mr-2 text-white/80 hover:text-white transition bg-transparent border-0">
              <span class="text-sm font-bold uppercase tracking-wide">Done</span>
           </button>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto p-6 space-y-8">
            
            <!-- Units Section -->
            <div class="space-y-4">
                <h3 class="text-xs font-bold text-white/80 uppercase tracking-widest pl-2">Display</h3>
                <div class="card-light p-1 rounded-2xl flex relative">
                     <div class="w-1/2 h-full absolute top-0 left-0 bg-white/25 rounded-xl transition-all duration-300" id="unit-indicator"></div>
                     <button class="flex-1 py-3 text-center z-10 font-medium text-white transition rounded-xl" id="btn-metric">Metric (°C)</button>
                     <button class="flex-1 py-3 text-center z-10 font-medium text-white/80 transition rounded-xl" id="btn-imperial">Imperial (°F)</button>
                </div>

                <div class="card-light p-4 rounded-2xl flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <div class="p-2 rounded-lg bg-white/15 text-white">
                           <ion-icon name="color-palette"></ion-icon>
                        </div>
                        <span class="font-medium text-white">Dynamic Backgrounds</span>
                    </div>
                     <ion-toggle id="toggle-dynamic-bg" checked></ion-toggle>
                </div>
            </div>

            <!-- Notifications Section -->
             <div class="space-y-4">
                <h3 class="text-xs font-bold text-white/80 uppercase tracking-widest pl-2">Notifications</h3>
                <div class="card-light p-4 rounded-2xl flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <div class="p-2 rounded-lg bg-white/15 text-white">
                           <ion-icon name="notifications"></ion-icon>
                        </div>
                        <span class="font-medium text-white">Severe Weather Alerts</span>
                    </div>
                     <ion-toggle id="toggle-notifications" checked></ion-toggle>
                </div>
            </div>

             <!-- Data Section -->
            <div class="space-y-4">
                <h3 class="text-xs font-bold text-white/80 uppercase tracking-widest pl-2">Data & Storage</h3>
                 <button id="btn-clear-cache" class="w-full card-light p-4 rounded-2xl flex items-center justify-between group hover:bg-white/10 transition border border-app">
                    <div class="flex items-center gap-3">
                        <div class="p-2 rounded-lg bg-white/15 text-white">
                           <ion-icon name="trash"></ion-icon>
                        </div>
                        <span class="font-medium text-white">Clear Cache & Reset</span>
                    </div>
                    <ion-icon name="chevron-forward" class="text-white/80"></ion-icon>
                </button>
            </div>

            <!-- About Section -->
            <div class="pt-8 text-center">
                 <div class="w-16 h-16 bg-white/2 rounded-2xl mx-auto mb-4 flex items-center justify-center border border-app">
                    <ion-icon name="cloudy-night" class="text-3xl text-white"></ion-icon>
                 </div>
                 <h4 class="text-lg font-bold text-white mb-1">Weather App</h4>
                 <div class="text-white/80 text-sm">Version 2.0.0</div>
                 <div class="text-white/60 text-xs mt-4">Designed with ❤️ using Ionic & Tailwind</div>
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

    // OPEN Search Page
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
    document.getElementById('toggle-dynamic-bg')?.addEventListener('ionChange', (e) => {
      const bg = document.getElementById('app-background');
      bg.style.display = e.detail.checked ? 'block' : 'none';
      if (!e.detail.checked) document.getElementById('app').style.background = 'var(--app-color)';
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
  <div class="p-4 bg-white/15 rounded-xl mb-2 flex justify-between items-center cursor-pointer data-city-item hover:bg-white/25 transition border border-app"
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
  <div class="p-3 bg-white/15 rounded-xl flex justify-between items-center cursor-pointer fav-item hover:bg-white/25 transition border border-app"
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

    // Update Hero (compact for single page)
    const hero = document.getElementById('hero-weather');
    if (hero) {
      hero.innerHTML = `
  <div class="absolute top-0 right-0 p-2 fade-in" style="animation-delay: 0.1s">
    <button id="btn-favorite" class="min-h-[44px] min-w-[44px] flex items-center justify-center text-2xl text-white/90 hover:text-white transition-colors rounded-full" aria-label="Add to favorites">
      <ion-icon name="heart-outline"></ion-icon>
    </button>
           </div>
           <div class="mb-2 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-white/90 bg-white/15 px-3 py-1 rounded-full inline-block fade-in">
                ${formatters.formatShortDay(new Date())} • ${formatters.formatTime(new Date())}
           </div>
           <div class="relative flex items-center justify-center gap-3 sm:gap-4 fade-in" style="animation-delay: 0.2s">
             <img src="${weatherService.getIconUrl(current.icon)}" class="w-20 h-20 sm:w-24 sm:h-24 drop-shadow-lg animate-float" alt="${current.description}" onerror="this.src='https://openweathermap.org/img/wn/02d@4x.png'" />
             <div>
               <div class="text-4xl sm:text-5xl font-bold text-white">${Math.round(current.temp)}°</div>
               <div class="text-white/90 text-sm sm:text-base capitalize">${current.description}</div>
             </div>
           </div>
           <div class="flex gap-6 text-sm font-medium text-white/90 fade-in mt-1" style="animation-delay: 0.3s">
              <span class="flex items-center gap-1"><ion-icon name="arrow-up"></ion-icon> ${Math.round(current.tempMax)}°</span>
              <span class="flex items-center gap-1"><ion-icon name="arrow-down"></ion-icon> ${Math.round(current.tempMin)}°</span>
           </div>
           <button id="btn-refresh-loc" class="mt-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-white/90 hover:text-white bg-white/15 hover:bg-white/25 px-4 py-2.5 rounded-xl transition fade-in min-h-[40px]" style="animation-delay: 0.4s">
              <ion-icon name="locate"></ion-icon> Update Location
           </button>
`;

      const favBtn = document.getElementById('btn-favorite');
      if (favBtn) favBtn.addEventListener('click', () => this.toggleFavorite());

      const refreshBtn = document.getElementById('btn-refresh-loc');
      if (refreshBtn) refreshBtn.addEventListener('click', () => this.loadWeather(true));

      this.updateFavoriteButtonState();
    }

    // Update Details: Hourly first (main focus), then 7-day + metrics
    const details = document.getElementById('weather-details-content');
    if (details) {
      details.innerHTML = `
  <!-- Hourly Forecast -->
           <section class="card-light p-4 mb-4 fade-in text-white" style="animation-delay: 0.5s" aria-label="Hourly forecast">
              <h2 class="text-sm font-bold text-white/90 uppercase tracking-wider mb-3 pb-2 border-app border-b">Hourly Forecast</h2>
              <div class="flex gap-3 overflow-x-auto pb-1 no-scrollbar -webkit-overflow-scrolling-touch">
                 ${(hourly || []).map(h => `
                    <div class="flex flex-col items-center min-w-[52px] flex-shrink-0 py-1 rounded-lg hover:bg-white/10 transition">
                       <span class="text-[10px] text-white/80 mb-0.5">${formatters.formatTime(h.time)}</span>
                       <img src="${weatherService.getIconUrl(h.icon)}" class="w-8 h-8 mb-0.5" alt="">
                       <span class="font-bold text-sm text-white">${Math.round(h.temp)}°</span>
                       <span class="text-[9px] text-white/80 flex items-center gap-0.5 mt-0.5">
                           <ion-icon name="water" class="text-[10px]"></ion-icon> ${Math.round(h.pop * 100)}%
                       </span>
                    </div>
                 `).join('')}
              </div>
           </section>

           <!-- 7-Day -->
           <section class="card-light p-4 mb-4 fade-in text-white" style="animation-delay: 0.6s">
              <h2 class="text-sm font-bold text-white/90 uppercase tracking-wider mb-2 pb-2 border-app border-b">7-Day Forecast</h2>
              <div class="space-y-2">
                 ${(daily || []).map(d => `
                    <div class="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-white/10 transition">
                       <span class="w-14 font-medium text-white text-sm shrink-0">${formatters.formatShortDay(d.date)}</span>
                       <img src="${weatherService.getIconUrl(d.icon)}" class="w-6 h-6 shrink-0" alt="">
                       <span class="text-white/80 text-sm w-12 text-right">${Math.round(d.tempMin)}°</span>
                       <span class="font-semibold text-white text-sm w-10 text-right">${Math.round(d.tempMax)}°</span>
                    </div>
                 `).join('')}
              </div>
           </section>

           <!-- Metrics -->
  <div class="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-4 fade-in text-white" style="animation-delay: 0.7s">
    <div class="card-light p-3 text-center">
      <div class="text-[10px] text-white/80 uppercase flex items-center justify-center gap-1 mb-1"><ion-icon name="speedometer-outline" class="text-xs"></ion-icon> Wind</div>
      <div class="text-lg font-bold text-white">${current.windSpeed}<span class="text-xs font-normal text-white/80"> km/h</span></div>
    </div>
    <div class="card-light p-3 text-center">
      <div class="text-[10px] text-white/80 uppercase flex items-center justify-center gap-1 mb-1"><ion-icon name="water-outline" class="text-xs"></ion-icon> Humidity</div>
      <div class="text-lg font-bold text-white">${current.humidity}<span class="text-xs">%</span></div>
    </div>
    <div class="card-light p-3 text-center">
      <div class="text-[10px] text-white/80 uppercase flex items-center justify-center gap-1 mb-1"><ion-icon name="thermometer-outline" class="text-xs"></ion-icon> Feels</div>
      <div class="text-lg font-bold text-white">${Math.round(current.feelsLike)}°</div>
    </div>
    <div class="card-light p-3 text-center">
      <div class="text-[10px] text-white/80 uppercase flex items-center justify-center gap-1 mb-1"><ion-icon name="eye-outline" class="text-xs"></ion-icon> Vis</div>
      <div class="text-lg font-bold text-white">${(current.visibility / 1000).toFixed(1)}<span class="text-xs text-white/80"> km</span></div>
    </div>
    <div class="card-light p-3 text-center">
      <div class="text-[10px] text-white/80 uppercase flex items-center justify-center gap-1 mb-1"><ion-icon name="sunny-outline" class="text-xs"></ion-icon> UV</div>
      <div class="text-lg font-bold text-white">${uv !== null ? uv : '--'}</div>
    </div>
    <div class="card-light p-3 text-center">
      <div class="text-[10px] text-white/80 uppercase flex items-center justify-center gap-1 mb-1"><ion-icon name="flower-outline" class="text-xs"></ion-icon> AQI</div>
      <div class="text-sm font-bold text-white truncate">${airQuality ? airQuality.aqiDescription : '--'}</div>
    </div>
  </div>

  <div class="card-light p-4 mb-4 flex justify-between items-center text-white">
    <div class="text-center flex-1">
      <div class="text-xs font-bold text-white/90 uppercase tracking-wider mb-1">Sunrise</div>
      <div class="text-lg font-bold text-white">${current.sunrise ? formatters.formatTime(current.sunrise) : '--'}</div>
    </div>
    <div class="h-8 w-px bg-white/25 flex-shrink-0" aria-hidden="true"></div>
    <div class="text-center flex-1">
      <div class="text-xs font-bold text-white/90 uppercase tracking-wider mb-1">Sunset</div>
      <div class="text-lg font-bold text-white">${current.sunset ? formatters.formatTime(current.sunset) : '--'}</div>
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
