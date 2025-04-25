const apiKey = "4a758dd1aed04dc3950175920231609";
var map = L.map("map").setView([0, 0], 13);
var marker;
var locationTimezone = null;

function initializeMap(lat, lon) {
  if (!marker) {
    marker = L.marker([lat, lon]).addTo(map);
  } else {
    marker.setLatLng([lat, lon]).update();
  }
  map.setView([lat, lon], 13);
}

function updateLocalTime() {
  if (locationTimezone) {
    const now = new Date();
    const localTime = new Intl.DateTimeFormat("en-US", {
      timeZone: locationTimezone,
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hour12: true,
    }).format(now);

    document.getElementById("local-time").innerHTML = localTime;
  }
}

async function fetchWeatherData(location) {
  try {
    const response = await fetch(
      `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${location}&days=7`
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error?.message || "Failed to fetch weather data"
      );
    }

    const data = await response.json();
    const { location: locationData, current: currentData, forecast } = data;
    const { forecastday: forecastDays } = forecast;

    updateWeatherUI(locationData, currentData, forecastDays);

    initializeMap(locationData.lat, locationData.lon);
    fetchWeatherHistory(locationData.lat, locationData.lon);
  } catch (error) {
    console.error("Weather API Error:", error);
    showErrorToUser(
      error.message || "Failed to fetch weather data. Please try again."
    );
  }
}

function showErrorToUser(message) {
  alert(message);
}

function updateWeatherUI(locationData, currentData, forecastDays) {
  document.getElementById("location").innerHTML = locationData.name;
  document.querySelector(".temperature").innerHTML = `${currentData.temp_c}°C`;
  document.querySelector(".description").innerHTML = currentData.condition.text;
  document.getElementById("weatherIcon").src = currentData.condition.icon;

  locationTimezone = locationData.tz_id;
  setInterval(updateLocalTime, 1000); //every 1000 seconds call the update local time

  const details = {
    ".tz_id": locationData.tz_id,
    ".temp_c": `${currentData.temp_c}°C`,
    ".humidity": `${currentData.humidity}%`,
    ".wind_kph": `${currentData.wind_kph} kph`,
    ".url": currentData.condition.text,
    ".region": locationData.region,
    ".country": locationData.country,
    "#lon": locationData.lon,
    "#lat": locationData.lat,
  };

  Object.entries(details).forEach(([selector, value]) => {
    const element = document.querySelector(selector);
    if (element) element.innerHTML = value;
  });

  forecastDays.slice(0, 2).forEach((forecast, i) => {
    const dayNumber = i + 1;
    document.querySelector(`#date${dayNumber}`).innerHTML = forecast.date;
    document.querySelector(
      `#temp${dayNumber}`
    ).innerHTML = `${forecast.day.avgtemp_c}°C`;
    document.querySelector(`#desc${dayNumber}`).innerHTML =
      forecast.day.condition.text;
    document
      .querySelector(`#img${dayNumber}`)
      .setAttribute("src", forecast.day.condition.icon);
  });
}

async function fetchWeatherHistory(lat, lon) {
  const today = new Date();

  for (let i = 1; i <= 7; i++) {
    const pastDate = new Date();
    pastDate.setDate(today.getDate() - i);
    const formattedDate = pastDate.toISOString().split("T")[0]; //return only yyyy-mm-dd
    console.log(`Fetching history for: ${formattedDate}`);

    try {
      const response = await fetch(
        `https://api.weatherapi.com/v1/history.json?key=${apiKey}&q=${lat},${lon}&dt=${formattedDate}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (
        data &&
        data.forecast &&
        data.forecast.forecastday &&
        data.forecast.forecastday.length > 0
      ) {
        const historyData = data.forecast.forecastday[0];
        console.log("Fetched history data:", historyData);

        document.getElementById(`history-date${i}`).innerHTML =
          historyData.date;
        document.getElementById(`history-temp${i}`).innerHTML =
          historyData.day.avgtemp_c + "°C";
        document.getElementById(`history-desc${i}`).innerHTML =
          historyData.day.condition.text;
        document.getElementById(`history-img${i}`).src =
          historyData.day.condition.icon;
      } else {
        console.log(`No history data available for date: ${formattedDate}`);
      }
    } catch (error) {
      console.error(
        `Error fetching historical data for date: ${formattedDate}`,
        error
      );
      alert("Error fetching weather history. Please try again.");
    }
  }
}

function handleSearch() {
  const location = document.getElementById("location-input").value;
  if (location) {
    fetchWeatherData(location);
  } else {
    alert("Please enter a location");
  }
}

document
  .getElementById("search-button")
  .addEventListener("click", handleSearch);

navigator.geolocation.getCurrentPosition(
  function (position) {
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;
    fetchWeatherData(`${lat},${lon}`);
  },
  function () {
    fetchWeatherData("Colombo");
  }
);
