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
    this.map = null;
    this.astronomyData = null;
    this.charts = { temperature: null, precipitation: null };
  }

  async init() {
    // Show simple loading state to prevent flash of auth
    document.getElementById('app').innerHTML = `
      <div class="h-screen w-full flex flex-col items-center justify-center bg-slate-900 text-white overflow-hidden relative">
         <div class="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-purple-900/20 pointer-events-none"></div>
         <div class="relative z-10 flex flex-col items-center">
            <div class="w-20 h-20 mb-6 relative">
               <div class="absolute inset-0 border-4 border-blue-500/30 rounded-full animate-ping"></div>
               <div class="absolute inset-0 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
               <ion-icon name="cloudy-night" class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-4xl text-blue-300"></ion-icon>
            </div>
            <div class="text-xl font-bold tracking-widest uppercase animate-pulse">Weather App</div>
            <div class="text-xs text-blue-400 mt-2 tracking-wide">Synkly Design</div>
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
               <ion-button id="btn-settings"><ion-icon name="settings-outline"></ion-icon></ion-button>
             </ion-buttons>
             <ion-title class="text-center" id="header-location">LOCATING...</ion-title>
             <ion-buttons slot="end">
               <ion-button id="btn-search-open"><ion-icon name="search"></ion-icon></ion-button>
             </ion-buttons>
          </ion-toolbar>
        </ion-header>

        <ion-content>
          <!-- Weather Alerts -->
          <div id="weather-alerts"></div>

          <!-- Main Content Container -->
          <div class="flex flex-col h-full">
            
            <!-- Hero Section (Top) -->
            <div id="hero-weather" class="flex-1 flex flex-col items-center justify-center p-6 text-center relative">
               <!-- Populate via JS -->
               <div class="text-xl opacity-70">Loading Weather...</div>
            </div>

             <!-- Map Toggle Button -->
            <div class="px-6 mb-4 flex justify-end">
                <button id="btn-toggle-map" class="p-3 rounded-full bg-slate-800/40 backdrop-blur-md text-white border border-white/20 hover:bg-slate-700/50 transition shadow-lg">
                    <ion-icon name="map-outline" class="text-xl"></ion-icon>
                </button>
            </div>

            <!-- Map Container (Hidden by default) -->
            <div id="map-container" class="hidden w-full h-[350px] mb-6 transition-all duration-300 px-6">
                <div id="weather-map" class="w-full h-full rounded-2xl shadow-inner border border-white/10 overflow-hidden"></div>
            </div>

            <!-- Details Panel (Bottom) -->
            <div class="glass-panel p-6 pb-20 overflow-y-auto no-scrollbar" style="max-height: 60vh;">
               <div id="weather-details-content">
                  <!-- Populate via JS -->
               </div>
            </div>

          </div>
        </ion-content>
      </ion-page>
    `;
  }

  getSearchPageHTML() {
    return `
      <div id="search-page" class="fixed inset-0 z-50 bg-slate-900 translate-x-full flex flex-col">
        <!-- Header -->
        <div class="p-4 pt-12 bg-slate-800/50 backdrop-blur-md border-b border-white/10 flex items-center gap-4">
           <button id="btn-close-search" class="p-2 -ml-2 text-slate-400 hover:text-white transition">
              <ion-icon name="arrow-back" class="text-2xl"></ion-icon>
           </button>
           <div class="flex-1 relative">
              <input type="text" id="search-input" placeholder="Search City or Country" 
                     class="w-full bg-slate-700/50 text-white p-3 pl-10 rounded-xl border border-white/10 focus:border-blue-400 focus:bg-slate-700 transition outline-none">
              <ion-icon name="search" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></ion-icon>
              <div id="search-loader" class="hidden absolute right-3 top-1/2 -translate-y-1/2">
                 <div class="animate-spin h-4 w-4 border-2 border-blue-400 border-t-transparent rounded-full"></div>
              </div>
           </div>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto search-scroll p-4">
           
           <!-- Current Location Button -->
           <button id="btn-use-location" class="w-full mb-6 flex items-center gap-3 p-4 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded-xl transition group">
              <div class="p-2 bg-blue-500 rounded-lg text-white group-hover:scale-110 transition-transform">
                 <ion-icon name="navigate" class="text-xl"></ion-icon>
              </div>
              <div class="text-left">
                 <div class="font-bold text-blue-100">Use Current Location</div>
                 <div class="text-xs text-blue-300">Get weather for your exact position</div>
              </div>
           </button>

           <!-- Recent/Favorites Section -->
           <div id="favorites-section">
              <h3 class="text-xs font-bold text-slate-500 uppercase mb-3 tracking-wide px-1">Saved Locations</h3>
              <div id="favorites-list" class="space-y-2 mb-8"></div>
           </div>

           <!-- Results Section -->
           <div id="results-section">
              <h3 class="text-xs font-bold text-slate-500 uppercase mb-3 tracking-wide px-1">Search Results</h3>
              <div id="search-results-list" class="space-y-2 pb-20"></div>
           </div>
        </div>
      </div>
    `;
  }

  getSettingsPageHTML() {
    return `
      <div id="settings-page" class="fixed inset-0 z-50 bg-slate-900 translate-x-full flex flex-col transition-transform duration-300">
        <!-- Header -->
        <div class="p-4 pt-12 bg-slate-800/50 backdrop-blur-md border-b border-white/10 flex items-center justify-between">
           <h2 class="text-xl font-bold text-white">Settings</h2>
           <button id="btn-close-settings" class="p-2 -mr-2 text-slate-400 hover:text-white transition bg-transparent border-0">
              <span class="text-sm font-bold uppercase tracking-wide">Done</span>
           </button>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto p-6 space-y-8">
            
            <!-- Units Section -->
            <div class="space-y-4">
                <h3 class="text-xs font-bold text-slate-500 uppercase tracking-widest pl-2">Display</h3>
                <div class="premium-glass p-1 rounded-2xl flex relative bg-slate-800/50">
                     <div class="w-1/2 h-full absolute top-0 left-0 bg-blue-600 rounded-xl transition-all duration-300 opacity-20" id="unit-indicator"></div>
                     <button class="flex-1 py-3 text-center z-10 font-medium text-white transition rounded-xl relative overflow-hidden group" id="btn-metric">
                        Metric (°C)
                        <div class="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition"></div>
                     </button>
                     <button class="flex-1 py-3 text-center z-10 font-medium text-slate-400 transition rounded-xl relative overflow-hidden group" id="btn-imperial">
                        Imperial (°F)
                        <div class="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition"></div>
                     </button>
                </div>

                <div class="premium-glass p-4 rounded-2xl flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <div class="p-2 rounded-lg bg-purple-500/20 text-purple-300">
                           <ion-icon name="color-palette"></ion-icon>
                        </div>
                        <span class="font-medium text-white">Dynamic Backgrounds</span>
                    </div>
                     <ion-toggle id="toggle-dynamic-bg" checked></ion-toggle>
                </div>
            </div>

            <!-- Notifications Section -->
             <div class="space-y-4">
                <h3 class="text-xs font-bold text-slate-500 uppercase tracking-widest pl-2">Notifications</h3>
                <div class="premium-glass p-4 rounded-2xl flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <div class="p-2 rounded-lg bg-orange-500/20 text-orange-300">
                           <ion-icon name="notifications"></ion-icon>
                        </div>
                        <span class="font-medium text-white">Severe Weather Alerts</span>
                    </div>
                     <ion-toggle id="toggle-notifications" checked></ion-toggle>
                </div>
            </div>

             <!-- Data Section -->
            <div class="space-y-4">
                <h3 class="text-xs font-bold text-slate-500 uppercase tracking-widest pl-2">Data & Storage</h3>
                 <button id="btn-clear-cache" class="w-full premium-glass p-4 rounded-2xl flex items-center justify-between group hover:bg-red-500/10 transition border-red-500/20 border">
                    <div class="flex items-center gap-3">
                        <div class="p-2 rounded-lg bg-red-500/20 text-red-400">
                           <ion-icon name="trash"></ion-icon>
                        </div>
                        <span class="font-medium text-red-300 group-hover:text-red-200">Clear Cache & Reset</span>
                    </div>
                    <ion-icon name="chevron-forward" class="text-slate-600"></ion-icon>
                </button>
            </div>

            <!-- About Section -->
            <div class="pt-8 text-center">
                 <div class="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <ion-icon name="cloudy-night" class="text-3xl text-white"></ion-icon>
                 </div>
                 <h4 class="text-lg font-bold text-white mb-1">Weather App Pro</h4>
                 <div class="text-slate-500 text-sm">Version 2.0.0</div>
                 <div class="text-slate-600 text-xs mt-4">Designed with ❤️ using Ionic & Tailwind</div>
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
      this.renderFavoritesList(); // Refresh favorites when opening
    });

    // CLOSE Search Page
    document.getElementById('btn-close-search')?.addEventListener('click', () => {
      searchPage.classList.remove('translate-x-0');
      searchPage.classList.add('translate-x-full');
    });

    // Use Current Location
    document.getElementById('btn-use-location')?.addEventListener('click', async () => {
      searchPage.classList.remove('translate-x-0');
      searchPage.classList.add('translate-x-full');
      await this.loadWeather(true);
    });

    // OPEN Settings Page
    document.getElementById('btn-settings')?.addEventListener('click', () => {
      const settingsPage = document.getElementById('settings-page');
      settingsPage.classList.remove('translate-x-full');
      settingsPage.classList.add('translate-x-0');
    });

    // CLOSE Settings Page
    document.getElementById('btn-close-settings')?.addEventListener('click', () => {
      const settingsPage = document.getElementById('settings-page');
      settingsPage.classList.remove('translate-x-0');
      settingsPage.classList.add('translate-x-full');
    });

    // Dynamic Background Toggle
    document.getElementById('toggle-dynamic-bg')?.addEventListener('ionChange', (e) => {
      const isChecked = e.detail.checked;
      const bg = document.getElementById('app-background');
      if (isChecked) {
        bg.style.display = 'block';
        if (this.currentWeather) {
          this.updateDynamicBackground(this.currentWeather.current.weather, this.currentWeather.current.icon);
        }
      } else {
        bg.style.display = 'none';
        // Reset to a dark gradient or color if needed
        document.getElementById('app').style.background = '#0f172a'; // Slate-900
      }
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

    // Map Toggle
    document.getElementById('btn-toggle-map')?.addEventListener('click', () => {
      const mapContainer = document.getElementById('map-container');
      mapContainer.classList.toggle('hidden');
      if (!mapContainer.classList.contains('hidden')) {
        if (!this.map) this.initMap();
        setTimeout(() => this.map.invalidateSize(), 300); // Fix rendering issue
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
            resultsList.innerHTML = '<div class="text-slate-400 p-4 text-center">No cities found</div>';
            return;
          }

          resultsList.innerHTML = cities.map(city => `
  <div class="p-4 bg-white/5 rounded-xl mb-2 flex justify-between items-center cursor-pointer data-city-item hover:bg-white/10 transition border border-white/5"
data-lat="${city.lat}" data-lon="${city.lon}" data-name="${city.name}" data-country="${city.country}">
                   <div>
                     <div class="font-bold text-white text-lg">${city.name}</div>
                     <div class="text-sm text-slate-400 flex items-center gap-1">
                        <ion-icon name="location-outline"></ion-icon> 
                        ${city.state ? city.state + ', ' : ''}${city.country}
                     </div>
                   </div>
                   <ion-icon name="chevron-forward" class="text-slate-500"></ion-icon>
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

  async initMap() {
    if (this.map) return;
    const L = await import('leaflet');

    const el = document.getElementById('weather-map');
    if (!el) return;

    if (this.map) {
      this.map.remove();
    }

    const { lat, lon } = this.currentLocation || { lat: 0, lon: 0 };
    this.map = L.map('weather-map').setView([lat, lon], 10);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(this.map);

    // Add Weather Tile (Precipitation)
    L.tileLayer(weatherService.getMapTileUrl('precipitation_new'), {
      maxZoom: 18,
    }).addTo(this.map);
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
        icon.style.color = '#ef4444'; // Red-500
      } else {
        icon.setAttribute('name', 'heart-outline');
        icon.style.color = 'rgba(255, 255, 255, 0.8)';
      }
    }
  }

  renderFavoritesList() {
    const list = document.getElementById('favorites-list');
    if (!list) return;

    if (this.favorites.length === 0) {
      list.innerHTML = '<div class="text-xs text-slate-500 text-center py-4">No saved locations yet</div>';
      return;
    }

    list.innerHTML = this.favorites.map(city => `
  <div class="p-3 bg-white/5 rounded-xl flex justify-between items-center cursor-pointer fav-item hover:bg-white/10 transition border border-white/5"
data-lat="${city.lat}" data-lon="${city.lon}">
             <span class="font-medium text-white">${city.name}</span>
             <button class="btn-delete-fav p-2 text-slate-400 hover:text-red-400 transition">
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

      // Update Map if exists
      if (this.map) {
        this.map.setView([loc.lat, loc.lon], 10);
      }

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
    if (header) header.innerText = `${current.cityName}, ${current.country} `.toUpperCase();

    // Update Hero
    const hero = document.getElementById('hero-weather');
    if (hero) {
      hero.innerHTML = `
  <div class="absolute top-0 right-0 p-4 fade-in" style="animation-delay: 0.1s">
    <button id="btn-favorite" class="text-3xl text-white/80 hover:text-white transition-colors">
      <ion-icon name="heart-outline"></ion-icon>
    </button>
           </div>
           
           <div class="mb-4 text-xs font-bold uppercase tracking-widest text-white/70 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full inline-block fade-in">
                ${formatters.formatShortDay(new Date())} • ${formatters.formatTime(new Date())}
           </div>

           <div class="relative fade-in" style="animation-delay: 0.2s">
             <img src="${weatherService.getIconUrl(current.icon)}" 
                  class="w-48 h-48 drop-shadow-2xl animate-float mx-auto" 
                  onerror="this.src='https://openweathermap.org/img/wn/02d@4x.png'" />
           </div>
           
           <div class="hero-text mt-[-1rem] fade-in" style="animation-delay: 0.3s">${Math.round(current.temp)}°</div>
           <div class="hero-condition fade-in" style="animation-delay: 0.4s">${current.description}</div>
           
           <div class="flex gap-8 text-lg font-medium text-white/90 fade-in" style="animation-delay: 0.5s">
              <span class="flex items-center gap-1"><ion-icon name="arrow-up" class="text-red-300"></ion-icon> ${Math.round(current.tempMax)}°</span>
              <span class="flex items-center gap-1"><ion-icon name="arrow-down" class="text-indigo-300"></ion-icon> ${Math.round(current.tempMin)}°</span>
           </div>
           
           <button id="btn-refresh-loc" class="mt-8 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-white/60 hover:text-white bg-white/5 hover:bg-white/10 px-6 py-3 rounded-2xl transition border border-white/10 fade-in" style="animation-delay: 0.6s">
              <ion-icon name="locate"></ion-icon> Update Location
           </button>
`;

      const favBtn = document.getElementById('btn-favorite');
      if (favBtn) favBtn.addEventListener('click', () => this.toggleFavorite());

      const refreshBtn = document.getElementById('btn-refresh-loc');
      if (refreshBtn) refreshBtn.addEventListener('click', () => this.loadWeather(true));

      this.updateFavoriteButtonState();
      this.updateDynamicBackground(current.weather, current.icon);
    }

    // Update Details
    const details = document.getElementById('weather-details-content');
    if (details) {
      details.innerHTML = `
  <!--Hourly -->
           <div class="premium-glass p-5 mb-5 fade-in" style="animation-delay: 0.7s">
              <h3 class="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4 border-b border-white/10 pb-2">Hourly Forecast</h3>
              <div class="flex gap-6 overflow-x-auto pb-2 no-scrollbar">
                 ${(hourly || []).map(h => `
                    <div class="flex flex-col items-center min-w-[64px] group">
                       <span class="text-sm text-slate-300 mb-1">${formatters.formatTime(h.time)}</span>
                       <img src="${weatherService.getIconUrl(h.icon)}" class="w-10 h-10 mb-1 group-hover:scale-110 transition-transform">
                       <span class="font-bold text-lg mb-1">${Math.round(h.temp)}°</span>
                       <span class="text-[10px] text-blue-200 flex items-center gap-0.5 bg-blue-500/20 px-1.5 py-0.5 rounded">
                           <ion-icon name="water"></ion-icon> ${Math.round(h.pop * 100)}%
                       </span>
                    </div>
                 `).join('')}
              </div>
           </div>

           <!--7 - Day List-->
           <div class="premium-glass p-5 mb-5 fade-in" style="animation-delay: 0.8s">
              <h3 class="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4 border-b border-white/10 pb-2">7-Day Forecast</h3>
              <div class="space-y-4">
                 ${(daily || []).map(d => `
                    <div class="flex items-center justify-between hover:bg-white/5 p-2 -mx-2 rounded-xl transition">
                       <span class="w-20 font-medium text-slate-200">${formatters.formatShortDay(d.date)}</span>
                       <div class="flex-1 flex justify-center items-center gap-2">
                            <img src="${weatherService.getIconUrl(d.icon)}" class="w-8 h-8">
                            <span class="text-sm text-slate-400 capitalize hidden sm:block">${d.description}</span>
                       </div>
                       <div class="w-28 text-right flex justify-end gap-4">
                          <span class="text-slate-400 font-medium">${Math.round(d.tempMin)}°</span>
                          <span class="font-bold text-white text-lg">${Math.round(d.tempMax)}°</span>
                       </div>
                    </div>
                 `).join('')}
              </div>
           </div>

           <!--Metrics Grid-->
  <div class="grid grid-cols-2 gap-4 mb-5 fade-in" style="animation-delay: 0.9s">
    <div class="premium-glass p-4 flex flex-col justify-between h-28">
      <div class="text-xs text-slate-400 uppercase tracking-wide flex items-center gap-2">
        <ion-icon name="speedometer-outline"></ion-icon> Wind
      </div>
      <div class="text-2xl font-bold">${current.windSpeed} <span class="text-base font-normal text-slate-300">km/h</span></div>
    </div>
    <div class="premium-glass p-4 flex flex-col justify-between h-28">
      <div class="text-xs text-slate-400 uppercase tracking-wide flex items-center gap-2">
        <ion-icon name="water-outline"></ion-icon> Humidity
      </div>
      <div class="text-2xl font-bold">${current.humidity}<span class="text-base font-normal">%</span></div>
    </div>
    <div class="premium-glass p-4 flex flex-col justify-between h-28">
      <div class="text-xs text-slate-400 uppercase tracking-wide flex items-center gap-2">
        <ion-icon name="thermometer-outline"></ion-icon> Feels Like
      </div>
      <div class="text-2xl font-bold">${Math.round(current.feelsLike)}°</div>
    </div>
    <div class="premium-glass p-4 flex flex-col justify-between h-28">
      <div class="text-xs text-slate-400 uppercase tracking-wide flex items-center gap-2">
        <ion-icon name="eye-outline"></ion-icon> Visibility
      </div>
      <div class="text-2xl font-bold">${(current.visibility / 1000).toFixed(1)} <span class="text-base font-normal text-slate-300">km</span></div>
    </div>

    <div class="premium-glass p-4 flex flex-col justify-between h-28">
      <div class="text-xs text-slate-400 uppercase tracking-wide flex items-center gap-2">
        <ion-icon name="sunny-outline"></ion-icon> UV Index
      </div>
      <div class="text-2xl font-bold">${uv !== null ? uv : '--'}</div>
      <div class="text-xs text-slate-400">${uv > 5 ? 'High' : (uv > 2 ? 'Moderate' : 'Low')}</div>
    </div>

    <div class="premium-glass p-4 flex flex-col justify-between h-28">
      <div class="text-xs text-slate-400 uppercase tracking-wide flex items-center gap-2">
        <ion-icon name="flower-outline"></ion-icon> AQI
      </div>
      <div class="text-xl font-bold truncate">${airQuality ? airQuality.aqiDescription : '--'}</div>
      <div class="text-xs text-slate-400">Index: ${airQuality ? airQuality.aqi : '--'}</div>
    </div>

    <div class="premium-glass col-span-2 p-6 flex justify-between items-center">
      <div class="text-center">
        <div class="text-[10px] text-slate-400 uppercase mb-2 tracking-wider">Sunrise</div>
        <div class="text-2xl font-bold text-amber-300">${formatters.formatTime(current.sunrise)}</div>
      </div>
      <div class="h-8 w-px bg-white/10"></div>
      <div class="text-center">
        <div class="text-[10px] text-slate-400 uppercase mb-2 tracking-wider">Sunset</div>
        <div class="text-2xl font-bold text-orange-300">${formatters.formatTime(current.sunset)}</div>
      </div>
    </div>
  </div>
`;
    }
  }

  updateDynamicBackground(condition, iconCode) {
    const appBg = document.getElementById('app-background');
    if (!appBg) return;

    // Reset classes
    appBg.className = '';

    const cond = condition.toLowerCase();
    const isNight = iconCode && iconCode.includes('n');

    if (cond.includes('thunder')) appBg.classList.add('bg-thunder');
    else if (cond.includes('rain') || cond.includes('drizzle')) appBg.classList.add('bg-rain');
    else if (cond.includes('snow')) appBg.classList.add('bg-snow');
    else if (cond.includes('mist') || cond.includes('fog') || cond.includes('haze')) appBg.classList.add('bg-mist');
    else if (cond.includes('cloud')) {
      // Distinguish broken clouds vs scattered
      appBg.classList.add('bg-clouds');
    }
    else if (cond.includes('clear')) {
      appBg.classList.add(isNight ? 'bg-clear-night' : 'bg-clear-day');
    }
    else {
      // Fallback
      appBg.classList.add('bg-clear-night');
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
