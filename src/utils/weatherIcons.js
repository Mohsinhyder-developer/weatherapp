/**
 * Premium Animated Weather Icon Set
 * 
 * Style: Thin stroke, soft rounded edges, minimal, glassmorphism compatible
 * Theme: Dark teal gradient with subtle glow
 * Colors: Soft white (#ffffffcc), light cyan (#a8e6f0), muted orange (#f0c878)
 * 
 * All icons are inline SVG with CSS animations.
 * Maps OpenWeatherMap icon codes → custom animated SVGs.
 */

// ─── SHARED SVG DEFS (glow filters) ───
const GLOW_DEFS = `
  <defs>
    <filter id="glow-white" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="2" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
    <filter id="glow-cyan" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="2.5" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <filter id="glow-warm" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="3" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
`;

// Use unique filter IDs per icon instance to avoid conflicts
let _iconId = 0;
function uid() { return `wi${++_iconId}`; }

// ─── CORE ICON SVGs ───

function sunIcon(size = 48) {
  const id = uid();
  return `<svg class="w-icon w-icon-sun" viewBox="0 0 64 64" width="${size}" height="${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="g-${id}" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    <g filter="url(#g-${id})">
      <!-- Sun circle -->
      <circle cx="32" cy="32" r="10" stroke="#f0c878" stroke-width="1.8" fill="none" class="w-anim-pulse-soft"/>
      <!-- Rays -->
      <g class="w-anim-spin-slow" style="transform-origin:32px 32px">
        <line x1="32" y1="8" x2="32" y2="15" stroke="#f0c878" stroke-width="1.5" stroke-linecap="round" opacity="0.9"/>
        <line x1="32" y1="49" x2="32" y2="56" stroke="#f0c878" stroke-width="1.5" stroke-linecap="round" opacity="0.9"/>
        <line x1="8" y1="32" x2="15" y2="32" stroke="#f0c878" stroke-width="1.5" stroke-linecap="round" opacity="0.9"/>
        <line x1="49" y1="32" x2="56" y2="32" stroke="#f0c878" stroke-width="1.5" stroke-linecap="round" opacity="0.9"/>
        <line x1="14.3" y1="14.3" x2="19.2" y2="19.2" stroke="#f0c878" stroke-width="1.3" stroke-linecap="round" opacity="0.7"/>
        <line x1="44.8" y1="44.8" x2="49.7" y2="49.7" stroke="#f0c878" stroke-width="1.3" stroke-linecap="round" opacity="0.7"/>
        <line x1="49.7" y1="14.3" x2="44.8" y2="19.2" stroke="#f0c878" stroke-width="1.3" stroke-linecap="round" opacity="0.7"/>
        <line x1="19.2" y1="44.8" x2="14.3" y2="49.7" stroke="#f0c878" stroke-width="1.3" stroke-linecap="round" opacity="0.7"/>
      </g>
    </g>
  </svg>`;
}

function moonIcon(size = 48) {
  const id = uid();
  return `<svg class="w-icon w-icon-moon" viewBox="0 0 64 64" width="${size}" height="${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="g-${id}" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    <g filter="url(#g-${id})" class="w-anim-float">
      <!-- Crescent moon -->
      <path d="M36 12a20 20 0 1 0 0 40 16 16 0 0 1 0-40z" stroke="#d4e5ff" stroke-width="1.8" fill="none"/>
      <!-- Small stars -->
      <circle cx="18" cy="18" r="1" fill="#d4e5ff" opacity="0.6" class="w-anim-twinkle"/>
      <circle cx="14" cy="30" r="0.8" fill="#d4e5ff" opacity="0.4" class="w-anim-twinkle" style="animation-delay:0.8s"/>
      <circle cx="22" cy="12" r="0.6" fill="#d4e5ff" opacity="0.5" class="w-anim-twinkle" style="animation-delay:1.5s"/>
    </g>
  </svg>`;
}

function cloudIcon(size = 48) {
  const id = uid();
  return `<svg class="w-icon w-icon-cloud" viewBox="0 0 64 64" width="${size}" height="${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="g-${id}" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="1.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    <g filter="url(#g-${id})" class="w-anim-drift">
      <path d="M18 44h28a10 10 0 0 0 2-19.8A14 14 0 0 0 22 24a12 12 0 0 0-4 20z" 
            stroke="rgba(255,255,255,0.85)" stroke-width="1.6" fill="none" stroke-linejoin="round"/>
    </g>
  </svg>`;
}

function fewCloudsDay(size = 48) {
  const id = uid();
  return `<svg class="w-icon w-icon-few-clouds" viewBox="0 0 64 64" width="${size}" height="${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="g-${id}" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    <g filter="url(#g-${id})">
      <!-- Sun peeking -->
      <g class="w-anim-pulse-soft">
        <circle cx="22" cy="22" r="8" stroke="#f0c878" stroke-width="1.5" fill="none"/>
        <line x1="22" y1="8" x2="22" y2="12" stroke="#f0c878" stroke-width="1.2" stroke-linecap="round" opacity="0.7"/>
        <line x1="8" y1="22" x2="12" y2="22" stroke="#f0c878" stroke-width="1.2" stroke-linecap="round" opacity="0.7"/>
        <line x1="11.2" y1="11.2" x2="14.6" y2="14.6" stroke="#f0c878" stroke-width="1.1" stroke-linecap="round" opacity="0.5"/>
      </g>
      <!-- Cloud in front -->
      <g class="w-anim-drift">
        <path d="M20 48h28a9 9 0 0 0 1.5-17.8A12 12 0 0 0 25 30a10.5 10.5 0 0 0-5 18z" 
              stroke="rgba(255,255,255,0.85)" stroke-width="1.6" fill="none" stroke-linejoin="round"/>
      </g>
    </g>
  </svg>`;
}

function fewCloudsNight(size = 48) {
  const id = uid();
  return `<svg class="w-icon w-icon-few-clouds-night" viewBox="0 0 64 64" width="${size}" height="${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="g-${id}" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    <g filter="url(#g-${id})">
      <!-- Moon peeking -->
      <g class="w-anim-float">
        <path d="M28 10a14 14 0 1 0 0 24 11 11 0 0 1 0-24z" stroke="#d4e5ff" stroke-width="1.4" fill="none" opacity="0.7"/>
      </g>
      <!-- Cloud in front -->
      <g class="w-anim-drift">
        <path d="M20 48h28a9 9 0 0 0 1.5-17.8A12 12 0 0 0 25 30a10.5 10.5 0 0 0-5 18z" 
              stroke="rgba(255,255,255,0.85)" stroke-width="1.6" fill="none" stroke-linejoin="round"/>
      </g>
    </g>
  </svg>`;
}

function rainIcon(size = 48) {
  const id = uid();
  return `<svg class="w-icon w-icon-rain" viewBox="0 0 64 64" width="${size}" height="${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="g-${id}" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="1.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    <g filter="url(#g-${id})">
      <!-- Cloud -->
      <path d="M16 36h30a9 9 0 0 0 1.5-17.8A12 12 0 0 0 23 18a10.5 10.5 0 0 0-7 18z" 
            stroke="rgba(255,255,255,0.8)" stroke-width="1.5" fill="none" stroke-linejoin="round"/>
      <!-- Rain drops -->
      <g class="w-anim-rain">
        <line x1="24" y1="40" x2="22" y2="48" stroke="#a8e6f0" stroke-width="1.3" stroke-linecap="round" opacity="0.8"/>
        <line x1="32" y1="41" x2="30" y2="50" stroke="#a8e6f0" stroke-width="1.3" stroke-linecap="round" opacity="0.7" style="animation-delay:0.3s"/>
        <line x1="40" y1="40" x2="38" y2="48" stroke="#a8e6f0" stroke-width="1.3" stroke-linecap="round" opacity="0.8" style="animation-delay:0.6s"/>
      </g>
    </g>
  </svg>`;
}

function showerRainIcon(size = 48) {
  const id = uid();
  return `<svg class="w-icon w-icon-shower" viewBox="0 0 64 64" width="${size}" height="${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="g-${id}" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="1.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    <g filter="url(#g-${id})">
      <!-- Cloud -->
      <path d="M16 34h30a9 9 0 0 0 1.5-17.8A12 12 0 0 0 23 16a10.5 10.5 0 0 0-7 18z" 
            stroke="rgba(255,255,255,0.8)" stroke-width="1.5" fill="none" stroke-linejoin="round"/>
      <!-- Heavy rain -->
      <g class="w-anim-rain-heavy">
        <line x1="21" y1="38" x2="18" y2="50" stroke="#a8e6f0" stroke-width="1.2" stroke-linecap="round" opacity="0.75"/>
        <line x1="28" y1="39" x2="25" y2="52" stroke="#a8e6f0" stroke-width="1.2" stroke-linecap="round" opacity="0.7" style="animation-delay:0.15s"/>
        <line x1="35" y1="38" x2="32" y2="50" stroke="#a8e6f0" stroke-width="1.2" stroke-linecap="round" opacity="0.75" style="animation-delay:0.3s"/>
        <line x1="42" y1="39" x2="39" y2="52" stroke="#a8e6f0" stroke-width="1.2" stroke-linecap="round" opacity="0.7" style="animation-delay:0.45s"/>
      </g>
    </g>
  </svg>`;
}

function thunderstormIcon(size = 48) {
  const id = uid();
  return `<svg class="w-icon w-icon-thunder" viewBox="0 0 64 64" width="${size}" height="${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="g-${id}" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    <g filter="url(#g-${id})">
      <!-- Cloud -->
      <path d="M14 32h34a9 9 0 0 0 1.5-17.8A12 12 0 0 0 25 14a10.5 10.5 0 0 0-11 18z" 
            stroke="rgba(255,255,255,0.75)" stroke-width="1.5" fill="none" stroke-linejoin="round"/>
      <!-- Lightning bolt -->
      <g class="w-anim-flash">
        <polyline points="30,34 27,42 33,42 29,54" stroke="#f0d878" stroke-width="1.8" fill="none" stroke-linejoin="round" stroke-linecap="round"/>
      </g>
      <!-- Rain drops -->
      <g class="w-anim-rain">
        <line x1="20" y1="36" x2="18" y2="44" stroke="#a8e6f0" stroke-width="1.1" stroke-linecap="round" opacity="0.6"/>
        <line x1="42" y1="36" x2="40" y2="44" stroke="#a8e6f0" stroke-width="1.1" stroke-linecap="round" opacity="0.6" style="animation-delay:0.4s"/>
      </g>
    </g>
  </svg>`;
}

function snowIcon(size = 48) {
  const id = uid();
  return `<svg class="w-icon w-icon-snow" viewBox="0 0 64 64" width="${size}" height="${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="g-${id}" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="1.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    <g filter="url(#g-${id})">
      <!-- Cloud -->
      <path d="M16 32h30a9 9 0 0 0 1.5-17.8A12 12 0 0 0 23 14a10.5 10.5 0 0 0-7 18z" 
            stroke="rgba(255,255,255,0.8)" stroke-width="1.5" fill="none" stroke-linejoin="round"/>
      <!-- Snowflakes (crystal-like) -->
      <g class="w-anim-snow">
        <g transform="translate(22,42)" class="w-anim-twinkle">
          <line x1="0" y1="-3" x2="0" y2="3" stroke="#d4e5ff" stroke-width="1" stroke-linecap="round"/>
          <line x1="-2.6" y1="-1.5" x2="2.6" y2="1.5" stroke="#d4e5ff" stroke-width="1" stroke-linecap="round"/>
          <line x1="-2.6" y1="1.5" x2="2.6" y2="-1.5" stroke="#d4e5ff" stroke-width="1" stroke-linecap="round"/>
        </g>
        <g transform="translate(32,46)" class="w-anim-twinkle" style="animation-delay:0.6s">
          <line x1="0" y1="-2.5" x2="0" y2="2.5" stroke="#d4e5ff" stroke-width="1" stroke-linecap="round"/>
          <line x1="-2.2" y1="-1.3" x2="2.2" y2="1.3" stroke="#d4e5ff" stroke-width="1" stroke-linecap="round"/>
          <line x1="-2.2" y1="1.3" x2="2.2" y2="-1.3" stroke="#d4e5ff" stroke-width="1" stroke-linecap="round"/>
        </g>
        <g transform="translate(42,40)" class="w-anim-twinkle" style="animation-delay:1.2s">
          <line x1="0" y1="-2.5" x2="0" y2="2.5" stroke="#d4e5ff" stroke-width="1" stroke-linecap="round"/>
          <line x1="-2.2" y1="-1.3" x2="2.2" y2="1.3" stroke="#d4e5ff" stroke-width="1" stroke-linecap="round"/>
          <line x1="-2.2" y1="1.3" x2="2.2" y2="-1.3" stroke="#d4e5ff" stroke-width="1" stroke-linecap="round"/>
        </g>
      </g>
    </g>
  </svg>`;
}

function mistIcon(size = 48) {
  const id = uid();
  return `<svg class="w-icon w-icon-mist" viewBox="0 0 64 64" width="${size}" height="${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="g-${id}" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="1.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    <g filter="url(#g-${id})" class="w-anim-drift-slow">
      <line x1="12" y1="22" x2="52" y2="22" stroke="rgba(255,255,255,0.5)" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="16" y1="30" x2="48" y2="30" stroke="rgba(255,255,255,0.4)" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="10" y1="38" x2="54" y2="38" stroke="rgba(255,255,255,0.35)" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="18" y1="46" x2="46" y2="46" stroke="rgba(255,255,255,0.25)" stroke-width="1.5" stroke-linecap="round"/>
    </g>
  </svg>`;
}

// ─── METRIC ICONS ───

function windIcon(size = 24) {
  const id = uid();
  return `<svg class="w-icon w-icon-metric w-icon-wind" viewBox="0 0 32 32" width="${size}" height="${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="g-${id}" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="1" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    <g filter="url(#g-${id})" class="w-anim-drift-subtle">
      <path d="M4 12h16a4 4 0 1 0-4-4" stroke="#a8e6f0" stroke-width="1.4" stroke-linecap="round" fill="none"/>
      <path d="M6 18h18a3.5 3.5 0 1 1-3.5 3.5" stroke="#a8e6f0" stroke-width="1.4" stroke-linecap="round" fill="none"/>
      <path d="M8 24h10a3 3 0 1 1-3 3" stroke="#a8e6f0" stroke-width="1.2" stroke-linecap="round" fill="none" opacity="0.7"/>
    </g>
  </svg>`;
}

function humidityIcon(size = 24) {
  const id = uid();
  return `<svg class="w-icon w-icon-metric w-icon-humidity" viewBox="0 0 32 32" width="${size}" height="${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="g-${id}" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="1" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    <g filter="url(#g-${id})" class="w-anim-pulse-soft">
      <path d="M16 4L8 16a8 8 0 1 0 16 0z" stroke="#a8e6f0" stroke-width="1.4" fill="none" stroke-linejoin="round" stroke-linecap="round"/>
      <circle cx="14" cy="19" r="1.2" fill="#a8e6f0" opacity="0.4"/>
    </g>
  </svg>`;
}

function uvIcon(size = 24) {
  const id = uid();
  return `<svg class="w-icon w-icon-metric w-icon-uv" viewBox="0 0 32 32" width="${size}" height="${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="g-${id}" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="1.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    <g filter="url(#g-${id})" class="w-anim-pulse-soft">
      <!-- Half sun -->
      <path d="M16 22a7 7 0 0 1 0-14" stroke="#f0c878" stroke-width="1.4" fill="none"/>
      <path d="M16 22a7 7 0 0 0 0-14" stroke="#f0c878" stroke-width="1.4" fill="none" opacity="0.6"/>
      <!-- UV rays -->
      <line x1="16" y1="3" x2="16" y2="6" stroke="#f0c878" stroke-width="1.2" stroke-linecap="round" opacity="0.8"/>
      <line x1="25" y1="6.5" x2="23.5" y2="8.5" stroke="#f0c878" stroke-width="1" stroke-linecap="round" opacity="0.6"/>
      <line x1="7" y1="6.5" x2="8.5" y2="8.5" stroke="#f0c878" stroke-width="1" stroke-linecap="round" opacity="0.6"/>
      <line x1="28" y1="15" x2="25.5" y2="15" stroke="#f0c878" stroke-width="1" stroke-linecap="round" opacity="0.6"/>
      <line x1="4" y1="15" x2="6.5" y2="15" stroke="#f0c878" stroke-width="1" stroke-linecap="round" opacity="0.6"/>
      <!-- UV text hint -->
      <line x1="8" y1="28" x2="24" y2="28" stroke="#f0c878" stroke-width="1" stroke-linecap="round" opacity="0.3"/>
    </g>
  </svg>`;
}

function aqiIcon(size = 24) {
  const id = uid();
  return `<svg class="w-icon w-icon-metric w-icon-aqi" viewBox="0 0 32 32" width="${size}" height="${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="g-${id}" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="1" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    <g filter="url(#g-${id})" class="w-anim-breathe">
      <!-- Leaf/air quality -->
      <path d="M10 24C10 24 8 16 16 12c8-4 14-2 14-2s-2 8-10 12c-4 2-6 4-6 4" stroke="#a8e6f0" stroke-width="1.3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M16 12c-2 4-4 8-6 12" stroke="#a8e6f0" stroke-width="1" fill="none" stroke-linecap="round" opacity="0.5"/>
      <!-- Small particles -->
      <circle cx="6" cy="10" r="1" fill="#a8e6f0" opacity="0.3" class="w-anim-twinkle"/>
      <circle cx="10" cy="6" r="0.8" fill="#a8e6f0" opacity="0.25" class="w-anim-twinkle" style="animation-delay:0.7s"/>
    </g>
  </svg>`;
}

function sunriseIcon(size = 24) {
  const id = uid();
  return `<svg class="w-icon w-icon-metric w-icon-sunrise" viewBox="0 0 32 32" width="${size}" height="${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="g-${id}" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="1.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    <g filter="url(#g-${id})">
      <!-- Horizon -->
      <line x1="4" y1="22" x2="28" y2="22" stroke="rgba(255,255,255,0.4)" stroke-width="1.2" stroke-linecap="round"/>
      <!-- Sun rising -->
      <g class="w-anim-rise">
        <path d="M10 22a6 6 0 0 1 12 0" stroke="#f0c878" stroke-width="1.4" fill="none"/>
        <!-- Rays -->
        <line x1="16" y1="10" x2="16" y2="13" stroke="#f0c878" stroke-width="1.1" stroke-linecap="round" opacity="0.8"/>
        <line x1="8.5" y1="14" x2="10.5" y2="16" stroke="#f0c878" stroke-width="1" stroke-linecap="round" opacity="0.6"/>
        <line x1="23.5" y1="14" x2="21.5" y2="16" stroke="#f0c878" stroke-width="1" stroke-linecap="round" opacity="0.6"/>
      </g>
      <!-- Arrow up -->
      <polyline points="13,27 16,24 19,27" stroke="#f0c878" stroke-width="1.2" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="0.7"/>
    </g>
  </svg>`;
}

function sunsetIcon(size = 24) {
  const id = uid();
  return `<svg class="w-icon w-icon-metric w-icon-sunset" viewBox="0 0 32 32" width="${size}" height="${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="g-${id}" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="1.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    <g filter="url(#g-${id})">
      <!-- Horizon -->
      <line x1="4" y1="22" x2="28" y2="22" stroke="rgba(255,255,255,0.4)" stroke-width="1.2" stroke-linecap="round"/>
      <!-- Sun setting -->
      <g class="w-anim-set">
        <path d="M10 22a6 6 0 0 1 12 0" stroke="#e8935a" stroke-width="1.4" fill="none"/>
        <!-- Rays -->
        <line x1="16" y1="10" x2="16" y2="13" stroke="#e8935a" stroke-width="1.1" stroke-linecap="round" opacity="0.7"/>
        <line x1="8.5" y1="14" x2="10.5" y2="16" stroke="#e8935a" stroke-width="1" stroke-linecap="round" opacity="0.5"/>
        <line x1="23.5" y1="14" x2="21.5" y2="16" stroke="#e8935a" stroke-width="1" stroke-linecap="round" opacity="0.5"/>
      </g>
      <!-- Arrow down -->
      <polyline points="13,24 16,27 19,24" stroke="#e8935a" stroke-width="1.2" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="0.7"/>
    </g>
  </svg>`;
}

function visibilityIcon(size = 24) {
  const id = uid();
  return `<svg class="w-icon w-icon-metric w-icon-visibility" viewBox="0 0 32 32" width="${size}" height="${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="g-${id}" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="1" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    <g filter="url(#g-${id})" class="w-anim-pulse-soft">
      <!-- Eye shape -->
      <path d="M4 16s5-8 12-8 12 8 12 8-5 8-12 8S4 16 4 16z" stroke="#a8e6f0" stroke-width="1.3" fill="none" stroke-linejoin="round"/>
      <!-- Iris -->
      <circle cx="16" cy="16" r="4" stroke="#a8e6f0" stroke-width="1.2" fill="none"/>
      <!-- Pupil -->
      <circle cx="16" cy="16" r="1.5" fill="#a8e6f0" opacity="0.5"/>
    </g>
  </svg>`;
}

function thermometerIcon(size = 24) {
  const id = uid();
  return `<svg class="w-icon w-icon-metric w-icon-thermo" viewBox="0 0 32 32" width="${size}" height="${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="g-${id}" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="1" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    <g filter="url(#g-${id})" class="w-anim-pulse-soft">
      <!-- Thermometer body -->
      <path d="M14 6a2 2 0 0 1 4 0v14a4 4 0 1 1-4 0z" stroke="#a8e6f0" stroke-width="1.3" fill="none"/>
      <!-- Mercury level -->
      <line x1="16" y1="12" x2="16" y2="22" stroke="#e8935a" stroke-width="1.5" stroke-linecap="round" opacity="0.7"/>
      <circle cx="16" cy="24" r="2" fill="#e8935a" opacity="0.5"/>
      <!-- Tick marks -->
      <line x1="19" y1="10" x2="21" y2="10" stroke="#a8e6f0" stroke-width="0.8" stroke-linecap="round" opacity="0.4"/>
      <line x1="19" y1="14" x2="21" y2="14" stroke="#a8e6f0" stroke-width="0.8" stroke-linecap="round" opacity="0.4"/>
      <line x1="19" y1="18" x2="21" y2="18" stroke="#a8e6f0" stroke-width="0.8" stroke-linecap="round" opacity="0.4"/>
    </g>
  </svg>`;
}

// ─── BROKEN CLOUDS (heavier overcast) ───

function brokenCloudsIcon(size = 48) {
  const id = uid();
  return `<svg class="w-icon w-icon-clouds-heavy" viewBox="0 0 64 64" width="${size}" height="${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="g-${id}" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="1.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    <g filter="url(#g-${id})">
      <!-- Back cloud -->
      <g class="w-anim-drift" style="animation-delay:0.5s">
        <path d="M12 38h24a7 7 0 0 0 1-14A10 10 0 0 0 18 24a8 8 0 0 0-6 14z" 
              stroke="rgba(255,255,255,0.5)" stroke-width="1.3" fill="none" stroke-linejoin="round"/>
      </g>
      <!-- Front cloud -->
      <g class="w-anim-drift">
        <path d="M22 48h26a8 8 0 0 0 1.5-15.8A11 11 0 0 0 28 32a9 9 0 0 0-6 16z" 
              stroke="rgba(255,255,255,0.85)" stroke-width="1.6" fill="none" stroke-linejoin="round"/>
      </g>
    </g>
  </svg>`;
}

// ─── OPENWEATHERMAP CODE → SVG MAPPING ───

const OWM_ICON_MAP = {
  // Clear
  '01d': (s) => sunIcon(s),
  '01n': (s) => moonIcon(s),
  // Few clouds
  '02d': (s) => fewCloudsDay(s),
  '02n': (s) => fewCloudsNight(s),
  // Scattered clouds
  '03d': (s) => cloudIcon(s),
  '03n': (s) => cloudIcon(s),
  // Broken / overcast clouds
  '04d': (s) => brokenCloudsIcon(s),
  '04n': (s) => brokenCloudsIcon(s),
  // Shower rain
  '09d': (s) => showerRainIcon(s),
  '09n': (s) => showerRainIcon(s),
  // Rain
  '10d': (s) => rainIcon(s),
  '10n': (s) => rainIcon(s),
  // Thunderstorm
  '11d': (s) => thunderstormIcon(s),
  '11n': (s) => thunderstormIcon(s),
  // Snow
  '13d': (s) => snowIcon(s),
  '13n': (s) => snowIcon(s),
  // Mist / fog / haze
  '50d': (s) => mistIcon(s),
  '50n': (s) => mistIcon(s),
};

/**
 * Get animated SVG weather icon by OpenWeatherMap icon code.
 * @param {string} iconCode - OWM icon code like "01d", "10n", etc.
 * @param {number} size - pixel size (default 48)
 * @returns {string} SVG markup string
 */
export function getWeatherSVG(iconCode, size = 48) {
  const factory = OWM_ICON_MAP[iconCode];
  if (factory) return factory(size);
  // Fallback: cloud icon
  return cloudIcon(size);
}

/**
 * Get animated SVG metric icon.
 * @param {'wind'|'humidity'|'uv'|'aqi'|'sunrise'|'sunset'|'visibility'|'thermometer'} type
 * @param {number} size
 * @returns {string} SVG markup string
 */
export function getMetricSVG(type, size = 22) {
  const map = {
    wind: windIcon,
    humidity: humidityIcon,
    uv: uvIcon,
    aqi: aqiIcon,
    sunrise: sunriseIcon,
    sunset: sunsetIcon,
    visibility: visibilityIcon,
    thermometer: thermometerIcon,
  };
  const factory = map[type];
  return factory ? factory(size) : '';
}

// Export individual icons for direct usage
export const weatherIcons = {
  sun: sunIcon,
  moon: moonIcon,
  cloud: cloudIcon,
  fewCloudsDay,
  fewCloudsNight,
  rain: rainIcon,
  showerRain: showerRainIcon,
  thunderstorm: thunderstormIcon,
  snow: snowIcon,
  mist: mistIcon,
  brokenClouds: brokenCloudsIcon,
  wind: windIcon,
  humidity: humidityIcon,
  uv: uvIcon,
  aqi: aqiIcon,
  sunrise: sunriseIcon,
  sunset: sunsetIcon,
  visibility: visibilityIcon,
  thermometer: thermometerIcon,
};

export default { getWeatherSVG, getMetricSVG, weatherIcons };
