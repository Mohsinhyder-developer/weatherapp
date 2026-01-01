import SunCalc from 'suncalc';

class AstronomyService {
    /**
     * Get comprehensive sun and moon data
     */
    getSunMoonData(lat, lon, date = new Date()) {
        const times = SunCalc.getTimes(date, lat, lon);
        const moonIllumination = SunCalc.getMoonIllumination(date);
        const moonTimes = SunCalc.getMoonTimes(date, lat, lon);
        const sunPosition = SunCalc.getPosition(date, lat, lon);

        return {
            sun: {
                sunrise: times.sunrise,
                sunset: times.sunset,
                solarNoon: times.solarNoon,
                dawn: times.dawn,
                dusk: times.dusk,
                nauticalDawn: times.nauticalDawn,
                nauticalDusk: times.nauticalDusk,
                nightEnd: times.nightEnd,
                night: times.night,
                goldenHourEnd: times.goldenHourEnd,
                goldenHour: times.goldenHour,
                altitude: sunPosition.altitude,
                azimuth: sunPosition.azimuth,
                dayLength: this.calculateDayLength(times.sunrise, times.sunset)
            },
            moon: {
                phase: moonIllumination.phase,
                illumination: Math.round(moonIllumination.fraction * 100),
                angle: moonIllumination.angle,
                moonrise: moonTimes.rise,
                moonset: moonTimes.set,
                phaseName: this.getMoonPhaseName(moonIllumination.phase)
            }
        };
    }

    /**
     * Calculate day length in hours
     */
    calculateDayLength(sunrise, sunset) {
        const diff = sunset - sunrise;
        const hours = diff / (1000 * 60 * 60);
        return hours.toFixed(1);
    }

    /**
     * Get moon phase name
     */
    getMoonPhaseName(phase) {
        if (phase < 0.033) return 'New Moon';
        if (phase < 0.216) return 'Waxing Crescent';
        if (phase < 0.283) return 'First Quarter';
        if (phase < 0.466) return 'Waxing Gibbous';
        if (phase < 0.533) return 'Full Moon';
        if (phase < 0.716) return 'Waning Gibbous';
        if (phase < 0.783) return 'Last Quarter';
        if (phase < 0.966) return 'Waning Crescent';
        return 'New Moon';
    }

    /**
     * Get moon phase emoji
     */
    getMoonPhaseEmoji(phase) {
        if (phase < 0.033) return '🌑';
        if (phase < 0.216) return '🌒';
        if (phase < 0.283) return '🌓';
        if (phase < 0.466) return '🌔';
        if (phase < 0.533) return '🌕';
        if (phase < 0.716) return '🌖';
        if (phase < 0.783) return '🌗';
        if (phase < 0.966) return '🌘';
        return '🌑';
    }

    /**
     * Check if it's currently daytime
     */
    isDaytime(lat, lon, date = new Date()) {
        const times = SunCalc.getTimes(date, lat, lon);
        return date >= times.sunrise && date <= times.sunset;
    }

    /**
     * Check if it's golden hour
     */
    isGoldenHour(lat, lon, date = new Date()) {
        const times = SunCalc.getTimes(date, lat, lon);
        return (
            (date >= times.goldenHourEnd && date <= times.solarNoon) ||
            (date >= times.goldenHour && date <= times.sunset)
        );
    }
}

export default new AstronomyService();
