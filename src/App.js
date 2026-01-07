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
        <!-- Minimal Header -->
        <ion-header class="ion-no-border">
          <ion-toolbar>
            <div class="flex justify-between items-center px-4 pt-4">
               <button id="btn-settings" class="p-3 rounded-full hover:bg-white/10 transition text-white">
                  <ion-icon name="settings-outline" class="text-2xl"></ion-icon>
               </button>
               
               <div class="flex flex-col items-center">
                  <div class="flex items-center gap-2 text-sm font-medium tracking-widest uppercase text-white/60">
                     <ion-icon name="location-outline"></ion-icon>
                     Current Location
                  </div>
                  <h1 id="header-location" class="text-xl font-bold text-white tracking-wide">LOCATING...</h1>
               </div>

               <button id="btn-search-open" class="p-3 rounded-full hover:bg-white/10 transition text-white">
                  <ion-icon name="search" class="text-2xl"></ion-icon>
               </button>
            </div>
          </ion-toolbar>
        </ion-header>

        <ion-content class="no-scrollbar">
          <!-- Weather Alerts -->
          <div id="weather-alerts" class="px-4 mb-4"></div>

          <!-- Bento Grid Layout -->
          <div class="bento-grid pb-20 fade-in">
            
            <!-- 1. Hero Card (Current Weather) -->
            <div id="hero-weather" class="bento-card bento-card-hero items-center justify-center text-center">
               <!-- Populate via JS -->
               <div class="animate-pulse text-white/50">Loading Weather...</div>
            </div>

            <!-- 2. Map Card -->
            <div class="bento-card bento-card-wide p-0 relative group">
                <div id="weather-map" class="w-full h-full opacity-80 group-hover:opacity-100 transition duration-500"></div>
                <div class="absolute bottom-4 left-4 bg-black/50 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider text-white">
                   Precipitation Map
                </div>
                <button id="btn-toggle-map" class="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition">
                    <ion-icon name="expand-outline"></ion-icon>
                </button>
            </div>

            <!-- 3. Details Cards (Injected via JS into this container or separate) -->
            <!-- We will inject specific bento items here -->
            <div id="weather-details-grid" class="contents">
                <!-- JS will append hourly, daily, and metric cards here -->
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
      <div id="settings-page" class="fixed inset-0 z-50 flex items-center justify-center opacity-0 pointer-events-none transition-opacity duration-300">
         <!-- Backdrop -->
         <div id="settings-backdrop" class="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>

         <!-- Content -->
         <div class="relative w-full max-w-md bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl transform scale-95 transition-all duration-300 overflow-hidden flex flex-col max-h-[85vh] m-4">
            
            <div class="p-6 border-b border-white/10 flex justify-between items-center">
               <h2 class="text-xl font-bold text-white tracking-wide">Settings</h2>
               <button id="btn-close-settings" class="p-2 hover:bg-white/10 rounded-full transition text-slate-400">
                  <ion-icon name="close-outline" class="text-xl"></ion-icon>
               </button>
            </div>

            <div class="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
                <!-- Units -->
                <div class="space-y-3">
                    <h3 class="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Units</h3>
                    <ion-segment value="${this.preferences.units}" id="unit-segment">
                       <ion-segment-button value="metric">
                          <ion-label>Metric (°C)</ion-label>
                       </ion-segment-button>
                       <ion-segment-button value="imperial">
                          <ion-label>Imperial (°F)</ion-label>
                       </ion-segment-button>
                    </ion-segment>
                </div>

                <!-- Theme -->
                <div class="space-y-3">
                   <h3 class="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Theme</h3>
                   <ion-segment value="${this.preferences.theme}" id="theme-segment">
                       <ion-segment-button value="light">
                          <ion-label>Light</ion-label>
                       </ion-segment-button>
                       <ion-segment-button value="dark">
                          <ion-label>Dark</ion-label>
                       </ion-segment-button>
                   </ion-segment>
                </div>

                <!-- Toggles -->
                <div class="space-y-4">
                    <div class="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                        <div class="flex items-center gap-3">
                            <div class="p-2 rounded-lg bg-purple-500/20 text-purple-300"><ion-icon name="color-palette"></ion-icon></div>
                            <span class="font-medium text-white">Dynamic Backgrounds</span>
                        </div>
                        <ion-toggle id="toggle-dynamic-bg" checked></ion-toggle>
                    </div>

                    <div class="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                        <div class="flex items-center gap-3">
                            <div class="p-2 rounded-lg bg-orange-500/20 text-orange-300"><ion-icon name="notifications"></ion-icon></div>
                            <span class="font-medium text-white">Alerts</span>
                        </div>
                        <ion-toggle id="toggle-notifications" checked></ion-toggle>
                    </div>
                </div>

                <!-- Danger Zone -->
                <button id="btn-clear-cache" class="w-full p-4 flex items-center justify-between bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-2xl transition group">
                     <span class="font-medium text-red-400">Reset App Data</span>
                     <ion-icon name="trash" class="text-red-400 items-center justify-center"></ion-icon>
                </button>

                <div class="pt-4 text-center">
                    <img src="/logo.png" class="w-16 h-16 mx-auto mb-2 opacity-80" />
                    <div class="text-xs text-slate-500">Weather App Pro v2.0</div>
                </div>
            </div>

         </div>
      </div>
    `;
  }

  getModalsHTML() {
    return ``;
  }


  getAuthHTML() {
    return `
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-[url('https://images.unsplash.com/photo-1475116127127-e1675a805094?q=80&w=2670&auto=format&fit=crop')] bg-cover bg-center">
         <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"></div>
         
         <div class="relative w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl mx-4 transform transition-all animate-enter">
            
            <div class="text-center mb-8">
               <div class="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <ion-icon name="cloudy-night" class="text-3xl text-white"></ion-icon>
               </div>
               <h2 class="text-2xl font-bold text-white mb-2">Welcome Back</h2>
               <p class="text-slate-300">Sign in to sync your favorites</p>
            </div>

            <div class="space-y-4">
               <div class="relative">
                  <ion-icon name="mail-outline" class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></ion-icon>
                  <input type="email" id="auth-email" placeholder="Email Address" 
                         class="w-full bg-slate-800/50 text-white placeholder-slate-500 px-10 py-4 rounded-xl border border-white/10 focus:border-blue-400 focus:bg-slate-800/80 outline-none transition">
               </div>

               <div class="relative">
                  <ion-icon name="lock-closed-outline" class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></ion-icon>
                  <input type="password" id="auth-password" placeholder="Password" 
                         class="w-full bg-slate-800/50 text-white placeholder-slate-500 px-10 py-4 rounded-xl border border-white/10 focus:border-blue-400 focus:bg-slate-800/80 outline-none transition">
               </div>

               <button id="btn-signin" class="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/30 transition transform hover:scale-[1.02] active:scale-95">
                  Sign In
               </button>

               <div class="relative py-2">
                  <div class="absolute inset-0 flex items-center"><div class="w-full border-t border-white/10"></div></div>
                  <div class="relative flex justify-center text-xs uppercase"><span class="bg-transparent px-2 text-slate-400 backdrop-blur-xl">Or continue with</span></div>
               </div>

               <button id="btn-google" class="w-full bg-white text-slate-900 font-bold py-3 rounded-xl hover:bg-slate-100 transition flex items-center justify-center gap-2">
                  <ion-icon name="logo-google" class="text-xl"></ion-icon>
                  Google
               </button>
            </div>

            <div id="auth-error" class="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-200 text-sm hidden text-center"></div>

            <p class="text-center mt-6 text-sm text-slate-400">
               Don't have an account? <button id="btn-signup" class="text-blue-400 hover:text-blue-300 font-medium hover:underline">Sign Up</button>
            </p>
         </div>
      </div>
    `;
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
      searchPage.classList.remove('opacity-0', 'pointer-events-none');
      setTimeout(() => searchInput.focus(), 100);
      this.renderFavoritesList();
    });

    const closeSearch = () => {
      searchPage.classList.add('opacity-0', 'pointer-events-none');
    };

    // CLOSE Search Page
    document.getElementById('btn-close-search')?.addEventListener('click', closeSearch);
    document.getElementById('search-backdrop')?.addEventListener('click', closeSearch);

    // Use Current Location
    document.getElementById('btn-use-location')?.addEventListener('click', async () => {
      closeSearch();
      await this.loadWeather(true);
    });

    // OPEN Settings Page
    document.getElementById('btn-settings')?.addEventListener('click', () => {
      const settingsPage = document.getElementById('settings-page');
      settingsPage.classList.remove('opacity-0', 'pointer-events-none');
    });

    const closeSettings = () => {
      const settingsPage = document.getElementById('settings-page');
      settingsPage.classList.add('opacity-0', 'pointer-events-none');
    };

    // CLOSE Settings Page
    document.getElementById('btn-close-settings')?.addEventListener('click', closeSettings);
    document.getElementById('settings-backdrop')?.addEventListener('click', closeSettings);

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
           <div class="flex flex-col items-center z-10 animate-enter">
             <div class="mb-2 text-sm font-bold uppercase tracking-[0.2em] text-blue-200">
                  ${formatters.formatShortDay(new Date())} • ${formatters.formatTime(new Date())}
             </div>
             
             <div class="relative">
               <img src="${weatherService.getIconUrl(current.icon)}" 
                    class="w-40 h-40 drop-shadow-2xl animate-float" 
                    onerror="this.src='https://openweathermap.org/img/wn/02d@4x.png'" />
             </div>
             
             <div class="text-xxl text-gradient -mt-4">${Math.round(current.temp)}°</div>
             <div class="text-2xl font-medium text-white/90 capitalize tracking-wide -mt-2 mb-6">${current.description}</div>
             
             <div class="flex gap-12 text-lg font-medium text-white/80">
                <span class="flex items-center gap-2"><ion-icon name="arrow-up" class="text-red-400"></ion-icon> ${Math.round(current.tempMax)}°</span>
                <span class="flex items-center gap-2"><ion-icon name="arrow-down" class="text-cyan-400"></ion-icon> ${Math.round(current.tempMin)}°</span>
             </div>
           </div>

           <button id="btn-favorite" class="absolute top-6 right-6 text-2xl text-white/50 hover:text-red-500 transition-colors z-20">
              <ion-icon name="heart-outline"></ion-icon>
           </button>
      `;

      const favBtn = document.getElementById('btn-favorite');
      if (favBtn) favBtn.addEventListener('click', () => this.toggleFavorite());
      this.updateFavoriteButtonState();
      this.updateDynamicBackground(current.weather, current.icon);
    }

    // Update Details Grid
    const detailsGrid = document.getElementById('weather-details-grid');
    if (detailsGrid) {
      detailsGrid.innerHTML = `
        <!-- Hourly Forecast (Wide) -->
        <div class="bento-card bento-card-wide overflow-hidden animate-enter delay-100">
           <div class="flex items-center gap-2 mb-4 text-sm font-bold text-white/60 uppercase tracking-widest">
              <ion-icon name="time-outline"></ion-icon> Hourly Forecast
           </div>
           <div class="flex gap-8 overflow-x-auto pb-4 no-scrollbar fade-mask-r">
              ${(hourly || []).map(h => `
                 <div class="flex flex-col items-center min-w-[4rem] group cursor-pointer hover:-translate-y-1 transition-transform duration-300">
                    <span class="text-xs text-white/70 mb-2">${formatters.formatTime(h.time)}</span>
                    <img src="${weatherService.getIconUrl(h.icon)}" class="w-8 h-8 mb-2 opacity-90 group-hover:opacity-100 group-hover:scale-110 transition">
                    <span class="font-bold text-lg">${Math.round(h.temp)}°</span>
                 </div>
              `).join('')}
           </div>
        </div>

        <!-- 7-Day Forecast (Tall) -->
        <div class="bento-card bento-card-tall animate-enter delay-200">
           <div class="flex items-center gap-2 mb-4 text-sm font-bold text-white/60 uppercase tracking-widest">
              <ion-icon name="calendar-outline"></ion-icon> 7-Day
           </div>
           <div class="space-y-3 overflow-y-auto no-scrollbar pr-2 h-full">
              ${(daily || []).map(d => `
                 <div class="flex items-center justify-between hover:bg-white/5 p-2 rounded-xl transition group">
                    <span class="w-12 font-medium text-white/80 group-hover:text-white">${formatters.formatShortDay(d.date)}</span>
                    <div class="flex items-center gap-2 opacity-80 group-hover:opacity-100">
                         <img src="${weatherService.getIconUrl(d.icon)}" class="w-6 h-6">
                    </div>
                    <div class="flex gap-3 text-sm">
                       <span class="text-white/40">${Math.round(d.tempMin)}°</span>
                       <span class="font-bold text-white">${Math.round(d.tempMax)}°</span>
                    </div>
                 </div>
              `).join('')}
           </div>
        </div>

        <!-- Metrics Cards -->
        <div class="bento-card animate-enter delay-300">
           <div class="text-xs text-white/50 uppercase tracking-wider mb-2 flex items-center gap-1"><ion-icon name="speedometer-outline"></ion-icon> Wind</div>
           <div class="text-2xl font-bold">${current.windSpeed} <span class="text-sm font-normal text-white/60">km/h</span></div>
           <div class="mt-auto h-1 w-full bg-white/10 rounded-full overflow-hidden">
              <div class="h-full bg-blue-400" style="width: ${Math.min(current.windSpeed * 2, 100)}%"></div>
           </div>
        </div>

        <div class="bento-card animate-enter delay-300">
           <div class="text-xs text-white/50 uppercase tracking-wider mb-2 flex items-center gap-1"><ion-icon name="water-outline"></ion-icon> Humidity</div>
           <div class="text-2xl font-bold">${current.humidity}<span class="text-sm font-normal text-white/60">%</span></div>
           <div class="mt-auto h-1 w-full bg-white/10 rounded-full overflow-hidden">
              <div class="h-full bg-cyan-400" style="width: ${current.humidity}%"></div>
           </div>
        </div>

        <div class="bento-card animate-enter delay-300">
           <div class="text-xs text-white/50 uppercase tracking-wider mb-2 flex items-center gap-1"><ion-icon name="sunny-outline"></ion-icon> UV Index</div>
           <div class="text-2xl font-bold">${uv !== null ? uv : '--'}</div>
           <div class="text-xs ${uv > 5 ? 'text-red-400' : 'text-green-400'} font-bold mt-1">${uv > 5 ? 'High' : (uv > 2 ? 'Moderate' : 'Low')}</div>
        </div>

        <div class="bento-card animate-enter delay-300">
           <div class="text-xs text-white/50 uppercase tracking-wider mb-2 flex items-center gap-1"><ion-icon name="eye-outline"></ion-icon> Visibility</div>
           <div class="text-xl font-bold">${(current.visibility / 1000).toFixed(1)} <span class="text-sm font-normal text-white/60">km</span></div>
        </div>

        <!-- Astro Card (Wide) -->
        <div class="bento-card bento-card-wide flex-row items-center justify-around animate-enter delay-300">
           <div class="text-center">
              <ion-icon name="sunny" class="text-3xl text-amber-400 mb-2"></ion-icon>
              <div class="text-xs text-white/50 uppercase tracking-wider">Sunrise</div>
              <div class="text-xl font-bold text-white">${formatters.formatTime(current.sunrise)}</div>
           </div>
           <div class="h-10 w-px bg-white/10"></div>
           <div class="text-center">
              <ion-icon name="moon" class="text-3xl text-indigo-400 mb-2"></ion-icon>
              <div class="text-xs text-white/50 uppercase tracking-wider">Sunset</div>
              <div class="text-xl font-bold text-white">${formatters.formatTime(current.sunset)}</div>
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
      appBg.classList.add('bg-clouds');
    }
    else if (cond.includes('clear')) {
      appBg.classList.add(isNight ? 'bg-clear-night' : 'bg-clear-day');
    }
    else {
      appBg.classList.add(isNight ? 'bg-clear-night' : 'bg-clear-day');
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
