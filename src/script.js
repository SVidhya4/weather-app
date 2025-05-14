const tomorrowApiKey = "44dTiqaGXDT0ZRxCrhwE5e28jjzrigj5";
const openCageApiKey = "c4a2703368534a84b363ef5b5980f169";



const weatherDescriptions = {
  1000: "Clear", 1001: "Cloudy", 1100: "Mostly Clear", 1101: "Partly Cloudy", 1102: "Mostly Cloudy",
  2000: "Fog", 4000: "Drizzle", 4200: "Light Rain", 4201: "Heavy Rain",
  5001: "Flurries", 5100: "Light Snow", 5101: "Heavy Snow",
  6000: "Freezing Drizzle", 6001: "Freezing Rain", 7000: "Ice Pellets",
  7101: "Heavy Ice Pellets", 8000: "Thunderstorm"
};


function getEmoji(code, timeStr) {
  const hour = new Date(timeStr).getHours();
  const isNight = hour < 6 || hour > 18; // crude night check

  const emojiMapDay = {
    1000: "☀️", 1100: "🌤️", 1101: "🌥️", 1102: "☁️",
    1001: "☁️", 2000: "🌫️", 4000: "🌦️", 4200: "🌧️",
    4201: "🌧️", 5001: "🌨️", 5100: "🌨️", 5101: "❄️",
    6000: "🌧️", 6001: "🌧️", 7000: "🌨️", 7101: "🌨️",
    8000: "⛈️"
  };

  const emojiMapNight = {
    1000: "🌕", 1100: "🌖", 1101: "🌗", 1102: "🌑",
    1001: "☁️", 2000: "🌫️", 4000: "🌦️", 4200: "🌧️",
    4201: "🌧️", 5001: "🌨️", 5100: "🌨️", 5101: "❄️",
    6000: "🌧️", 6001: "🌧️", 7000: "🌨️", 7101: "🌨️",
    8000: "⛈️"
  };

  const map = isNight ? emojiMapNight : emojiMapDay;
  return map[code] || "❓";
}


const weather = {
  fetchWeatherByCoords: function (lat, lon) {
    document.querySelector(".weather").classList.add("loading");
    Promise.all([
      fetch(`https://api.tomorrow.io/v4/weather/realtime?location=${lat},${lon}&apikey=${tomorrowApiKey}`).then((res) => res.json()),
      fetch(`https://api.tomorrow.io/v4/weather/forecast?location=${lat},${lon}&timesteps=1h&apikey=${tomorrowApiKey}`).then((res) => res.json()),
      fetch(`https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lon}&key=${openCageApiKey}`).then((res) => res.json())
    ])
      .then(([realtimeData, forecastData, locationData]) => {
        this.displayWeather(realtimeData, locationData);
        this.displayForecast(forecastData);
        this.getAQI(lat, lon);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        alert("Weather data not available.");
        document.querySelector(".weather").classList.remove("loading");
      });
  },

  fetchWeather: function (query) {
    fetch(`https://api.opencagedata.com/geocode/v1/json?q=${query}&key=${openCageApiKey}`)
      .then((res) => res.json())
      .then((locationData) => {
        if (!locationData.results.length) throw new Error("Location not found.");
        const { lat, lng } = locationData.results[0].geometry;
        
        this.fetchWeatherByCoords(lat, lng);
      })
      .catch((error) => {
        console.error(error);
        alert("Location not found.");
      });
  },
    
  getTimeOfDayPhase: function (isoTime) {
    const hour = new Date(isoTime).getHours();

    if (hour >= 6 && hour < 18) return "day";
    if (hour >= 18 && hour < 20) return "evening";
    return "night";
  },

  
  updateBackground: function (weatherCode, isoTime) {
    const phase = this.getTimeOfDayPhase(isoTime); // "day", "evening", or "night"
    const body = document.body;
    let baseName = "default";

    if ([1000].includes(weatherCode)) {
      baseName = (phase === "night") ? "clear" : "sunny";
    } else if ([1100, 1101, 1102, 1001].includes(weatherCode)) {
      baseName = "cloudy";
    } else if ([4000, 4200, 4201].includes(weatherCode)) {
      baseName = "rainy";
    } else if ([5000, 5100, 5101].includes(weatherCode)) {
      baseName = "snow";
    } else if ([8000].includes(weatherCode)) {
      baseName = "thunder";
    }


    body.style.backgroundImage = `url('/images/${baseName}-${phase}.jpg')`;
  },

  displayWeather: function (data, locationData) {
    const values = data?.data?.values;
    if (!values) return;

    const components = locationData.results[0]?.components || {};
    const name = components.city || components.town || components.village || components.county || components.state || "Unknown";

    const emoji = getEmoji(values.weatherCode, data.data.time);

    const descriptionText = weatherDescriptions[values.weatherCode] || "Weather";

    document.querySelector(".city").innerText = `Weather in ${name}`;
    document.querySelector(".temp").innerText = `${values.temperature?.toFixed(1)}°C`;
    
    document.querySelector(".description").innerHTML = `
      <span style="font-size: 1.5rem;">${emoji}</span> ${descriptionText}
    `;

    document.querySelector(".humidity").innerText = `Humidity: ${values.humidity}%`;
    document.querySelector(".wind").innerText = `Wind speed: ${values.windSpeed?.toFixed(1)} km/h`;
    document.querySelector(".precip-value").innerText = `🌧️${values.precipitationProbability ?? 0}%`;



    document.querySelector(".weather").classList.remove("loading");

    this.updateBackground(values.weatherCode, data.data.time);

    // Right card details
    const gridItems = document.querySelectorAll(".right-card .grid .detail-item");

    gridItems[0].innerHTML = `
      <img src="images/uv-index.png" alt="UV Index" class="icon">
      <strong>UV</strong><br/>${values.uvIndex ?? "N/A"}`;

    gridItems[1].innerHTML = `
      <img src="images/dew-point.png" alt="Dew Point" class="icon">
      <strong>Dew</strong><br/>${values.dewPoint?.toFixed(1) ?? "N/A"}°C`;

    gridItems[2].innerHTML = `
      <img src="images/pressure.jpg" alt="Pressure" class="icon">
      <strong>Pressure</strong><br/>${values.pressureSeaLevel?.toFixed(2) ?? "N/A"} hPa`;

    gridItems[3].innerHTML = `
      <img src="images/visibility.png" alt="Visibility" class="icon">
      <strong>Visibility</strong><br/>${(values.visibility / 1000).toFixed(2)} km`;

  },

  displayForecast: function (data) {
  const forecastList = document.querySelector(".forecast-list");
  forecastList.innerHTML = ""; // clear old content only

  const hours = data?.timelines?.hourly?.slice(0, 5);
  if (!hours || hours.length === 0) {
    forecastList.innerHTML = "<p>No forecast data.</p>";
    return;
  }

  hours.forEach((hour) => {
    const time = new Date(hour.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const temp = hour.values.temperature?.toFixed(1);
    const code = hour.values.weatherCode;
    const emoji = getEmoji(code, hour.time);

    const forecastItem = document.createElement("div");
    forecastItem.style.display = "flex";
    forecastItem.style.alignItems = "center";
    forecastItem.style.gap = "0.5em";
    forecastItem.style.margin = "0.2em 0";
    forecastItem.style.height = "40px";

    forecastItem.innerHTML = `
      <span style="font-size: 1.4rem;">${emoji}</span>
      <span>${time}: ${temp}°C</span>
    `;
    forecastList.appendChild(forecastItem);
  });
},
getAQI: async function(lat, lon) {
  try {
    const token = "955829869d41b6ace7a3670ce13c2f0aa88bdfcb";
    const response = await fetch(`https://api.waqi.info/feed/geo:${lat};${lon}/?token=${token}`);
    const data = await response.json();

    if (data.status === "ok") {
      const aqi = data.data.aqi;
      this.updateAQICard(aqi);
    } else {
      document.getElementById("aqi-value").textContent = "Unavailable";
      document.getElementById("aqi-description").textContent = "Could not fetch AQI";
    }
  } catch (error) {
    console.error("AQI Error:", error);
    document.getElementById("aqi-value").textContent = "Error";
    document.getElementById("aqi-description").textContent = "Failed to load AQI";
  }
},

updateAQICard: function (aqi) {
  const aqiValue = document.getElementById("aqi-value");
  const aqiDescription = document.getElementById("aqi-description");

  const levels = [
    { max: 50, desc: "Good 😊" },
    { max: 100, desc: "Moderate 😐" },
    { max: 150, desc: "Unhealthy for Sensitive 😷" },
    { max: 200, desc: "Unhealthy 😷" },
    { max: 300, desc: "Very Unhealthy 😫" },
    { max: Infinity, desc: "Hazardous ☠️" },
  ];

  const level = levels.find(l => aqi <= l.max);
  aqiValue.textContent = `AQI: ${aqi}`;
  aqiDescription.textContent = level ? level.desc : "Unknown";
},

  search: function () {
    const query = document.querySelector(".search-bar").value.trim();
    if (query) this.fetchWeather(query);
  },
};

// Auto fetch by geolocation
window.addEventListener("load", () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        weather.fetchWeatherByCoords(latitude, longitude);
      },
      () => weather.fetchWeather("Hyderabad")
    );
  } else {
    weather.fetchWeather("Hyderabad");
  }
});

// Search listeners
document.querySelector(".search button").addEventListener("click", () => weather.search());
document.querySelector(".search-bar").addEventListener("keyup", (e) => {
  if (e.key === "Enter") weather.search();
});
