// Weather API Configuration
const API_KEY = 'e4d6c5b7f8a9c2e3d4b5a6c7'; // Use your own API key from openweathermap.org
const API_URL = 'https://api.openweathermap.org/data/2.5';

// State
let currentCity = 'Cairo';
let savedCities = JSON.parse(localStorage.getItem('savedCities')) || ['Cairo', 'Alexandria', 'Giza'];

// DOM Elements
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const locationBtn = document.getElementById('locationBtn');
const forecastContainer = document.getElementById('forecastContainer');
const hourlyContainer = document.getElementById('hourlyContainer');
const savedCitiesContainer = document.getElementById('savedCitiesContainer');

// Event Listeners
searchBtn.addEventListener('click', () => searchCity());
cityInput.addEventListener('keypress', (e) => e.key === 'Enter' && searchCity());
locationBtn.addEventListener('click', getLocationWeather);

// Initialize
window.addEventListener('DOMContentLoaded', () => {
    loadWeather(currentCity);
    renderSavedCities();
});

// Search City
function searchCity() {
    const city = cityInput.value.trim();
    if (city) {
        loadWeather(city);
        cityInput.value = '';
    }
}

// Get Location Weather
function getLocationWeather() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                fetch(`${API_URL}/weather?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric&lang=ar`)
                    .then(res => res.json())
                    .then(data => {
                        currentCity = data.name;
                        displayWeather(data);
                        loadForecast();
                        loadHourly();
                    })
                    .catch(err => showError('خطأ في الحصول على بيانات الطقس'));
            },
            () => showError('يرجى تفعيل خدمات الموقع')
        );
    }
}

// Load Weather
function loadWeather(city) {
    showLoading();
    fetch(`${API_URL}/weather?q=${city}&appid=${API_KEY}&units=metric&lang=ar`)
        .then(res => {
            if (!res.ok) throw new Error('City not found');
            return res.json();
        })
        .then(data => {
            currentCity = data.name;
            displayWeather(data);
            loadForecast();
            loadHourly();
            addToSavedCities(city);
        })
        .catch(err => showError('لم يتم العثور على المدينة'));
}

// Display Weather
function displayWeather(data) {
    document.getElementById('cityName').textContent = data.name;
    document.getElementById('temperature').textContent = Math.round(data.main.temp) + '°';
    document.getElementById('weatherDesc').textContent = data.weather[0].main;
    document.getElementById('humidity').textContent = data.main.humidity + '%';
    document.getElementById('windSpeed').textContent = Math.round(data.wind.speed) + ' كم/س';
    document.getElementById('pressure').textContent = data.main.pressure + ' mb';
    document.getElementById('visibility').textContent = (data.visibility / 1000).toFixed(1) + ' كم';
    document.getElementById('weatherIcon').src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@4x.png`;
}

// Load Forecast
function loadForecast() {
    fetch(`${API_URL}/forecast?q=${currentCity}&appid=${API_KEY}&units=metric&lang=ar`)
        .then(res => res.json())
        .then(data => {
            const forecastList = data.list.filter((item, index) => index % 8 === 0).slice(0, 5);
            forecastContainer.innerHTML = '';
            forecastList.forEach(item => {
                const date = new Date(item.dt * 1000);
                const card = document.createElement('div');
                card.className = 'forecast-card';
                card.innerHTML = `
                    <div class="forecast-date">${date.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })}</div>
                    <img src="https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png" class="forecast-icon">
                    <div class="forecast-temp">${Math.round(item.main.temp)}°</div>
                    <div class="forecast-desc">${item.weather[0].main}</div>
                `;
                forecastContainer.appendChild(card);
            });
        });
}

// Load Hourly
function loadHourly() {
    fetch(`${API_URL}/forecast?q=${currentCity}&appid=${API_KEY}&units=metric&lang=ar`)
        .then(res => res.json())
        .then(data => {
            const hourlyList = data.list.slice(0, 8);
            hourlyContainer.innerHTML = '';
            hourlyList.forEach(item => {
                const date = new Date(item.dt * 1000);
                const card = document.createElement('div');
                card.className = 'hourly-card';
                card.innerHTML = `
                    <div class="hourly-time">${date.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</div>
                    <img src="https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png" class="hourly-icon">
                    <div class="hourly-temp">${Math.round(item.main.temp)}°</div>
                `;
                hourlyContainer.appendChild(card);
            });
        });
}

// Add to Saved Cities
function addToSavedCities(city) {
    if (!savedCities.includes(city)) {
        savedCities.unshift(city);
        if (savedCities.length > 10) savedCities.pop();
        localStorage.setItem('savedCities', JSON.stringify(savedCities));
        renderSavedCities();
    }
}

// Render Saved Cities
function renderSavedCities() {
    savedCitiesContainer.innerHTML = '';
    savedCities.forEach(city => {
        fetch(`${API_URL}/weather?q=${city}&appid=${API_KEY}&units=metric&lang=ar`)
            .then(res => res.json())
            .then(data => {
                const card = document.createElement('div');
                card.className = 'city-card';
                card.innerHTML = `
                    <button class="remove-city" onclick="removeCity('${city}')">×</button>
                    <div class="city-card-name">${data.name}</div>
                    <div class="city-card-temp">${Math.round(data.main.temp)}°</div>
                    <div class="city-card-desc">${data.weather[0].main}</div>
                `;
                card.addEventListener('click', () => loadWeather(city));
                savedCitiesContainer.appendChild(card);
            })
            .catch(err => console.log(`Error loading ${city}`));
    });
}

// Remove City
function removeCity(city) {
    event.stopPropagation();
    savedCities = savedCities.filter(c => c !== city);
    localStorage.setItem('savedCities', JSON.stringify(savedCities));
    renderSavedCities();
}

// Show Loading
function showLoading() {
    document.getElementById('currentWeather').innerHTML = '<div class="loading"><div class="spinner"></div><p>جاري التحميل...</p></div>';
}

// Show Error
function showError(message) {
    document.getElementById('currentWeather').innerHTML = `<div class="loading" style="color: #ef4444;">${message}</div>`;
}
