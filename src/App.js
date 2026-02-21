import weatherService from './services/weather.service.js';
import locationService from './services/location.service.js';
import storageService from './services/storage.service.js';

import astronomyService from './services/astronomy.service.js';
import weatherCharts from './utils/charts.js';
import { units } from './utils/units.js';
import { formatters } from './utils/formatters.js';
import theme, { THEMES } from './utils/theme.js';

// ─── WEATHER PARTICLES ENGINE ───
class WeatherParticles {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.animId = null;
    this.type = 'clear';
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }
  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }
  setWeather(weatherMain) {
    const w = (weatherMain || '').toLowerCase();
    if (w.includes('rain') || w.includes('drizzle')) this.type = 'rain';
    else if (w.includes('snow')) this.type = 'snow';
    else if (w.includes('cloud') || w.includes('overcast') || w.includes('mist') || w.includes('fog') || w.includes('haze')) this.type = 'clouds';
    else if (w.includes('thunder')) this.type = 'rain';
    else this.type = 'clear';
    this.particles = [];
    this.initParticles();
  }
  initParticles() {
    const W = this.canvas.width, H = this.canvas.height;
    if (this.type === 'rain') {
      for (let i = 0; i < 120; i++) this.particles.push({ x: Math.random() * W, y: Math.random() * H, l: 8 + Math.random() * 14, s: 4 + Math.random() * 6, o: 0.15 + Math.random() * 0.25 });
    } else if (this.type === 'snow') {
      for (let i = 0; i < 70; i++) this.particles.push({ x: Math.random() * W, y: Math.random() * H, r: 1.5 + Math.random() * 3, s: 0.5 + Math.random() * 1.5, o: 0.3 + Math.random() * 0.4, wx: Math.random() * 2 - 1, phase: Math.random() * Math.PI * 2 });
    } else if (this.type === 'clouds') {
      for (let i = 0; i < 5; i++) this.particles.push({ x: Math.random() * W, y: 40 + Math.random() * (H * 0.3), r: 60 + Math.random() * 80, s: 0.15 + Math.random() * 0.25, o: 0.03 + Math.random() * 0.04 });
    } else {
      // clear: subtle floating sparkles
      for (let i = 0; i < 25; i++) this.particles.push({ x: Math.random() * W, y: Math.random() * H, r: 1 + Math.random() * 1.5, s: 0.2 + Math.random() * 0.4, o: 0.15 + Math.random() * 0.3, phase: Math.random() * Math.PI * 2 });
    }
  }
  start() { if (!this.animId) this.loop(); }
  stop() { if (this.animId) { cancelAnimationFrame(this.animId); this.animId = null; } }
  loop() {
    this.animId = requestAnimationFrame(() => this.loop());
    const ctx = this.ctx, W = this.canvas.width, H = this.canvas.height;
    ctx.clearRect(0, 0, W, H);
    if (this.type === 'rain') {
      this.particles.forEach(p => {
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + 0.5, p.y + p.l);
        ctx.strokeStyle = `rgba(174,194,224,${p.o})`; ctx.lineWidth = 1.2; ctx.stroke();
        p.y += p.s; p.x += 0.3;
        if (p.y > H) { p.y = -p.l; p.x = Math.random() * W; }
      });
    } else if (this.type === 'snow') {
      this.particles.forEach(p => {
        p.phase += 0.01;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${p.o})`; ctx.fill();
        p.y += p.s; p.x += Math.sin(p.phase) * 0.5 + p.wx * 0.1;
        if (p.y > H) { p.y = -p.r * 2; p.x = Math.random() * W; }
      });
    } else if (this.type === 'clouds') {
      this.particles.forEach(p => {
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
        g.addColorStop(0, `rgba(255,255,255,${p.o})`); g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g; ctx.fill();
        p.x += p.s;
        if (p.x - p.r > W) { p.x = -p.r; p.y = 40 + Math.random() * (H * 0.3); }
      });
    } else {
      this.particles.forEach(p => {
        p.phase += 0.015;
        const flicker = 0.5 + 0.5 * Math.sin(p.phase);
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * flicker, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${p.o * flicker})`; ctx.fill();
        p.y -= p.s * 0.3; p.x += Math.sin(p.phase) * 0.2;
        if (p.y < -10) { p.y = H + 10; p.x = Math.random() * W; }
      });
    }
  }
}

class App {
  constructor() {
    this.currentUser = null;
    this.currentWeather = null;
    this.currentLocation = null;
    this.favorites = [];
    this.preferences = {
      units: 'metric',
      theme: 'twilight',
      timeFormat: '12h',
      particles: true,
      autoRefresh: '30',
      windUnit: 'default',
      haptic: true,
      highContrast: false
    };
    this._autoRefreshTimer = null;
    this.astronomyData = null;
    this.charts = { temperature: null, precipitation: null };
    this._pullStartY = 0;
    this._isPulling = false;
    this._particles = null;
    this._isOnline = navigator.onLine;
    this._lastPressure = null;
    this._multiCityData = [];
    this._yesterdayComparison = null;
  }

  // ─── HELPER: Weather Alerts ───
  getWeatherAlerts(current) {
    const alerts = [];
    const temp = current.temp;
    const wind = current.windSpeed;
    const humidity = current.humidity;
    const vis = current.visibility;
    const weather = (current.weather || '').toLowerCase();
    const desc = (current.description || '').toLowerCase();

    if (temp >= 40) alerts.push({ severity: 'danger', icon: 'flame', title: 'Extreme Heat Warning', msg: `Temperature is ${temp}°. Stay hydrated, avoid sun exposure.` });
    else if (temp >= 35) alerts.push({ severity: 'warning', icon: 'sunny', title: 'Heat Advisory', msg: `High temperature of ${temp}°. Drink plenty of water.` });
    if (temp <= -10) alerts.push({ severity: 'danger', icon: 'snow', title: 'Extreme Cold Warning', msg: `Temperature is ${temp}°. Risk of frostbite, stay indoors.` });
    else if (temp <= 0) alerts.push({ severity: 'warning', icon: 'snow', title: 'Freezing Conditions', msg: `Temperature is ${temp}°. Watch for icy roads.` });
    if (wind >= 60) alerts.push({ severity: 'danger', icon: 'thunderstorm', title: 'Storm Warning', msg: `Wind speeds at ${wind} km/h. Secure loose objects.` });
    else if (wind >= 35) alerts.push({ severity: 'warning', icon: 'flag', title: 'High Wind Advisory', msg: `Wind gusts up to ${wind} km/h. Be cautious outdoors.` });
    if (vis < 500) alerts.push({ severity: 'warning', icon: 'eye-off', title: 'Low Visibility', msg: 'Visibility below 500m. Drive carefully.' });
    if (weather.includes('thunderstorm') || desc.includes('thunder')) alerts.push({ severity: 'danger', icon: 'thunderstorm', title: 'Thunderstorm Alert', msg: 'Active thunderstorm. Seek shelter indoors.' });
    if (desc.includes('heavy rain') || desc.includes('extreme rain')) alerts.push({ severity: 'warning', icon: 'rainy', title: 'Heavy Rain Warning', msg: 'Heavy rainfall expected. Risk of flooding.' });
    if (desc.includes('heavy snow') || desc.includes('blizzard')) alerts.push({ severity: 'warning', icon: 'snow', title: 'Heavy Snow Warning', msg: 'Significant snowfall expected. Travel may be hazardous.' });

    return alerts;
  }

  renderAlerts(current) {
    const alertsEl = document.getElementById('weather-alerts');
    if (!alertsEl) return;
    const alerts = this.getWeatherAlerts(current);
    if (alerts.length === 0) { alertsEl.innerHTML = ''; return; }
    alertsEl.innerHTML = alerts.map(a => `
      <div class="weather-alert weather-alert-${a.severity} fade-in">
        <div class="weather-alert-icon"><ion-icon name="${a.icon}"></ion-icon></div>
        <div class="weather-alert-body">
          <div class="weather-alert-title">${a.title}</div>
          <div class="weather-alert-msg">${a.msg}</div>
        </div>
        <button class="weather-alert-close" onclick="this.parentElement.remove()"><ion-icon name="close"></ion-icon></button>
      </div>
    `).join('');
  }

  // ─── HELPER: Feels-Like Context & Clothing ───
  getFeelsLikeContext(current) {
    const temp = current.feelsLike;
    const weather = (current.weather || '').toLowerCase();
    const humidity = current.humidity;
    const wind = current.windSpeed;
    const pop = this.currentWeather?.hourly?.[0]?.pop || 0;

    let feeling = '', advice = '', icon = '';

    if (temp >= 40) { feeling = 'Dangerously hot'; advice = 'Stay indoors with AC. Avoid outdoor activities.'; icon = 'flame'; }
    else if (temp >= 33) { feeling = 'Very hot & uncomfortable'; advice = 'Wear light clothing, apply sunscreen.'; icon = 'sunny'; }
    else if (temp >= 26) { feeling = 'Warm & pleasant'; advice = 'Light clothes — shorts and t-shirt weather.'; icon = 'partly-sunny'; }
    else if (temp >= 20) { feeling = 'Comfortable'; advice = 'Perfect for a walk — light layers.'; icon = 'happy'; }
    else if (temp >= 14) { feeling = 'Cool & crisp'; advice = 'Bring a light jacket or hoodie.'; icon = 'shirt'; }
    else if (temp >= 5) { feeling = 'Chilly'; advice = 'Wear a warm coat and layers.'; icon = 'shirt'; }
    else if (temp >= -5) { feeling = 'Cold'; advice = 'Bundle up — hat, gloves, warm coat.'; icon = 'snow'; }
    else { feeling = 'Freezing'; advice = 'Heavy winter gear essential. Limit time outdoors.'; icon = 'snow'; }

    const tips = [];
    if (pop > 50 || weather.includes('rain') || weather.includes('drizzle')) tips.push({ icon: 'umbrella', text: 'Bring an umbrella' });
    if (weather.includes('snow')) tips.push({ icon: 'snow', text: 'Wear waterproof boots' });
    if (humidity > 80 && temp > 25) tips.push({ icon: 'water', text: 'High humidity — stay cool' });
    if (wind > 25) tips.push({ icon: 'flag', text: 'Windy — secure loose items' });
    if (temp > 28 && !weather.includes('rain')) tips.push({ icon: 'sunny', text: 'Wear sunscreen (UV protection)' });

    return { feeling, advice, icon, tips };
  }

  // ─── HELPER: Moon Phase SVG ───
  getMoonPhaseSVG(phase) {
    // phase: 0 = new moon, 0.5 = full moon, 1 = new moon
    const r = 28;
    const cx = 32, cy = 32;
    // Determine illuminated side and curve
    let sweep, dx;
    if (phase <= 0.5) {
      // Waxing: right side lit
      sweep = 1;
      dx = r * (1 - 4 * phase); // goes from r to -r
    } else {
      // Waning: left side lit
      sweep = 0;
      dx = r * (4 * phase - 3); // goes from -r to r
    }

    const darkFill = 'rgba(30,30,50,0.85)';
    const lightFill = '#e8e5d8';
    const craterColor = 'rgba(100,100,80,0.25)';

    return `<svg viewBox="0 0 64 64" width="56" height="56" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="moon-glow"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      <g filter="url(#moon-glow)">
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="${lightFill}"/>
        <circle cx="${cx+5}" cy="${cy-8}" r="4" fill="${craterColor}"/>
        <circle cx="${cx-8}" cy="${cy+6}" r="3" fill="${craterColor}"/>
        <circle cx="${cx+2}" cy="${cy+12}" r="2.5" fill="${craterColor}"/>
        <circle cx="${cx-4}" cy="${cy-12}" r="1.8" fill="${craterColor}"/>
        <path d="M${cx} ${cy - r} A${r} ${r} 0 0 ${phase <= 0.5 ? 0 : 1} ${cx} ${cy + r} A${Math.abs(dx)} ${r} 0 0 ${sweep} ${cx} ${cy - r}Z" fill="${darkFill}"/>
      </g>
    </svg>`;
  }

  // ─── HELPER: Wind Compass SVG ───
  getWindCompassSVG(deg, speed) {
    const dir = formatters.formatWindDirection(deg);
    return `<svg viewBox="0 0 80 80" width="64" height="64" xmlns="http://www.w3.org/2000/svg">
      <circle cx="40" cy="40" r="36" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.2)" stroke-width="1.5"/>
      <text x="40" y="12" text-anchor="middle" fill="rgba(255,255,255,0.5)" font-size="8" font-weight="600">N</text>
      <text x="40" y="76" text-anchor="middle" fill="rgba(255,255,255,0.3)" font-size="7">S</text>
      <text x="72" y="43" text-anchor="middle" fill="rgba(255,255,255,0.3)" font-size="7">E</text>
      <text x="8" y="43" text-anchor="middle" fill="rgba(255,255,255,0.3)" font-size="7">W</text>
      <g transform="rotate(${deg}, 40, 40)">
        <polygon points="40,14 35,40 40,36 45,40" fill="rgba(255,120,100,0.9)" stroke="rgba(255,120,100,0.6)" stroke-width="0.5"/>
        <polygon points="40,66 35,40 40,44 45,40" fill="rgba(255,255,255,0.35)"/>
      </g>
      <circle cx="40" cy="40" r="3" fill="rgba(255,255,255,0.6)"/>
    </svg>`;
  }

  // ─── HELPER: AQI Color & Details ───
  getAQIColor(aqi) {
    const colors = { 1: '#4ade80', 2: '#a3e635', 3: '#facc15', 4: '#f97316', 5: '#ef4444' };
    return colors[aqi] || '#888';
  }

  getAQIBarWidth(aqi) {
    return Math.min(aqi * 20, 100);
  }

  // ─── HELPER: Dew Point from temp & humidity ───
  getDewPoint(temp, humidity) {
    const a = 17.27, b = 237.7;
    const alpha = (a * temp) / (b + temp) + Math.log(humidity / 100);
    return Math.round((b * alpha) / (a - alpha));
  }

  // ─── HELPER: Pressure Trend ───
  getPressureTrend(current) {
    const p = current.pressure;
    if (this._lastPressure === null) { this._lastPressure = p; return { arrow: '→', label: 'Steady', cls: 'steady' }; }
    const diff = p - this._lastPressure;
    this._lastPressure = p;
    if (diff > 1) return { arrow: '↑', label: 'Rising', cls: 'rising' };
    if (diff < -1) return { arrow: '↓', label: 'Falling', cls: 'falling' };
    return { arrow: '→', label: 'Steady', cls: 'steady' };
  }

  // ─── HELPER: Toast notification ───
  showToast(msg, type = 'info', duration = 3000) {
    const existing = document.getElementById('app-toast');
    if (existing) existing.remove();
    const colors = { info: 'rgba(59,130,246,0.9)', success: 'rgba(34,197,94,0.9)', error: 'rgba(239,68,68,0.9)', warning: 'rgba(249,115,22,0.9)' };
    const toast = document.createElement('div');
    toast.id = 'app-toast';
    toast.className = 'app-toast';
    toast.style.background = colors[type] || colors.info;
    toast.innerHTML = `<span>${msg}</span>`;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 350); }, duration);
  }

  // ─── HELPER: Share weather ───
  async shareWeather() {
    if (!this.currentWeather) return;
    const { current } = this.currentWeather;
    const text = `🌤 ${current.cityName}, ${current.country}\n🌡 ${Math.round(current.temp)}° — ${current.description}\nH: ${Math.round(current.tempMax)}° L: ${Math.round(current.tempMin)}°\n💨 Wind ${current.windSpeed} km/h | 💧 Humidity ${current.humidity}%`;
    if (navigator.share) {
      try { await navigator.share({ title: 'Weather Update', text }); } catch (e) { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(text);
      this.showToast('Weather copied to clipboard!', 'success');
    }
  }

  // ─── Precipitation Mini-Timeline ───
  getPrecipTimeline(hourly) {
    const next6 = (hourly || []).slice(0, 6);
    if (!next6.length) return '';
    const maxPop = Math.max(...next6.map(h => h.pop), 1);
    return `<div class="precip-timeline">
      <div class="precip-bars">
        ${next6.map(h => {
          const pct = Math.max((h.pop / Math.max(maxPop, 100)) * 100, 4);
          const color = h.pop > 60 ? 'rgba(96,165,250,0.9)' : h.pop > 30 ? 'rgba(96,165,250,0.6)' : 'rgba(96,165,250,0.3)';
          return `<div class="precip-bar-col">
            <div class="precip-bar" style="height:${pct}%;background:${color}"></div>
            <span class="precip-bar-label">${h.pop}%</span>
            <span class="precip-bar-time">${formatters.formatTime(h.time).replace(':00', '').replace(' ', '')}</span>
          </div>`;
        }).join('')}
      </div>
    </div>`;
  }

  // ─── UV INDEX GAUGE (SVG arc) ───
  getUVGaugeSVG(uvIndex) {
    const uv = Math.max(0, Math.min(uvIndex || 0, 12));
    const pct = uv / 12;
    const r = 44, cx = 55, cy = 50;
    // Arc start (left) and end (right), 180° sweep
    const startAngle = Math.PI;
    const endAngle = 0;
    const needleAngle = Math.PI - pct * Math.PI;
    const nx = cx + r * Math.cos(needleAngle);
    const ny = cy - r * Math.sin(needleAngle);

    const uvLabel = uv <= 2 ? 'Low' : uv <= 5 ? 'Moderate' : uv <= 7 ? 'High' : uv <= 10 ? 'Very High' : 'Extreme';
    const uvColor = uv <= 2 ? '#4ade80' : uv <= 5 ? '#facc15' : uv <= 7 ? '#f97316' : uv <= 10 ? '#ef4444' : '#a855f7';

    const sX = (a) => cx + r * Math.cos(a);
    const sY = (a) => cy - r * Math.sin(a);

    return `<svg viewBox="0 0 110 65" class="uv-gauge-svg" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="uv-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#4ade80"/>
          <stop offset="25%" stop-color="#facc15"/>
          <stop offset="50%" stop-color="#f97316"/>
          <stop offset="75%" stop-color="#ef4444"/>
          <stop offset="100%" stop-color="#a855f7"/>
        </linearGradient>
      </defs>
      <!-- track -->
      <path d="M${sX(Math.PI)} ${sY(Math.PI)} A${r} ${r} 0 0 1 ${sX(0)} ${sY(0)}" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="7" stroke-linecap="round"/>
      <!-- filled arc -->
      <path d="M${sX(Math.PI)} ${sY(Math.PI)} A${r} ${r} 0 0 1 ${sX(needleAngle)} ${sY(needleAngle)}" fill="none" stroke="url(#uv-grad)" stroke-width="7" stroke-linecap="round"/>
      <!-- needle dot -->
      <circle cx="${nx}" cy="${ny}" r="5" fill="${uvColor}" stroke="#fff" stroke-width="1.5" filter="drop-shadow(0 0 4px ${uvColor})"/>
      <!-- value -->
      <text x="${cx}" y="${cy - 4}" text-anchor="middle" fill="white" font-size="16" font-weight="800">${Math.round(uv)}</text>
      <text x="${cx}" y="${cy + 9}" text-anchor="middle" fill="${uvColor}" font-size="7" font-weight="700">${uvLabel.toUpperCase()}</text>
    </svg>`;
  }

  // ─── SUNRISE/SUNSET ARC (SVG) ───
  getSunArcSVG(sunrise, sunset) {
    const now = new Date();
    const sr = sunrise instanceof Date ? sunrise : new Date(sunrise);
    const ss = sunset instanceof Date ? sunset : new Date(sunset);
    const total = ss - sr;
    const elapsed = now - sr;
    const progress = total > 0 ? Math.max(0, Math.min(elapsed / total, 1)) : 0;
    const isDaytime = now >= sr && now <= ss;

    const r = 70, cx = 100, cy = 78;
    const angle = Math.PI - progress * Math.PI;
    const sunX = cx + r * Math.cos(angle);
    const sunY = cy - r * Math.sin(angle);

    const arcStart = `${cx - r} ${cy}`;
    const arcEnd = `${cx + r} ${cy}`;

    const fmtTime = (d) => {
      const h = d.getHours(), m = d.getMinutes();
      const ampm = h >= 12 ? 'PM' : 'AM';
      return `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${ampm}`;
    };

    const nowLabel = fmtTime(now);
    const glowColor = isDaytime ? 'rgba(255,200,60,0.6)' : 'rgba(100,140,255,0.4)';
    const bodyColor = isDaytime ? '#fbbf24' : '#94a3b8';

    return `<svg viewBox="0 0 200 100" class="sun-arc-svg" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="sun-glow"><feGaussianBlur stdDeviation="3"/></filter>
        <linearGradient id="arc-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="rgba(255,200,60,0.15)"/>
          <stop offset="50%" stop-color="rgba(255,200,60,0.5)"/>
          <stop offset="100%" stop-color="rgba(255,120,40,0.15)"/>
        </linearGradient>
      </defs>
      <!-- horizon line -->
      <line x1="18" y1="${cy}" x2="182" y2="${cy}" stroke="rgba(255,255,255,0.15)" stroke-width="1" stroke-dasharray="4,3"/>
      <!-- arc track -->
      <path d="M${arcStart} A${r} ${r} 0 0 1 ${arcEnd}" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="2" stroke-dasharray="5,4"/>
      <!-- arc progress -->
      ${isDaytime ? `<path d="M${arcStart} A${r} ${r} 0 0 1 ${sunX} ${sunY}" fill="none" stroke="url(#arc-grad)" stroke-width="2.5"/>` : ''}
      <!-- sun glow -->
      ${isDaytime ? `<circle cx="${sunX}" cy="${sunY}" r="10" fill="${glowColor}" filter="url(#sun-glow)"/>` : ''}
      <!-- sun body -->
      <circle cx="${sunX}" cy="${sunY}" r="${isDaytime ? 6 : 4}" fill="${bodyColor}" stroke="rgba(255,255,255,0.3)" stroke-width="0.8"/>
      ${isDaytime ? `<text x="${sunX}" y="${sunY - 13}" text-anchor="middle" fill="rgba(255,255,255,0.7)" font-size="6" font-weight="600">${nowLabel}</text>` : ''}
      <!-- sunrise label -->
      <text x="18" y="${cy + 14}" text-anchor="start" fill="rgba(255,255,255,0.5)" font-size="6.5" font-weight="600">${fmtTime(sr)}</text>
      <text x="18" y="${cy + 23}" text-anchor="start" fill="rgba(255,255,255,0.35)" font-size="5.5">SUNRISE</text>
      <!-- sunset label -->
      <text x="182" y="${cy + 14}" text-anchor="end" fill="rgba(255,255,255,0.5)" font-size="6.5" font-weight="600">${fmtTime(ss)}</text>
      <text x="182" y="${cy + 23}" text-anchor="end" fill="rgba(255,255,255,0.35)" font-size="5.5">SUNSET</text>
    </svg>`;
  }

  // ─── ACTIVITY SUGGESTIONS ───
  getActivitySuggestions(current) {
    const suggestions = [];
    const t = current.temp;
    const w = (current.weather || '').toLowerCase();
    const ws = current.windSpeed || 0;
    const h = current.humidity || 0;
    const pop = this.currentWeather?.hourly?.[0]?.pop || 0;

    if (t >= 18 && t <= 30 && !w.includes('rain') && !w.includes('thunder') && ws < 30) suggestions.push({ emoji: '🏃', text: 'Great for a jog or walk' });
    if (t >= 25 && t <= 38 && w.includes('clear')) suggestions.push({ emoji: '🏖️', text: 'Perfect beach / pool day' });
    if (t >= 12 && t <= 28 && !w.includes('rain') && ws < 20) suggestions.push({ emoji: '🚴', text: 'Ideal cycling weather' });
    if (w.includes('rain') || w.includes('thunder')) suggestions.push({ emoji: '🏠', text: 'Stay in — cozy movie day' });
    if (w.includes('snow') && t <= 2) suggestions.push({ emoji: '⛷️', text: 'Snow sports weather!' });
    if (t >= 20 && t <= 32 && !w.includes('rain') && h < 70) suggestions.push({ emoji: '🧺', text: 'Good day for a picnic' });
    if (t < 5) suggestions.push({ emoji: '☕', text: 'Hot drinks weather — stay warm' });
    if (t >= 15 && t <= 25 && ws < 15 && !w.includes('rain')) suggestions.push({ emoji: '📸', text: 'Great light for photography' });
    if (pop > 60) suggestions.push({ emoji: '☂️', text: 'Carry an umbrella today' });
    if (t > 30 && h > 60) suggestions.push({ emoji: '💧', text: 'Stay hydrated — drink water' });

    return suggestions.slice(0, 4);
  }

  // ─── WEATHER COMPARISON (vs. yesterday) ───
  async getWeatherComparison(current) {
    const yesterday = await storageService.getYesterdayWeather();
    if (!yesterday) return null;
    const tempDiff = Math.round(current.temp - yesterday.temp);
    const humDiff = Math.round(current.humidity - yesterday.humidity);
    const windDiff = Math.round((current.windSpeed - yesterday.windSpeed) * 10) / 10;

    const items = [];
    if (tempDiff > 0) items.push({ icon: 'trending-up', text: `${tempDiff}° warmer`, cls: 'warm' });
    else if (tempDiff < 0) items.push({ icon: 'trending-down', text: `${Math.abs(tempDiff)}° cooler`, cls: 'cool' });
    else items.push({ icon: 'remove', text: 'Same temp', cls: 'same' });

    if (humDiff > 5) items.push({ icon: 'water', text: 'More humid', cls: 'humid' });
    else if (humDiff < -5) items.push({ icon: 'water-outline', text: 'Less humid', cls: 'dry' });

    if (windDiff > 3) items.push({ icon: 'flag', text: 'Windier', cls: 'windy' });
    else if (windDiff < -3) items.push({ icon: 'flag', text: 'Calmer', cls: 'calm' });

    return { items, yesterday };
  }

  // ─── VOICE SEARCH ───
  startVoiceSearch() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { this.showToast('Voice search not supported in this browser', 'warning'); return; }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    const micBtn = document.getElementById('btn-voice-search');
    if (micBtn) micBtn.classList.add('voice-listening');

    recognition.onresult = (e) => {
      const query = e.results[0][0].transcript;
      const input = document.getElementById('search-input');
      if (input) { input.value = query; input.dispatchEvent(new Event('input')); }
      if (micBtn) micBtn.classList.remove('voice-listening');
      this.showToast(`Searching: "${query}"`, 'info', 2000);
    };
    recognition.onerror = () => { if (micBtn) micBtn.classList.remove('voice-listening'); this.showToast('Voice search failed', 'error'); };
    recognition.onend = () => { if (micBtn) micBtn.classList.remove('voice-listening'); };
    recognition.start();
  }

  // ─── GESTURE NAVIGATION (swipe between cities) ───
  initGestureNavigation() {
    const content = document.querySelector('.single-page-content');
    if (!content || this.favorites.length === 0) return;

    let startX = 0, startY = 0;
    content.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    }, { passive: true });

    content.addEventListener('touchend', (e) => {
      const dx = (e.changedTouches[0]?.clientX || 0) - startX;
      const dy = (e.changedTouches[0]?.clientY || 0) - startY;
      // Only trigger on horizontal swipe > 80px
      if (Math.abs(dx) > 80 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        if (this.preferences.haptic && navigator.vibrate) navigator.vibrate(15);
        if (dx > 0) this.swipeToCity('prev');
        else this.swipeToCity('next');
      }
    }, { passive: true });
  }

  swipeToCity(direction) {
    if (!this.favorites.length) return;
    const currentIdx = this.favorites.findIndex(f =>
      String(f.lat) === String(this.currentLocation?.lat) && String(f.lon) === String(this.currentLocation?.lon)
    );
    let nextIdx;
    if (direction === 'next') nextIdx = currentIdx + 1 >= this.favorites.length ? 0 : currentIdx + 1;
    else nextIdx = currentIdx - 1 < 0 ? this.favorites.length - 1 : currentIdx - 1;

    // Slide transition
    const inner = document.querySelector('.single-page-inner');
    if (inner) {
      inner.classList.add(direction === 'next' ? 'slide-out-left' : 'slide-out-right');
      setTimeout(() => {
        inner.classList.remove('slide-out-left', 'slide-out-right');
        this.selectCity(this.favorites[nextIdx]);
      }, 250);
    } else {
      this.selectCity(this.favorites[nextIdx]);
    }
  }

  // ─── DYNAMIC FAVICON ───
  updateFavicon(iconCode) {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 32; canvas.height = 32;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, 32, 32);
        let link = document.querySelector("link[rel~='icon']");
        if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link); }
        link.href = canvas.toDataURL('image/png');
      };
      img.src = weatherService.getIconUrl(iconCode);
    } catch (e) { /* silent */ }
  }

  // ─── WEATHER NOTIFICATIONS ───
  async sendWeatherNotification(current) {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') {
      await Notification.requestPermission();
    }
    if (Notification.permission !== 'granted') return;

    const alerts = this.getWeatherAlerts(current);
    if (alerts.length === 0) return;

    const top = alerts[0];
    try {
      new Notification(top.title, {
        body: top.msg,
        icon: weatherService.getIconUrl(current.icon),
        badge: '/icons/icon-72x72.png',
        tag: 'weather-alert',
        renotify: true
      });
    } catch (e) { /* mobile may block */ }
  }

  // ─── MULTI-CITY MINI WEATHER ───
  async loadMultiCityWeather() {
    if (!this.favorites.length) return [];
    const results = [];
    for (const city of this.favorites.slice(0, 5)) {
      try {
        const w = await weatherService.getCurrentWeatherByCoords(city.lat, city.lon, this.preferences.units);
        results.push({ ...city, temp: Math.round(w.temp), icon: w.icon, desc: w.description });
      } catch (e) { /* skip */ }
    }
    return results;
  }

  renderMultiCityStrip(cities) {
    if (!cities || cities.length === 0) return '';
    return `<div class="multi-city-strip">
      ${cities.map(c => `
        <button class="multi-city-chip" data-lat="${c.lat}" data-lon="${c.lon}" title="${c.name}">
          <img src="${weatherService.getIconUrl(c.icon)}" class="multi-city-icon" alt="">
          <span class="multi-city-name">${c.name?.substring(0, 10)}</span>
          <span class="multi-city-temp">${c.temp}°</span>
        </button>
      `).join('')}
    </div>`;
  }

  // ─── ACCESSIBILITY ANNOUNCEMENT ───
  announceWeather(current) {
    const liveRegion = document.getElementById('sr-live');
    if (!liveRegion) return;
    liveRegion.textContent = `Current weather in ${current.cityName}: ${Math.round(current.temp)} degrees, ${current.description}. High ${Math.round(current.tempMax)}, Low ${Math.round(current.tempMin)}. Wind ${current.windSpeed} kilometers per hour. Humidity ${current.humidity} percent.`;
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
    this.preferences.timeFormat = await storageService.getPreference('timeFormat', '12h');
    formatters.setTimeFormat(this.preferences.timeFormat);
    this.preferences.particles = await storageService.getPreference('particles', true);
    this.preferences.autoRefresh = await storageService.getPreference('autoRefresh', '30');
    this.preferences.windUnit = await storageService.getPreference('windUnit', 'default');
    this.preferences.haptic = await storageService.getPreference('haptic', true);
    this.preferences.highContrast = await storageService.getPreference('highContrast', false);
    theme.setTheme(this.preferences.theme);
    this.favorites = await storageService.getAllFavorites();

    // Apply high contrast
    document.body.classList.toggle('high-contrast', this.preferences.highContrast);

    // Start auto-refresh timer
    this.startAutoRefresh();
  }

  startAutoRefresh() {
    if (this._autoRefreshTimer) clearInterval(this._autoRefreshTimer);
    const mins = parseInt(this.preferences.autoRefresh);
    if (mins > 0) {
      this._autoRefreshTimer = setInterval(() => {
        if (this._isOnline) this.loadWeather();
      }, mins * 60 * 1000);
    }
  }

  async loadUserPreferences() {
    await this.loadPreferences();
  }

  // --- HTML TEMPLATES ---



  getWeatherAppHTML() {
    return `
      <div id="app-background" class="app-background-el"></div>
      <canvas id="weather-particles" class="weather-particles-canvas"></canvas>
      <!-- Screen reader live region -->
      <div id="sr-live" class="sr-only" aria-live="polite" aria-atomic="true"></div>

      <!-- Offline Banner -->
      <div id="offline-banner" class="offline-banner hidden">
        <ion-icon name="cloud-offline-outline"></ion-icon>
        <span>You're offline — showing cached data</span>
      </div>
      
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

            <div id="weather-details-content" class="single-page-details desktop-grid">
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
              <button id="btn-voice-search" class="voice-search-btn absolute right-10 top-1/2 -translate-y-1/2 p-1 text-white/50 hover:text-white transition" title="Voice Search" type="button">
                <ion-icon name="mic-outline" class="text-lg"></ion-icon>
              </button>
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

            <!-- Time Format -->
            <div class="space-y-4">
                <h3 class="section-label pl-2">Time Format</h3>
                <div class="card-light p-1 rounded-2xl flex relative">
                     <div class="w-1/2 h-full absolute top-0 left-0 bg-white/25 rounded-xl transition-all duration-300" id="time-format-indicator"></div>
                     <button class="flex-1 py-3 text-center z-10 font-medium text-white transition rounded-xl" id="btn-12h">12 Hour</button>
                     <button class="flex-1 py-3 text-center z-10 font-medium text-white/80 transition rounded-xl" id="btn-24h">24 Hour</button>
                </div>
            </div>

            <!-- Wind Speed Unit -->
            <div class="space-y-4">
                <h3 class="section-label pl-2">Wind Speed Unit</h3>
                <div id="wind-unit-grid" class="grid grid-cols-4 gap-2">
                    <button class="settings-chip ${this.preferences.windUnit === 'default' ? 'settings-chip-active' : ''}" data-wind-unit="default">Default</button>
                    <button class="settings-chip ${this.preferences.windUnit === 'ms' ? 'settings-chip-active' : ''}" data-wind-unit="ms">m/s</button>
                    <button class="settings-chip ${this.preferences.windUnit === 'mph' ? 'settings-chip-active' : ''}" data-wind-unit="mph">mph</button>
                    <button class="settings-chip ${this.preferences.windUnit === 'knots' ? 'settings-chip-active' : ''}" data-wind-unit="knots">knots</button>
                </div>
            </div>

            <!-- Auto-Refresh Interval -->
            <div class="space-y-4">
                <h3 class="section-label pl-2">Auto-Refresh</h3>
                <div id="refresh-interval-grid" class="grid grid-cols-4 gap-2">
                    <button class="settings-chip ${this.preferences.autoRefresh === '15' ? 'settings-chip-active' : ''}" data-refresh="15">15 min</button>
                    <button class="settings-chip ${this.preferences.autoRefresh === '30' ? 'settings-chip-active' : ''}" data-refresh="30">30 min</button>
                    <button class="settings-chip ${this.preferences.autoRefresh === '60' ? 'settings-chip-active' : ''}" data-refresh="60">1 hour</button>
                    <button class="settings-chip ${this.preferences.autoRefresh === '0' ? 'settings-chip-active' : ''}" data-refresh="0">Off</button>
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

            <!-- Experience Section -->
            <div class="space-y-3">
                <h3 class="section-label pl-2">Experience</h3>
                <div class="card-light p-4 rounded-2xl flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <div class="p-2.5 rounded-xl bg-white/15 text-white">
                           <ion-icon name="sparkles-outline"></ion-icon>
                        </div>
                        <div>
                          <span class="font-medium text-white block">Weather Particles</span>
                          <span class="text-[11px] text-white/50">Rain, snow & cloud animations</span>
                        </div>
                    </div>
                     <ion-toggle id="toggle-particles" ${this.preferences.particles ? 'checked' : ''}></ion-toggle>
                </div>
                <div class="card-light p-4 rounded-2xl flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <div class="p-2.5 rounded-xl bg-white/15 text-white">
                           <ion-icon name="phone-portrait-outline"></ion-icon>
                        </div>
                        <div>
                          <span class="font-medium text-white block">Haptic Feedback</span>
                          <span class="text-[11px] text-white/50">Vibration on pull-to-refresh & swipe</span>
                        </div>
                    </div>
                     <ion-toggle id="toggle-haptic" ${this.preferences.haptic ? 'checked' : ''}></ion-toggle>
                </div>
            </div>

            <!-- Accessibility Section -->
            <div class="space-y-3">
                <h3 class="section-label pl-2">Accessibility</h3>
                <div class="card-light p-4 rounded-2xl flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <div class="p-2.5 rounded-xl bg-white/15 text-white">
                           <ion-icon name="contrast-outline"></ion-icon>
                        </div>
                        <div>
                          <span class="font-medium text-white block">High Contrast</span>
                          <span class="text-[11px] text-white/50">Stronger text & borders</span>
                        </div>
                    </div>
                     <ion-toggle id="toggle-high-contrast" ${this.preferences.highContrast ? 'checked' : ''}></ion-toggle>
                </div>
            </div>

            <!-- Default Location -->
            <div class="space-y-4">
                <h3 class="section-label pl-2">Default Location</h3>
                <div class="card-light p-4 rounded-2xl">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <div class="p-2.5 rounded-xl bg-white/15 text-white">
                               <ion-icon name="location-outline"></ion-icon>
                            </div>
                            <div>
                              <div class="font-medium text-white" id="settings-default-location">${this.currentLocation?.name || 'Not set'}</div>
                              <div class="text-[11px] text-white/50">Used when GPS is unavailable</div>
                            </div>
                        </div>
                        <button id="btn-set-default-location" class="text-xs font-bold uppercase tracking-wide text-white/70 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full transition border border-white/15">
                          Set
                        </button>
                    </div>
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

    // ──── TIME FORMAT TOGGLE ────
    const timeIndicator = document.getElementById('time-format-indicator');
    const btn12 = document.getElementById('btn-12h');
    const btn24 = document.getElementById('btn-24h');
    const setTimeUI = (fmt) => {
      if (timeIndicator) timeIndicator.style.transform = fmt === '24h' ? 'translateX(100%)' : 'translateX(0)';
      btn12?.classList.toggle('text-white', fmt === '12h');
      btn12?.classList.toggle('text-white/60', fmt !== '12h');
      btn24?.classList.toggle('text-white', fmt === '24h');
      btn24?.classList.toggle('text-white/60', fmt !== '24h');
    };
    setTimeUI(this.preferences.timeFormat);
    btn12?.addEventListener('click', async () => {
      this.preferences.timeFormat = '12h';
      formatters.setTimeFormat('12h');
      setTimeUI('12h');
      await storageService.savePreference('timeFormat', '12h');
      this.showToast('Using 12-hour format', 'success', 1500);
      this.displayWeather();
    });
    btn24?.addEventListener('click', async () => {
      this.preferences.timeFormat = '24h';
      formatters.setTimeFormat('24h');
      setTimeUI('24h');
      await storageService.savePreference('timeFormat', '24h');
      this.showToast('Using 24-hour format', 'success', 1500);
      this.displayWeather();
    });

    // ──── WIND UNIT SELECTOR ────
    document.getElementById('wind-unit-grid')?.addEventListener('click', async (e) => {
      const btn = e.target.closest('[data-wind-unit]');
      if (!btn) return;
      const unit = btn.dataset.windUnit;
      this.preferences.windUnit = unit;
      await storageService.savePreference('windUnit', unit);
      document.querySelectorAll('#wind-unit-grid .settings-chip').forEach(c => c.classList.remove('settings-chip-active'));
      btn.classList.add('settings-chip-active');
      this.showToast(`Wind unit: ${unit === 'default' ? 'Auto' : unit}`, 'success', 1500);
      this.displayWeather();
    });

    // ──── AUTO-REFRESH INTERVAL ────
    document.getElementById('refresh-interval-grid')?.addEventListener('click', async (e) => {
      const btn = e.target.closest('[data-refresh]');
      if (!btn) return;
      const val = btn.dataset.refresh;
      this.preferences.autoRefresh = val;
      await storageService.savePreference('autoRefresh', val);
      document.querySelectorAll('#refresh-interval-grid .settings-chip').forEach(c => c.classList.remove('settings-chip-active'));
      btn.classList.add('settings-chip-active');
      this.startAutoRefresh();
      this.showToast(val === '0' ? 'Auto-refresh disabled' : `Refreshing every ${val} min`, 'success', 1500);
    });

    // ──── PARTICLES TOGGLE ────
    document.getElementById('toggle-particles')?.addEventListener('ionChange', async (e) => {
      this.preferences.particles = e.detail.checked;
      await storageService.savePreference('particles', e.detail.checked);
      const canvas = document.getElementById('weather-particles');
      if (canvas) {
        if (!e.detail.checked && this._particles) { this._particles.stop(); canvas.style.display = 'none'; }
        else if (e.detail.checked) { canvas.style.display = ''; if (this._particles) this._particles.start(); }
      }
    });

    // ──── HAPTIC TOGGLE ────
    document.getElementById('toggle-haptic')?.addEventListener('ionChange', async (e) => {
      this.preferences.haptic = e.detail.checked;
      await storageService.savePreference('haptic', e.detail.checked);
      this.showToast(e.detail.checked ? 'Haptic feedback enabled' : 'Haptic feedback disabled', 'success', 1500);
    });

    // ──── HIGH CONTRAST TOGGLE ────
    document.getElementById('toggle-high-contrast')?.addEventListener('ionChange', async (e) => {
      this.preferences.highContrast = e.detail.checked;
      await storageService.savePreference('highContrast', e.detail.checked);
      document.body.classList.toggle('high-contrast', e.detail.checked);
      this.showToast(e.detail.checked ? 'High contrast ON' : 'High contrast OFF', 'success', 1500);
    });

    // ──── DEFAULT LOCATION ────
    document.getElementById('btn-set-default-location')?.addEventListener('click', async () => {
      if (this.currentLocation) {
        await storageService.savePreference('defaultLocation', this.currentLocation);
        const el = document.getElementById('settings-default-location');
        if (el) el.textContent = this.currentLocation.name || `${this.currentLocation.lat}, ${this.currentLocation.lon}`;
        this.showToast('Default location saved!', 'success');
      } else {
        this.showToast('Load a location first', 'warning');
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

    // Show skeleton loading placeholders
    this.showSkeleton();

    this.attachWeatherListeners();
    this.attachAuthListeners();
    this.renderFavoritesList();
    this.loadWeather();

    // Init pull-to-refresh on mobile
    setTimeout(() => this.initPullToRefresh(), 500);

    // Init gesture navigation between saved cities
    setTimeout(() => this.initGestureNavigation(), 600);

    // Voice search button
    document.getElementById('btn-voice-search')?.addEventListener('click', () => this.startVoiceSearch());

    // Offline / online listeners
    const offlineBanner = document.getElementById('offline-banner');
    const updateOnlineStatus = () => {
      this._isOnline = navigator.onLine;
      if (offlineBanner) {
        offlineBanner.classList.toggle('hidden', this._isOnline);
      }
      if (this._isOnline) this.showToast('Back online — refreshing...', 'success');
      if (this._isOnline) this.loadWeather();
    };
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    if (!navigator.onLine && offlineBanner) offlineBanner.classList.remove('hidden');
  }

  showSkeleton() {
    const hero = document.getElementById('hero-weather');
    if (hero) {
      hero.innerHTML = `
        <div class="skeleton-group" style="display:flex;flex-direction:column;align-items:center;gap:12px;padding:16px 0">
          <div class="skeleton" style="width:100px;height:14px;border-radius:99px"></div>
          <div style="display:flex;align-items:center;gap:16px">
            <div class="skeleton" style="width:72px;height:72px;border-radius:50%"></div>
            <div>
              <div class="skeleton" style="width:80px;height:40px;border-radius:12px;margin-bottom:8px"></div>
              <div class="skeleton" style="width:100px;height:14px;border-radius:8px"></div>
            </div>
          </div>
          <div class="skeleton" style="width:120px;height:14px;border-radius:8px"></div>
        </div>
      `;
    }
    const details = document.getElementById('weather-details-content');
    if (details) {
      details.innerHTML = `
        <div class="card-light p-4"><div class="skeleton" style="width:100%;height:80px;border-radius:14px"></div></div>
        <div class="card-light p-4"><div class="skeleton" style="width:100%;height:60px;border-radius:14px"></div></div>
        <div class="grid grid-cols-3 gap-2.5">
          <div class="card-light p-4"><div class="skeleton" style="width:100%;height:50px;border-radius:14px"></div></div>
          <div class="card-light p-4"><div class="skeleton" style="width:100%;height:50px;border-radius:14px"></div></div>
          <div class="card-light p-4"><div class="skeleton" style="width:100%;height:50px;border-radius:14px"></div></div>
        </div>
      `;
    }
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

      // Save weather snapshot for tomorrow's comparison
      storageService.saveWeatherSnapshot({ temp: weather.temp, humidity: weather.humidity, windSpeed: weather.windSpeed, description: weather.description });

      // Load yesterday comparison (async, non-blocking)
      this.getWeatherComparison(weather).then(comp => { this._yesterdayComparison = comp; });

      // Load multi-city weather in background
      this.loadMultiCityWeather().then(cities => { this._multiCityData = cities; });

      // 3. Display
      this.displayWeather();

    } catch (err) {
      console.error(err);
      this.showToast('Failed to load weather: ' + err.message, 'error', 5000);
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

    // ─── WEATHER ALERTS ───
    this.renderAlerts(current);

    // ——— HERO SECTION ———
    const hero = document.getElementById('hero-weather');
    if (hero) {
      hero.innerHTML = `
        <div class="absolute top-0 right-0 p-2 fade-in flex gap-1" style="animation-delay:0.1s">
          <button id="btn-share" class="min-h-[44px] min-w-[44px] flex items-center justify-center text-xl text-white/70 hover:text-white transition-colors rounded-full hover:bg-white/10" aria-label="Share">
            <ion-icon name="share-outline"></ion-icon>
          </button>
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

      document.getElementById('btn-share')?.addEventListener('click', () => this.shareWeather());
      document.getElementById('btn-favorite')?.addEventListener('click', () => this.toggleFavorite());
      document.getElementById('btn-refresh-loc')?.addEventListener('click', () => this.loadWeather(true));
      this.updateFavoriteButtonState();
    }

    // ─── FEELS-LIKE CONTEXT ───
    const ctx = this.getFeelsLikeContext(current);

    // ─── ASTRONOMY DATA ───
    const astro = this.astronomyData;
    const moonPhase = astro?.moon?.phase ?? 0.5;
    const moonName = astro?.moon?.phaseName ?? 'Unknown';
    const moonIllum = astro?.moon?.illumination ?? '--';
    const moonrise = astro?.moon?.moonrise;
    const moonset = astro?.moon?.moonset;
    const dayLength = astro?.sun?.dayLength ?? '--';

    // ──── WIND ────
    const windDir = formatters.formatWindDirection(current.windDeg || 0);
    let windUnit = this.preferences.units === 'imperial' ? 'mph' : 'km/h';
    let windVal = current.windSpeed;
    if (this.preferences.windUnit !== 'default') {
      if (this.preferences.windUnit === 'ms') { windVal = this.preferences.units === 'imperial' ? current.windSpeed * 0.44704 : current.windSpeed / 3.6; windUnit = 'm/s'; }
      else if (this.preferences.windUnit === 'mph') { windVal = this.preferences.units === 'metric' ? current.windSpeed * 0.621371 : current.windSpeed; windUnit = 'mph'; }
      else if (this.preferences.windUnit === 'knots') { windVal = this.preferences.units === 'imperial' ? current.windSpeed * 0.868976 : current.windSpeed / 1.852; windUnit = 'kn'; }
      windVal = Math.round(windVal * 10) / 10;
    }

    // ──── DEW POINT & PRESSURE ────
    const dewPoint = this.getDewPoint(current.temp, current.humidity);
    const pTrend = this.getPressureTrend(current);

    // ──── WEATHER PARTICLES ────
    const particlesCanvas = document.getElementById('weather-particles');
    if (particlesCanvas) {
      if (!this.preferences.particles) {
        if (this._particles) this._particles.stop();
        particlesCanvas.style.display = 'none';
      } else {
        particlesCanvas.style.display = '';
        if (!this._particles) this._particles = new WeatherParticles(particlesCanvas);
        this._particles.setWeather(current.weather);
        this._particles.start();
      }
    }

    // ──── ACTIVITIES ────
    const activities = this.getActivitySuggestions(current);

    // ──── DYNAMIC FAVICON ────
    this.updateFavicon(current.icon);

    // ──── ACCESSIBILITY ────
    this.announceWeather(current);

    // ──── WEATHER NOTIFICATIONS ────
    this.sendWeatherNotification(current);

    // ——— DETAILS SECTION ———
    const details = document.getElementById('weather-details-content');
    if (details) {

      // Build comparison HTML asynchronously  
      const comparisonData = this._yesterdayComparison;
      const comparisonHTML = comparisonData ? `
        <section class="card-light p-4 fade-in" style="animation-delay:0.42s">
          <h2 class="section-label">vs. Yesterday</h2>
          <div class="comparison-card">
            ${comparisonData.items.map(item => `
              <div class="comparison-item comparison-${item.cls}">
                <ion-icon name="${item.icon}"></ion-icon>
                <span>${item.text}</span>
              </div>
            `).join('')}
          </div>
        </section>
      ` : '';

      // Multi-city strip
      const multiCityHTML = this._multiCityData.length > 0 ? `
        <section class="fade-in" style="animation-delay:0.40s">
          ${this.renderMultiCityStrip(this._multiCityData)}
        </section>
      ` : '';

      details.innerHTML = `

        ${multiCityHTML}

        ${comparisonHTML}

        <!-- ★ FEELS-LIKE CONTEXT CARD ★ -->
        <section class="card-light p-4 fade-in" style="animation-delay:0.45s">
          <h2 class="section-label">How It Feels</h2>
          <div class="feels-context">
            <div class="feels-main">
              <ion-icon name="${ctx.icon}" class="feels-icon"></ion-icon>
              <div>
                <div class="feels-feeling">${ctx.feeling}</div>
                <div class="feels-advice">${ctx.advice}</div>
              </div>
            </div>
            ${ctx.tips.length ? `
            <div class="feels-tips">
              ${ctx.tips.map(t => `
                <div class="feels-tip">
                  <ion-icon name="${t.icon}"></ion-icon>
                  <span>${t.text}</span>
                </div>
              `).join('')}
            </div>` : ''}
          </div>
        </section>

        <!-- ★ ACTIVITY SUGGESTIONS ★ -->
        ${activities.length ? `
        <section class="card-light p-4 fade-in" style="animation-delay:0.47s">
          <h2 class="section-label">Today's Activities</h2>
          <div class="activity-suggestions">
            ${activities.map(a => `
              <div class="activity-chip">
                <span class="activity-emoji">${a.emoji}</span>
                <span class="activity-text">${a.text}</span>
              </div>
            `).join('')}
          </div>
        </section>` : ''}

        <!-- ★ PRECIPITATION TIMELINE ★ -->
        <section class="card-light p-4 fade-in" style="animation-delay:0.48s">
          <h2 class="section-label">Rain Chance — Next 6h</h2>
          ${this.getPrecipTimeline(hourly)}
        </section>

        <!-- ★ HOURLY FORECAST with Now indicator ★ -->
        <section class="card-light p-4 fade-in" style="animation-delay:0.5s">
          <h2 class="section-label">Hourly Forecast</h2>
          <div class="hourly-scroll">
            ${(hourly || []).map((h, idx) => `
              <div class="hourly-item${idx === 0 ? ' hourly-active hourly-now' : ''}">
                ${idx === 0 ? '<div class="hourly-now-dot"></div>' : ''}
                <span class="hourly-time">${idx === 0 ? 'Now' : formatters.formatTime(h.time)}</span>
                <img src="${weatherService.getIconUrl(h.icon)}" class="hourly-icon" alt="" onerror="this.style.display='none'">
                <span class="hourly-temp">${Math.round(h.temp)}°</span>
                <span class="hourly-rain"><ion-icon name="water" class="text-[9px] text-blue-300/90"></ion-icon> ${h.pop}%</span>
              </div>
            `).join('')}
          </div>
        </section>

        <!-- ★ 7-DAY FORECAST (expandable) ★ -->
        <section class="card-light p-4 fade-in" style="animation-delay:0.6s">
          <h2 class="section-label">7-Day Forecast</h2>
          <div class="daily-list">
            ${(daily || []).map((d, i) => `
              <div class="daily-row-wrap">
                <div class="daily-row daily-row-expandable${i < (daily.length - 1) ? ' daily-row-border' : ''}" data-daily-idx="${i}">
                  <span class="daily-day">${formatters.formatShortDay(d.date)}</span>
                  <img src="${weatherService.getIconUrl(d.icon)}" class="daily-icon-img" alt="" onerror="this.style.display='none'">
                  <span class="daily-desc-text">${d.description}</span>
                  <span class="daily-temp-range">
                    <span class="daily-min">${Math.round(d.tempMin)}°</span>
                    <span class="daily-range-bar"><span class="daily-range-fill" style="left:${this._getTempBarPos(d.tempMin, daily)}%;right:${100 - this._getTempBarPos(d.tempMax, daily)}%"></span></span>
                    <span class="daily-max">${Math.round(d.tempMax)}°</span>
                  </span>
                  <ion-icon name="chevron-down-outline" class="daily-expand-icon"></ion-icon>
                </div>
                <div class="daily-expand-content" id="daily-expand-${i}">
                  <div class="daily-expand-inner">
                    <div class="daily-expand-detail"><ion-icon name="water"></ion-icon> Rain: ${d.pop}%</div>
                    <div class="daily-expand-detail"><ion-icon name="thermometer-outline"></ion-icon> ${d.description}</div>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </section>

        <!-- ★ WIND COMPASS CARD ★ -->
        <section class="card-light p-4 fade-in" style="animation-delay:0.65s">
          <h2 class="section-label">Wind</h2>
          <div class="wind-compass-card">
            <div class="wind-compass-svg">${this.getWindCompassSVG(current.windDeg || 0, current.windSpeed)}</div>
            <div class="wind-compass-info">
              <div class="wind-compass-speed">${windVal}<span class="metric-unit"> ${windUnit}</span></div>
              <div class="wind-compass-dir">${windDir}</div>
              <div class="wind-compass-label">Direction: ${current.windDeg || 0}°</div>
            </div>
          </div>
        </section>

        <!-- ★ METRICS GRID — 4 cols with dew point & pressure trend ★ -->
        <div class="grid grid-cols-4 gap-2 fade-in" style="animation-delay:0.7s">
          <div class="metric-card">
            <div class="metric-icon"><img src="${weatherService.getMetricIconUrl('humidity')}" class="metric-icon-img" alt="humidity"></div>
            <div class="metric-label">Humidity</div>
            <div class="metric-value">${current.humidity}<span class="metric-unit">%</span></div>
          </div>
          <div class="metric-card">
            <div class="metric-icon"><img src="${weatherService.getMetricIconUrl('thermometer')}" class="metric-icon-img" alt="dew point"></div>
            <div class="metric-label">Dew Pt</div>
            <div class="metric-value">${dewPoint}<span class="metric-unit">°</span></div>
          </div>
          <div class="metric-card">
            <div class="metric-icon"><img src="${weatherService.getMetricIconUrl('barometer')}" class="metric-icon-img" alt="pressure"></div>
            <div class="metric-label">Pressure</div>
            <div class="metric-value metric-value-sm">${current.pressure}<span class="metric-unit"> hPa</span></div>
            <div class="pressure-trend pressure-${pTrend.cls}">${pTrend.arrow} ${pTrend.label}</div>
          </div>
          <div class="metric-card">
            <div class="metric-icon"><img src="${weatherService.getMetricIconUrl('mist')}" class="metric-icon-img" alt="visibility"></div>
            <div class="metric-label">Vis</div>
            <div class="metric-value metric-value-sm">${(current.visibility / 1000).toFixed(1)}<span class="metric-unit"> km</span></div>
          </div>
        </div>

        <!-- ★ AIR QUALITY DETAILS CARD ★ -->
        ${airQuality ? `
        <section class="card-light p-4 fade-in" style="animation-delay:0.75s">
          <h2 class="section-label">Air Quality</h2>
          <div class="aqi-details">
            <div class="aqi-header">
              <div class="aqi-badge" style="background:${this.getAQIColor(airQuality.aqi)}">${airQuality.aqi}</div>
              <div class="aqi-desc">
                <div class="aqi-level" style="color:${this.getAQIColor(airQuality.aqi)}">${airQuality.aqiDescription}</div>
                <div class="aqi-health">${airQuality.healthRecommendation}</div>
              </div>
            </div>
            <div class="aqi-bar-track">
              <div class="aqi-bar-fill" style="width:${this.getAQIBarWidth(airQuality.aqi)}%;background:${this.getAQIColor(airQuality.aqi)}"></div>
            </div>
            <div class="aqi-components">
              <div class="aqi-comp"><span class="aqi-comp-label">PM2.5</span><span class="aqi-comp-val">${airQuality.components.pm2_5?.toFixed(1) ?? '--'}</span></div>
              <div class="aqi-comp"><span class="aqi-comp-label">PM10</span><span class="aqi-comp-val">${airQuality.components.pm10?.toFixed(1) ?? '--'}</span></div>
              <div class="aqi-comp"><span class="aqi-comp-label">O₃</span><span class="aqi-comp-val">${airQuality.components.o3?.toFixed(1) ?? '--'}</span></div>
              <div class="aqi-comp"><span class="aqi-comp-label">NO₂</span><span class="aqi-comp-val">${airQuality.components.no2?.toFixed(1) ?? '--'}</span></div>
              <div class="aqi-comp"><span class="aqi-comp-label">CO</span><span class="aqi-comp-val">${airQuality.components.co?.toFixed(0) ?? '--'}</span></div>
            </div>
          </div>
        </section>` : ''}

        <!-- ★ UV INDEX GAUGE ★ -->
        <section class="card-light p-4 fade-in" style="animation-delay:0.76s">
          <h2 class="section-label">UV Index</h2>
          <div class="uv-gauge-card">
            ${this.getUVGaugeSVG(uv || current.clouds < 30 ? Math.min(Math.round((90 - current.clouds) / 10), 11) : Math.max(1, Math.round((90 - current.clouds) / 15)))}
            <div class="uv-gauge-tip">${(uv || 0) > 5 || current.clouds < 40 ? 'Apply sunscreen if going outside' : 'Low UV — no protection needed'}</div>
          </div>
        </section>

        <!-- ★ SUNRISE/SUNSET ARC ★ -->
        <div class="card-light p-4 fade-in" style="animation-delay:0.82s">
          <h2 class="section-label">Sun Tracker</h2>
          <div class="sun-arc-wrapper">
            ${this.getSunArcSVG(current.sunrise, current.sunset)}
          </div>
          <div class="text-center text-xs text-white/50 mt-1">Day length: ${dayLength} hours</div>
        </div>

        <!-- ★ MOON PHASE WIDGET ★ -->
        <section class="card-light p-4 fade-in" style="animation-delay:0.85s">
          <h2 class="section-label">Moon Phase</h2>
          <div class="moon-phase-card">
            <div class="moon-phase-svg">${this.getMoonPhaseSVG(moonPhase)}</div>
            <div class="moon-phase-info">
              <div class="moon-phase-name">${moonName}</div>
              <div class="moon-phase-illum">${moonIllum}% illuminated</div>
              <div class="moon-phase-times">
                ${moonrise ? `<span><ion-icon name="arrow-up-circle-outline"></ion-icon> ${formatters.formatTime(moonrise)}</span>` : ''}
                ${moonset ? `<span><ion-icon name="arrow-down-circle-outline"></ion-icon> ${formatters.formatTime(moonset)}</span>` : ''}
              </div>
            </div>
          </div>
        </section>
      `;

      // Init expandable daily rows
      details.querySelectorAll('.daily-row-expandable').forEach(row => {
        row.addEventListener('click', () => {
          const idx = row.dataset.dailyIdx;
          const content = document.getElementById(`daily-expand-${idx}`);
          const icon = row.querySelector('.daily-expand-icon');
          const isOpen = content.classList.contains('open');
          // Close all
          details.querySelectorAll('.daily-expand-content').forEach(c => c.classList.remove('open'));
          details.querySelectorAll('.daily-expand-icon').forEach(ic => ic.classList.remove('rotated'));
          if (!isOpen) {
            content.classList.add('open');
            icon.classList.add('rotated');
          }
        });
      });

      // Multi-city chip click handlers
      details.querySelectorAll('.multi-city-chip').forEach(chip => {
        chip.addEventListener('click', () => {
          this.selectCity({ lat: chip.dataset.lat, lon: chip.dataset.lon });
        });
      });
    }
  }

  // ─── HELPER: Temp bar position for daily range bars ───
  _getTempBarPos(temp, daily) {
    const allTemps = daily.flatMap(d => [d.tempMin, d.tempMax]);
    const min = Math.min(...allTemps);
    const max = Math.max(...allTemps);
    if (max === min) return 50;
    return Math.round(((temp - min) / (max - min)) * 100);
  }

  // ─── PULL TO REFRESH ───
  initPullToRefresh() {
    const content = document.querySelector('.single-page-content');
    if (!content) return;

    let indicator = document.getElementById('pull-indicator');
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = 'pull-indicator';
      indicator.className = 'pull-indicator';
      indicator.innerHTML = '<div class="pull-spinner"><ion-icon name="refresh"></ion-icon></div><span>Pull to refresh</span>';
      content.parentElement.insertBefore(indicator, content);
    }

    content.addEventListener('touchstart', (e) => {
      if (content.scrollTop <= 0) {
        this._pullStartY = e.touches[0].clientY;
        this._isPulling = true;
      }
    }, { passive: true });

    content.addEventListener('touchmove', (e) => {
      if (!this._isPulling) return;
      const dy = e.touches[0].clientY - this._pullStartY;
      if (dy > 0 && content.scrollTop <= 0) {
        const progress = Math.min(dy / 120, 1);
        indicator.style.transform = `translateY(${Math.min(dy * 0.5, 60)}px)`;
        indicator.style.opacity = progress;
        indicator.querySelector('.pull-spinner').style.transform = `rotate(${progress * 360}deg)`;
        if (progress >= 1) indicator.querySelector('span').textContent = 'Release to refresh';
        else indicator.querySelector('span').textContent = 'Pull to refresh';
      }
    }, { passive: true });

    content.addEventListener('touchend', (e) => {
      if (!this._isPulling) return;
      this._isPulling = false;
      const dy = (e.changedTouches?.[0]?.clientY || 0) - this._pullStartY;
      indicator.style.transition = 'all 0.3s ease';
      indicator.style.transform = 'translateY(0)';
      indicator.style.opacity = '0';
      setTimeout(() => { indicator.style.transition = ''; }, 300);
      if (dy > 120) {
        if (this.preferences.haptic && navigator.vibrate) navigator.vibrate(30);
        this.loadWeather(true);
      }
    }, { passive: true });
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
