// Enhanced weather display with charts
export function renderWeatherCharts(hourlyData) {
    if (!hourlyData || hourlyData.length === 0) return '';

    return `
    <!-- Charts Section -->
    <div class="premium-glass col-span-2 p-5 mb-5 fade-in" style="animation-delay: 1s">
      <h3 class="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4 border-b border-white/10 pb-2">
        <ion-icon name="bar-chart-outline" class="align-middle"></ion-icon> Temperature & Precipitation
      </h3>
      
      <!-- Temperature Chart -->
      <div class="mb-6">
        <div class="text-xs text-slate-400 mb-2 uppercase">24-Hour Temperature</div>
        <div class="relative h-[180px]">
          <canvas id="temperature-chart"></canvas>
        </div>
      </div>
      
      <!-- Precipitation Chart -->
      <div>
        <div class="text-xs text-slate-400 mb-2 uppercase">Precipitation Probability</div>
        <div class="relative h-[150px]">
          <canvas id="precipitation-chart"></canvas>
        </div>
      </div>
    </div>
  `;
}

// Astronomy data display
export function renderAstronomyData(astronomyData, formatters, astronomyService) {
    if (!astronomyData) return '';

    return `
    <div class="premium-glass col-span-2 p-5 mb-5 fade-in" style="animation-delay: 1.1s">
      <h3 class="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4 border-b border-white/10 pb-2">
        <ion-icon name="sunny-outline" class="align-middle"></ion-icon> Sun & Moon
      </h3>
      
      <div class="grid grid-cols-2 gap-4">
        <!-- Sun Data -->
        <div>
          <div class="text-xs text-slate-400 uppercase mb-3">Sun</div>
          <div class="space-y-2">
            <div class="flex justify-between items-center">
              <span class="text-sm text-slate-300">Sunrise</span>
              <span class="font-bold text-amber-300">${formatters.formatTime(astronomyData.sun.sunrise)}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-sm text-slate-300">Sunset</span>
              <span class="font-bold text-orange-300">${formatters.formatTime(astronomyData.sun.sunset)}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-sm text-slate-300">Day Length</span>
              <span class="font-bold">${astronomyData.sun.dayLength}h</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-sm text-slate-300">Golden Hour</span>
              <span class="font-bold text-yellow-300">${formatters.formatTime(astronomyData.sun.goldenHour)}</span>
            </div>
          </div>
        </div>
        
        <!-- Moon Data -->
        <div>
          <div class="text-xs text-slate-400 uppercase mb-3">Moon</div>
          <div class="space-y-2">
            <div class="flex justify-between items-center">
              <span class="text-sm text-slate-300">Phase</span>
              <span class="font-bold text-xl">${astronomyService.getMoonPhaseEmoji(astronomyData.moon.phase)} ${astronomyData.moon.phaseName}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-sm text-slate-300">Illumination</span>
              <span class="font-bold">${astronomyData.moon.illumination}%</span>
            </div>
            ${astronomyData.moon.moonrise ? `
            <div class="flex justify-between items-center">
              <span class="text-sm text-slate-300">Moonrise</span>
              <span class="font-bold">${formatters.formatTime(astronomyData.moon.moonrise)}</span>
            </div>` : ''}
            ${astronomyData.moon.moonset ? `
            <div class="flex justify-between items-center">
              <span class="text-sm text-slate-300">Moonset</span>
              <span class="font-bold">${formatters.formatTime(astronomyData.moon.moonset)}</span>
            </div>` : ''}
          </div>
        </div>
      </div>
    </div>
  `;
}
