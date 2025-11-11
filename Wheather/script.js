// Weather app with icons and Celsius/Fahrenheit toggle

const locBtn = document.getElementById('locBtn');
const cityBtn = document.getElementById('cityBtn');
const cityInput = document.getElementById('cityInput');
const locationNameEl = document.getElementById('locationName');
const currentShort = document.getElementById('currentShort');
const forecastEl = document.getElementById('forecast');

locBtn.addEventListener('click', () => {
  if (!navigator.geolocation) {
    alert('Your browser does not support geolocation. Please search for a city.');
    return;
  }
  currentShort.textContent = 'Getting your location…';
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const { latitude, longitude } = pos.coords;
      await fetchAndRender(latitude, longitude, 'Your Current Location');
    },
    (err) => {
      currentShort.textContent = 'Could not get your location.';
      console.error(err);
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
});

cityBtn.addEventListener('click', async () => {
  const q = cityInput.value.trim();
  if (!q) return alert('Please enter a city name.');
  currentShort.textContent = `Searching for "${q}"…`;
  try {
    const geoURL = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`;
    const res = await fetch(geoURL, { headers: { 'User-Agent': 'weather-app-demo/1.0' } });
    const data = await res.json();
    if (!data || !data[0]) {
      currentShort.textContent = 'City not found.';
      return;
    }
    const { lat, lon, display_name } = data[0];
    await fetchAndRender(lat, lon, display_name);
  } catch (err) {
    currentShort.textContent = 'Error fetching location.';
    console.error(err);
  }
});

async function fetchAndRender(lat, lon, nameDisplay) {
  locationNameEl.textContent = `Location: ${nameDisplay}`;
  forecastEl.innerHTML = '';
  currentShort.textContent = 'Loading weather…';

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode&timezone=auto&forecast_days=7`;
  try {
    const res = await fetch(url);
    const data = await res.json();

    if (!data || !data.daily) {
      currentShort.textContent = 'Weather data unavailable.';
      return;
    }

    const todayIndex = 0;
    const tmax = data.daily.temperature_2m_max[todayIndex];
    const tmin = data.daily.temperature_2m_min[todayIndex];
    const code = data.daily.weathercode[todayIndex];
    const rain = data.daily.precipitation_sum[todayIndex];
    const icon = getWeatherIcon(code);

    currentShort.innerHTML = `${icon} Today: ${interpretWeatherCode(code)} — ${tmin.toFixed(0)}°C / ${tmax.toFixed(0)}°C (${cToF(tmin)}°F / ${cToF(tmax)}°F) — Rain: ${rain.toFixed(1)}mm`;

    const { time, temperature_2m_max, temperature_2m_min, precipitation_sum, weathercode } = data.daily;

    for (let i = 0; i < time.length; i++) {
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <div class="day">${formatDate(time[i])}</div>
        <div class="icon">${getWeatherIcon(weathercode[i])}</div>
        <div class="temp">${temperature_2m_max[i].toFixed(0)}°C / ${temperature_2m_min[i].toFixed(0)}°C</div>
        <div class="small">(${cToF(temperature_2m_max[i])}°F / ${cToF(temperature_2m_min[i])}°F)</div>
        <div class="small">${interpretWeatherCode(weathercode[i])}</div>
        <div class="small">Rain: ${precipitation_sum[i].toFixed(1)} mm</div>
      `;
      forecastEl.appendChild(card);
    }
  } catch (err) {
    currentShort.textContent = 'Error fetching weather.';
    console.error(err);
  }
}

function formatDate(iso) {
  const d = new Date(iso);
  const opt = { weekday: 'short', month: 'short', day: 'numeric' };
  return d.toLocaleDateString('en-US', opt);
}

function interpretWeatherCode(code) {
  if (code === 0) return 'Clear sky';
  if (code === 1 || code === 2) return 'Mostly clear';
  if (code === 3) return 'Cloudy';
  if (code >= 45 && code <= 48) return 'Foggy';
  if (code >= 51 && code <= 67) return 'Rain / Snow';
  if (code >= 80 && code <= 82) return 'Showers';
  if (code >= 95 && code <= 99) return 'Thunderstorms';
  return 'Unknown';
}

function getWeatherIcon(code) {
  if (code === 0) return '☀️';
  if (code === 1 || code === 2) return '🌤️';
  if (code === 3) return '☁️';
  if (code >= 45 && code <= 48) return '🌫️';
  if (code >= 51 && code <= 67) return '🌧️';
  if (code >= 80 && code <= 82) return '🌦️';
  if (code >= 95 && code <= 99) return '⛈️';
  return '❓';
}

function cToF(c) {
  return ((c * 9) / 5 + 32).toFixed(1);
}