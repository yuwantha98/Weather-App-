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

    document.getElementById("local-time").textContent = localTime;
  }
}

function fetchWeatherData(location) {
  $.ajax({
    method: "GET",
    url: `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${location}&days=7`,
    success: function (data) {
      const locationData = data.location;
      const currentData = data.current;
      const forecastDays = data.forecast.forecastday;

      document.getElementById("location").textContent = locationData.name;
      document.querySelector(".temperature").textContent =
        currentData.temp_c + "°C";
      document.querySelector(".description").textContent =
        currentData.condition.text;
      document.getElementById("weatherIcon").src = currentData.condition.icon;

      locationTimezone = locationData.tz_id;
      setInterval(updateLocalTime, 1000);

      document.querySelector(".tz_id").textContent = locationData.tz_id;
      document.querySelector(".temp_c").textContent = currentData.temp_c + "°C";
      document.querySelector(".humidity").textContent =
        currentData.humidity + "%";
      document.querySelector(".wind_kph").textContent =
        currentData.wind_kph + " kph";
      document.querySelector(".url").textContent = currentData.condition.text;
      document.querySelector(".region").textContent = locationData.region;
      document.querySelector(".country").textContent = locationData.country;
      document.getElementById("lon").textContent = locationData.lon;
      document.getElementById("lat").textContent = locationData.lat;

      for (let i = 0; i < 6; i++) {
        const forecast = forecastDays[i];
        document.getElementById(`date${i + 1}`).textContent = forecast.date;
        document.getElementById(`temp${i + 1}`).textContent =
          forecast.day.avgtemp_c + "°C";
        document.getElementById(`desc${i + 1}`).textContent =
          forecast.day.condition.text;
        document.getElementById(`img${i + 1}`).src =
          forecast.day.condition.icon;
      }

      initializeMap(locationData.lat, locationData.lon);
      fetchWeatherHistory(locationData.lat, locationData.lon);
    },
    error: function () {
      alert("Error fetching weather data. Please try again.");
    },
  });
}

function fetchWeatherHistory(lat, lon) {
  const today = new Date();
  for (let i = 1; i <= 7; i++) {
    const pastDate = new Date();
    pastDate.setDate(today.getDate() - i);
    const formattedDate = pastDate.toISOString().split("T")[0];
    console.log(`Fetching history for: ${formattedDate}`);

    $.ajax({
      method: "GET",
      url: `https://api.weatherapi.com/v1/history.json?key=${apiKey}&q=${lat},${lon}&dt=${formattedDate}`,
      success: function (data) {
        if (
          data &&
          data.forecast &&
          data.forecast.forecastday &&
          data.forecast.forecastday.length > 0
        ) {
          const historyData = data.forecast.forecastday[0];
          console.log("Fetched history data:", historyData);

          document.getElementById(`history-date${i}`).textContent =
            historyData.date;
          document.getElementById(`history-temp${i}`).textContent =
            historyData.day.avgtemp_c + "°C";
          document.getElementById(`history-desc${i}`).textContent =
            historyData.day.condition.text;
          document.getElementById(`history-img${i}`).src =
            historyData.day.condition.icon;
        } else {
          console.log(`No history data available for date: ${formattedDate}`);
        }
      },
      error: function (xhr, status, error) {
        console.error(
          `Error fetching historical data for date: ${formattedDate}`,
          error
        );
        alert("Error fetching weather history. Please try again.");
      },
    });
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
